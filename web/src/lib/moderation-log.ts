import { getSupabase } from "@/lib/firebase";

export type ModerationAction =
  | "approve"
  | "reject"
  | "feature"
  | "unfeature"
  | "delist"
  | "delete";

export async function writeModerationLog(entry: {
  actorId: number;
  action: ModerationAction;
  projectId: number;
  reason?: string | null;
}): Promise<void> {
  const { error } = await getSupabase().from("moderation_log").insert({
    actor_id: entry.actorId,
    action: entry.action,
    project_id: entry.projectId,
    reason: entry.reason?.trim() || null,
  });

  if (error) throw error;
}
