import { getSupabase } from "./firebase";

interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  link: string;
  project_id?: number;
}

export async function notifyMaintainers(
  payload: NotificationPayload,
): Promise<void> {
  try {
    const supabase = getSupabase();

    const { data: maintainers, error } = await supabase
      .from("users")
      .select("numericId")
      .in("role", ["maintainer", "admin"]);

    if (error) throw error;
    if (!maintainers || maintainers.length === 0) return;

    const notifications = maintainers.map((u: { numericId: number }) => ({
      user_id: u.numericId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      project_id: payload.project_id ?? null,
      read: false,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) throw insertError;
  } catch (err) {
    console.error("Failed to notify maintainers:", err);
  }
}
