import { requireCurrentAdmin } from "@/lib/admin-user-auth";
import { getSupabase } from "@/lib/firebase";
import { adminUserQuerySchema } from "@/lib/validation/schemas/admin-users";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!await requireCurrentAdmin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
    const url = new URL(request.url);
    const parsed = adminUserQuerySchema.safeParse({
      search: url.searchParams.get("search") ?? "",
      role: url.searchParams.get("role") || undefined,
      page: url.searchParams.get("page") ?? 1,
    });
    if (!parsed.success) return Response.json({ error: "Invalid user filters" }, { status: 400 });
    const { search, role, page } = parsed.data;
    const limit = 25;
    // Select only public management fields: never fetch password hashes.
    let query = getSupabase().from("users").select("numericId,username,email,role,created_at", { count: "exact" });
    if (role) query = query.eq("role", role);
    if (search) {
      // PostgREST filter syntax must not be supplied by the search input.
      const literal = search.replace(/[\\%_(),."]/g, " ").trim();
      if (literal) query = query.or(`username.ilike.%${literal}%,email.ilike.%${literal}%`);
    }
    const { data, count, error } = await query.order("numericId", { ascending: true }).range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    return Response.json({ users: (data ?? []).map(({ numericId, ...user }) => ({ id: numericId, ...user })), pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to load users" }, { status: 500 });
  }
}
