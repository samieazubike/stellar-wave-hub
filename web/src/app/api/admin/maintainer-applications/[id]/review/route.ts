import { maintainerApplicationsCol, usersCol, createNotification } from "@/lib/db";
import { requireCurrentAdmin } from "@/lib/admin-user-auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { reviewMaintainerApplicationSchema } from "@/lib/validation/schemas/maintainer-applications";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireCurrentAdmin(request))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    
    const parsed = await parseJsonBody(request, reviewMaintainerApplicationSchema);
    if (!parsed.success) return parsed.response;
    const { status } = parsed.data;

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
    if (typeof userId !== "string" && typeof userId !== "number") {
      return Response.json({ error: "Invalid applicant user ID" }, { status: 400 });
    }

    // If approved, promote — but never demote someone who already outranks maintainer.
    if (status === "approved") {
      const applicant = await usersCol.ref.doc(userId.toString()).get();
      if (applicant.exists && applicant.data()?.role === "contributor") {
        await usersCol.ref.doc(userId.toString()).update({
          role: "maintainer",
        });
      }
    }

    const message = status === "approved"
      ? "Congratulations! Your maintainer application has been approved. You are now a maintainer."
      : "Your maintainer application has been reviewed and unfortunately was not approved at this time.";

    await createNotification({ user_id: Number(userId), status, message });

    return Response.json({ success: true, status });
  } catch (error) {
    console.error("Error reviewing application:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
