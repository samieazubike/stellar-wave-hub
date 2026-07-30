import { maintainerApplicationsCol, nextId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { userId } = auth;

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const reason = body?.reason?.trim();
    if (!reason) {
      return Response.json({ error: "Reason is required" }, { status: 400 });
    }

    // Check if there is already a pending application for this user
    const pendingSnap = await maintainerApplicationsCol.ref
      .where("user_id", "==", userId)
      .where("status", "==", "pending")
      .get();
      
    if (!pendingSnap.empty) {
      return Response.json({ error: "You already have a pending application" }, { status: 400 });
    }

    const nextApplicationId = await nextId("maintainer_applications");

    await maintainerApplicationsCol.ref.doc(nextApplicationId.toString()).set({
      id: nextApplicationId,
      user_id: userId,
      status: "pending",
      reason: reason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return Response.json({ success: true, id: nextApplicationId });
  } catch (error) {
    console.error("Error submitting application:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
