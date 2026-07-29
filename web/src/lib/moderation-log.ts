import { getSupabase } from "@/lib/firebase";

export type ModerationAction =
  | "approve"
  | "reject"
  | "feature"
  | "delist"
  | "delete";

export async function writeModerationLog(entry: {
  actorId: number;
  action: ModerationAction;
  projectId: number;
  reason?: string | null;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("moderation_log").insert({
    actor_id: entry.actorId,
    action: entry.action,
    project_id: entry.projectId,
    reason: entry.reason ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}
