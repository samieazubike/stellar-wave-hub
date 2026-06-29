import { notificationsCol } from "@/lib/db";

type ProjectStatus = "approved" | "featured" | "rejected" | "delisted" | string;

type StatusChangeNotificationInput = {
  projectId: number;
  projectName: string;
  userId: number;
  fromStatus?: ProjectStatus | null;
  toStatus: ProjectStatus;
  reason?: string | null;
};

const statusMessages: Record<string, string> = {
  approved: "Your project has been approved and is now listed publicly.",
  featured: "Your project has been featured on Stellar Wave Hub.",
  rejected: "Your project was rejected by the review team.",
  delisted: "Your project was delisted and is no longer visible publicly.",
};

function statusTitle(status: ProjectStatus) {
  if (status === "featured") return "Project featured";
  return `Project ${status}`;
}

export async function notifyProjectStatusChange({
  projectId,
  projectName,
  userId,
  fromStatus,
  toStatus,
  reason,
}: StatusChangeNotificationInput) {
  if (!userId || fromStatus === toStatus) return;

  const now = new Date().toISOString();
  const message = statusMessages[toStatus] ?? `Your project status changed to ${toStatus}.`;

  const id = crypto.randomUUID();

  await notificationsCol.ref.doc(id).set({
    id,
    user_id: userId,
    project_id: projectId,
    type: "project_status_changed",
    title: statusTitle(toStatus),
    message,
    metadata: {
      project_name: projectName,
      from_status: fromStatus ?? null,
      to_status: toStatus,
      reason: reason || null,
    },
    read_at: null,
    created_at: now,
  });
}
