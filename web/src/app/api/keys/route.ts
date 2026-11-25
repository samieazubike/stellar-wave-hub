import { getAuthUser } from "@/lib/auth";
import { createApiKey } from "@/lib/api-keys";
import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data, error } = await getSupabase()
      .from("api_keys")
      .select("id,name,prefix,tier,created_at,last_used_at,revoked_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ keys: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("List API keys error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const name = body && typeof body === "object" && "name" in body ? body.name : null;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return Response.json({ error: "Name must be 1 to 80 characters" }, { status: 400 });
  }
  try {
    const { key, keyHash, prefix } = createApiKey();
    const { data, error } = await getSupabase().from("api_keys")
      .insert({ user_id: auth.userId, name: name.trim(), key_hash: keyHash, prefix, tier: "free" })
      .select("id,name,prefix,tier,created_at")
      .single();
    if (error) throw error;
    return Response.json({ key, ...data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Create API key error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[1-9]\d*$/.test(id)) {
    return Response.json({ error: "Valid key ID is required" }, { status: 400 });
  }
  try {
    const { data, error } = await getSupabase().from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", Number(id))
      .eq("user_id", auth.userId)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return Response.json({ error: "Key not found" }, { status: 404 });
    return Response.json({ revoked: true });
  } catch (error) {
    console.error("Revoke API key error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
