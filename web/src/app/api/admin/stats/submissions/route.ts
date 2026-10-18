import { projectsCol, notificationsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import {
  weeklySubmissionStats,
  APPROVAL_STATUSES,
  type SubmissionRecord,
  type ApprovalEvent,
} from "@/lib/submissionStats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Projects have no approval timestamp; the approve route writes a notification
    // with status "approved"/"featured" for every approval, so those are the events.
    const [projectsSnap, ...approvalSnaps] = await Promise.all([
      projectsCol.ref.get(),
      ...APPROVAL_STATUSES.map((s) => notificationsCol.ref.where("status", "==", s).get()),
    ]);
    const projects = projectsSnap.docs.map((d) => d.data() as SubmissionRecord);
    const approvals = approvalSnaps.flatMap((snap) =>
      snap.docs.map((d) => d.data() as ApprovalEvent),
    );
    return Response.json({ weeks: weeklySubmissionStats(projects, approvals) });
  } catch (err) {
    console.error("Admin submission stats error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
