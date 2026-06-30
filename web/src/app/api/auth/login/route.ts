import { usersCol } from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { loginSchema } from "@/lib/validation/schemas/auth";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, loginSchema);
  if (!parsed.success) return parsed.response;

  const { email, password } = parsed.data;

  try {

    const snap = await usersCol.ref.where("email", "==", email).limit(1).get();
    if (snap.empty) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const userDoc = snap.docs[0];
    const user = userDoc.data();

    const valid = await comparePassword(password, user.password_hash as string);
    if (!valid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({ userId: user.numericId as number, role: user.role as string });
    return Response.json({
      token,
      user: {
        id: user.numericId,
        username: user.username,
        email: user.email,
        role: user.role,
        stellar_address: user.stellar_address,
        github_url: user.github_url,
        bio: user.bio,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
