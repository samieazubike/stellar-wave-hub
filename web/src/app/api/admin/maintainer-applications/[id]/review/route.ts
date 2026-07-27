import { maintainerApplicationsCol, notificationsCol, usersCol, nextId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth || auth.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const status = body?.status;
    if (status !== "approved" && status !== "rejected") {
      return Response.json({ error: "Invalid status. Must be 'approved' or 'rejected'." }, { status: 400 });
    }

    const appSnap = await maintainerApplicationsCol.ref.doc(id).get();
    if (!appSnap.exists) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    const appData = appSnap.data();
    if (!appData || appData.status !== "pending") {
      return Response.json({ error: "Application is not pending" }, { status: 400 });
    }

    // Update application status
    await maintainerApplicationsCol.ref.doc(id).update({
      status,
      updated_at: new Date().toISOString(),
    });

    const userId = appData.user_id;

    // If approved, update user role
    if (status === "approved") {
      await usersCol.ref.doc(userId.toString()).update({
        role: "maintainer",
      });
    }

    // Send notification
    const notificationId = await nextId("notifications");
    const message = status === "approved" 
      ? "Congratulations! Your maintainer application has been approved. You are now a maintainer."
      : "Your maintainer application has been reviewed and unfortunately was not approved at this time.";

    await notificationsCol.ref.doc(notificationId.toString()).set({
      id: notificationId,
      user_id: userId,
      message,
      read: false,
      created_at: new Date().toISOString(),
    });

    return Response.json({ success: true, status });
  } catch (error) {
    console.error("Error reviewing application:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
