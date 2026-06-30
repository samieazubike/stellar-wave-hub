import { getSupabase } from "@/lib/firebase";

export type ModerationAction =
  | "approve"
  | "reject"
  | "feature"
  | "delist"
  | "delete";

export async function recordModerationLog(params: {
  actorId: number;
  action: ModerationAction;
  projectId: number;
  reason?: string | null;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("moderation_log").insert({
    actor_id: params.actorId,
    action: params.action,
    project_id: params.projectId,
    reason: params.reason ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}
