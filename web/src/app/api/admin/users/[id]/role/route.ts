import { requireCurrentAdmin } from "@/lib/admin-user-auth";
import { getSupabase } from "@/lib/firebase";
import { changeUserRoleSchema } from "@/lib/validation/schemas/admin-users";
export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireCurrentAdmin(request);
    if (!actor) return Response.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return Response.json({ error: "Invalid user ID" }, { status: 400 });
    let payload: unknown;
    try { payload = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = changeUserRoleSchema.safeParse(payload);
    if (!parsed.success) return Response.json({ error: "Invalid role" }, { status: 400 });
    const targetId = Number(id);
    // Self-demotion is refused up front; the DB function also repeats the last-admin guard under lock.
    if (targetId === actor.userId && parsed.data.role !== "admin") {
      return Response.json({ error: "Cannot demote yourself or the last admin" }, { status: 409 });
    }
    // The DB function serializes changes and repeats current-admin/last-admin guards.
    const { data, error } = await getSupabase().rpc("admin_change_user_role", { actor_id: actor.userId, target_id: targetId, new_role: parsed.data.role });
    if (error) {
      const responses: Record<string, [number, string]> = {
        "42501": [403, "Forbidden"], "P0002": [404, "User not found"],
        "23514": [409, "Cannot demote yourself or the last admin"],
      };
      const [status, message] = responses[error.code] ?? [500, "Unable to change role"];
      return Response.json({ error: message }, { status });
    }
    const user = Array.isArray(data) ? data[0] : data;
    return Response.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Unable to change role" }, { status: 500 }); }
}
