import { usersCol, nextId } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { registerSchema } from "@/lib/validation/schemas/auth";
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";
import { randomBytes } from "crypto";
export const dynamic = "force-dynamic";

function generateReferralCode(): string {
  return randomBytes(6).toString("base64url");
}

function readRefCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "ref") {
      const value = decodeURIComponent(rest.join("=") || "").trim();
      return value.length > 0 && value.length <= 64 ? value : null;
    }
  }
  return null;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 60_000 });
  if (!rl.allowed) return rateLimitExceededResponse(rl.retryAfterSeconds);

  const parsed = await parseJsonBody(request, registerSchema);
  if (!parsed.success) return parsed.response;

  const { username, email, password } = parsed.data;

  try {
    // Check existing email or username
    const byEmail = await usersCol.ref.where("email", "==", email).limit(1).get();
    if (!byEmail.empty) {
      return Response.json({ error: "Email or username already taken" }, { status: 409 });
    }
    const byUsername = await usersCol.ref.where("username", "==", username).limit(1).get();
    if (!byUsername.empty) {
      return Response.json({ error: "Email or username already taken" }, { status: 409 });
    }

    // Attribute signup to referrer if a valid ref cookie is present
    let referredBy: string | null = null;
    const refCode = readRefCookie(request);
    if (refCode) {
      const referrer = await usersCol.ref.where("referral_code", "==", refCode).limit(1).get();
      if (!referrer.empty) {
        referredBy = refCode;
      }
    }

    const password_hash = await hashPassword(password);
    const numericId = await nextId("users");

    // Generate a unique referral code for the new user
    let referralCode = generateReferralCode();
    for (let i = 0; i < 5; i++) {
      const clash = await usersCol.ref.where("referral_code", "==", referralCode).limit(1).get();
      if (clash.empty) break;
      referralCode = generateReferralCode();
    }

    await usersCol.ref.doc(String(numericId)).set({
      numericId,
      username,
      email,
      password_hash,
      role: "contributor",
      stellar_address: null,
      github_url: null,
      bio: null,
      referral_code: referralCode,
      referred_by: referredBy,
      created_at: new Date().toISOString(),
    });

    const token = signToken({ userId: numericId, role: "contributor" });
    return Response.json(
      { token, user: { id: numericId, username, email, role: "contributor", referral_code: referralCode } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
