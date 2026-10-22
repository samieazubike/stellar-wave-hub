import { maintainerApplicationsCol, nextId } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { maintainerApplicationSchema } from "@/lib/validation/schemas/maintainer-applications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { userId } = auth;

    const parsed = await parseJsonBody(request, maintainerApplicationSchema);
    if (!parsed.success) return parsed.response;
    const { reason } = parsed.data;

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
