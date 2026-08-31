import { notificationsCol, projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const snap = await notificationsCol.ref
      .where("user_id", "==", auth.userId)
      .orderBy("created_at", "desc")
      .get();

    const notifications = snap.docs.map((d) => ({
      id: d.data().numericId ?? d.id,
      ...d.data(),
    }));

    return Response.json({ notifications });
  } catch (err) {
    console.error("List notifications error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const promises = ids.map(async (id) => {
      const doc = notificationsCol.ref.doc(id);
      const snap = await doc.get();
      if (!snap.exists) return;
      const data = snap.data();
      if ((data?.user_id as number) !== auth.userId) return;
      await doc.update({ read: true });
    });

    await Promise.all(promises);
    return Response.json({ success: true });
  } catch (err) {
    console.error("Mark notifications read error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
