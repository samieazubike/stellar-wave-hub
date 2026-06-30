import { projectsCol, usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isClaimStale } from "@/lib/claims";
import { getSupabase } from "@/lib/firebase";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const snap = await projectsCol.ref
    .where("status", "==", "submitted")
    .orderBy("created_at", "desc")
    .get();

  const supabase = getSupabase();

  const projects = await Promise.all(
    snap.docs.map(async (d) => {
      const p = d.data();

      const claimed_by = p.claimed_by as number | null;
      const claimed_at = p.claimed_at as string | null;

      if (claimed_by && claimed_at && isClaimStale(claimed_at)) {
        await supabase
          .from("projects")
          .update({ claimed_by: null, claimed_at: null })
          .eq("numericId", p.numericId as number);
        (p as any).claimed_by = null;
        (p as any).claimed_at = null;
      }

      const userCache = new Map<number, string>();
      if (p.user_id) {
        const uDoc = await usersCol.ref.doc(String(p.user_id)).get();
        userCache.set(p.user_id as number, uDoc.exists ? uDoc.data()!.username : null);
      }
      if (p.claimed_by) {
        const uDoc = await usersCol.ref.doc(String(p.claimed_by)).get();
        userCache.set(p.claimed_by as number, uDoc.exists ? uDoc.data()!.username : "unknown");
      }

      return {
        ...p,
        id: p.numericId,
        username: p.user_id ? userCache.get(p.user_id as number) : null,
        claimed_by_username: p.claimed_by ? userCache.get(p.claimed_by as number) : null,
      };
    })
  );

  return Response.json({ projects });
}
