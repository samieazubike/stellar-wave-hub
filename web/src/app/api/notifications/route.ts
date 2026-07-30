import { notificationsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = auth;
    const snap = await notificationsCol.ref
      .where("user_id", "==", userId)
      .orderBy("created_at", "desc")
      .get();
      
    const notifications = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        message: data.message,
        read: data.read,
        created_at: data.created_at,
      };
    });

    return Response.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
