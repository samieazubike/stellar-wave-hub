import { createHash } from "node:crypto";
import { getSupabase } from "./firebase";

export type VerifiedApiKey = {
  id: string;
  userId: number;
  tier: string;
};

function getApiKey(request: Request): string | null {
  const headerKey = request.headers.get("x-api-key")?.trim();
  if (headerKey) return headerKey;

  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) return null;

  if (authorization.startsWith("ApiKey ")) {
    return authorization.slice("ApiKey ".length).trim() || null;
  }
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim() || null;
  }

  return null;
}

/** Validate an API key without ever storing or returning its plaintext value. */
export async function verifyApiKey(request: Request): Promise<VerifiedApiKey | null> {
  const apiKey = getApiKey(request);
  if (!apiKey || !/^swh_live_[A-Za-z0-9_-]{43}$/.test(apiKey)) return null;

  const keyHash = createHash("sha256").update(apiKey).digest("hex");

  try {
    const supabase = getSupabase();
    const { data: key, error } = await supabase
      .from("api_keys")
      .select("id, user_id, tier")
      .eq("key_hash", keyHash)
      .is("revoked_at", null)
      .maybeSingle();

    if (error || !key) return null;

    // The active-key predicate makes verification fail if a concurrent request revoked it.
    const { data: updated, error: updateError } = await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", key.id)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) return null;

    return {
      id: String(key.id),
      userId: Number(key.user_id),
      tier: String(key.tier),
    };
  } catch {
    return null;
  }
}
