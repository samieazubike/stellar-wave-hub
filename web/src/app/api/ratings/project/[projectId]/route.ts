import { ratingsCol, usersCol } from "@/lib/db";
export const dynamic = "force-dynamic";

type UserRow = {
  username?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const snap = await ratingsCol.ref
    .where("project_id", "==", Number(projectId))
    .orderBy("created_at", "desc")
    .get();

  const ratings = await Promise.all(
    snap.docs.map(async (d) => {
      const r = d.data();
      let username = "unknown";
      if (r.user_id) {
        const u = await usersCol.ref.doc(String(r.user_id)).get();
        if (u.exists) {
          const user = u.data() as UserRow;
          username = user.username ?? "unknown";
        }
      }
      return { ...r, id: r.numericId ?? d.id, username };
    })
  );

  return Response.json({ ratings });
}
