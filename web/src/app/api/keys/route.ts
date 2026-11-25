import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { parseJsonBody } from "@/lib/validation/parse-body";

export const dynamic = "force-dynamic";

const createKeySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or fewer"),
});

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, error } = await getSupabase()
      .from("api_keys")
      .select("id, name, prefix, tier, created_at, last_used_at, revoked_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ keys: data ?? [] });
  } catch (error) {
    console.error("List API keys error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseJsonBody(request, createKeySchema);
  if (!parsed.success) return parsed.response;

  const secret = randomBytes(32).toString("base64url");
  const key = `swh_live_${secret}`;
  const prefix = `swh_live_${secret.slice(0, 8)}`;
  const keyHash = createHash("sha256").update(key).digest("hex");

  try {
    const { data, error } = await getSupabase()
      .from("api_keys")
      .insert({
        user_id: auth.userId,
        name: parsed.data.name,
        key_hash: keyHash,
        prefix,
        tier: "free",
      })
      .select("id, name, prefix, tier, created_at")
      .single();

    if (error) throw error;
    return Response.json({ key, apiKey: data }, { status: 201 });
  } catch (error) {
    console.error("Create API key error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "API key id is required" }, { status: 400 });

  try {
    const { data, error } = await getSupabase()
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", auth.userId)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return Response.json({ error: "API key not found" }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Revoke API key error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
