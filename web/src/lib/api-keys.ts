import { createHash, randomBytes } from "node:crypto";
import { getSupabase } from "@/lib/firebase";

const KEY_PATTERN = /^swh_[a-f0-9]{64}$/;

export function createApiKey(): { key: string; keyHash: string; prefix: string } {
  const key = `swh_${randomBytes(32).toString("hex")}`;
  return { key, keyHash: hashApiKey(key), prefix: key.slice(0, 12) };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function verifyApiKey(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  const key = request.headers.get("x-api-key") ||
    (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);
  if (!key || !KEY_PATTERN.test(key)) return false;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id")
    .eq("key_hash", hashApiKey(key))
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;

  const { error: usageError } = await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);
  if (usageError) console.error("Failed to update API key usage:", usageError);
  return true;
}
