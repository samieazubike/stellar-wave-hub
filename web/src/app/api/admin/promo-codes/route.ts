import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
export const dynamic = "force-dynamic";

function isAdmin(request: Request) {
  const auth = getAuthUser(request);
  return auth?.role === "admin" ? auth : null;
}

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("List promo codes error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  return Response.json({ promo_codes: data ?? [] });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    code: string;
    percent_off: number;
    max_uses?: number | null;
    expires_at?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { code, percent_off, max_uses = null, expires_at = null } = body;

  if (!code || typeof code !== "string" || !code.trim()) {
    return Response.json({ error: "code is required" }, { status: 400 });
  }
  if (
    typeof percent_off !== "number" ||
    !Number.isInteger(percent_off) ||
    percent_off < 1 ||
    percent_off > 100
  ) {
    return Response.json(
      { error: "percent_off must be an integer between 1 and 100" },
      { status: 400 },
    );
  }
  if (max_uses !== null && (!Number.isInteger(max_uses) || max_uses < 1)) {
    return Response.json({ error: "max_uses must be a positive integer or null" }, { status: 400 });
  }
  if (expires_at !== null && isNaN(Date.parse(expires_at))) {
    return Response.json({ error: "expires_at must be a valid ISO date or null" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      code: normalizedCode,
      percent_off,
      max_uses: max_uses ?? null,
      expires_at: expires_at ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "A promo code with that name already exists" }, { status: 409 });
    }
    console.error("Create promo code error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  return Response.json({ promo_code: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return Response.json({ error: "code query param is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("promo_codes")
    .delete()
    .eq("code", code.trim().toUpperCase());

  if (error) {
    console.error("Delete promo code error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  return Response.json({ success: true });
}
