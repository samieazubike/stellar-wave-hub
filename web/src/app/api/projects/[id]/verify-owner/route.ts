import firestore, { getSupabase } from "@/lib/firebase";
import { projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { walletAuthSchema } from "@/lib/validation/schemas/auth";
import { verifyOwnerSignature } from "@/lib/owner-verification";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const doc = await projectsCol.ref.doc(id).get();
    if (!doc.exists) return Response.json({ error: "Project not found" }, { status: 404 });
    const project = doc.data()!;
    if (project.user_id !== auth.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const parsed = await parseJsonBody(request, walletAuthSchema);
    if (!parsed.success) return parsed.response;
    const { publicKey, signedXdr } = parsed.data;
    if (publicKey !== project.stellar_account_id) {
      return Response.json({ error: "Signing wallet must match the project's Stellar account." }, { status: 400 });
    }
    const challengeDoc = await firestore.collection("auth_challenges").doc(publicKey).get();
    if (!challengeDoc.exists) {
      return Response.json({ error: "No challenge found. Request a new one." }, { status: 400 });
    }
    const challenge = challengeDoc.data()!;
    if (!Number.isFinite(Number(challenge.expires_at)) || Date.now() >= Number(challenge.expires_at)) {
      return Response.json({ error: "Challenge expired. Request a new one." }, { status: 400 });
    }
    if (!verifyOwnerSignature(signedXdr, challenge.challenge, publicKey, String(project.numericId))) {
      return Response.json({ error: "Invalid signature or challenge. Sign the current ownership challenge with the project's wallet." }, { status: 401 });
    }

    // Consume only this challenge, once. A replacement challenge must survive
    // a concurrent verification request for the previous challenge.
    const db = getSupabase();
    const { data: consumed, error: consumeError } = await db.from("auth_challenges")
      .delete().eq("publicKey", publicKey).eq("challenge", challenge.challenge)
      .gt("expires_at", Date.now()).select("publicKey").maybeSingle();
    if (consumeError) throw consumeError;
    if (!consumed) {
      return Response.json({ error: "Challenge expired, replaced or already used. Request a new one." }, { status: 409 });
    }
    const verifiedAt = new Date(Math.max(Date.now(), Date.parse(project.updated_at) + 1)).toISOString();
    // Reject stale writes if an edit raced with signature verification.
    const { data: updated, error: updateError } = await db.from("projects")
      .update({ owner_verified_at: verifiedAt, owner_verified_address: publicKey, updated_at: verifiedAt })
      .eq("numericId", project.numericId).eq("user_id", auth.userId)
      .eq("stellar_account_id", publicKey).eq("updated_at", project.updated_at)
      .select("*").maybeSingle();
    if (updateError) throw updateError;
    if (!updated) {
      return Response.json({ error: "Project changed during verification. Reload and request a new challenge." }, { status: 409 });
    }
    return Response.json({ project: { ...updated, id: updated.numericId } });
  } catch (err) {
    console.error("Owner verification error:", err);
    return Response.json({ error: "Ownership verification failed. Request a new challenge and try again." }, { status: 500 });
  }
}
