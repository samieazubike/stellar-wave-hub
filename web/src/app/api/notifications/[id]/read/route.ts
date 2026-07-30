import { notificationsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;
    
    const notifSnap = await notificationsCol.ref.doc(id).get();
    if (!notifSnap.exists) {
      return Response.json({ error: "Notification not found" }, { status: 404 });
    }
    
    const notifData = notifSnap.data();
    if (!notifData || notifData.user_id !== auth.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await notificationsCol.ref.doc(id).update({
      read: true
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
