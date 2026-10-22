import { randomBytes } from "crypto";
import {
  Account,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import firestore from "@/lib/firebase";
import { projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Challenges expire after 5 minutes, matching /api/auth/challenge.
const CHALLENGE_TTL_SECONDS = 300;
const CHALLENGE_TTL_MS = CHALLENGE_TTL_SECONDS * 1000;
const VERIFY_OWNER_DATA_NAME = "stellar_wave_hub_verify_owner";

function challengesCol() {
  return firestore.collection("auth_challenges");
}

// Server keypair used to build challenge transactions (not a funded account —
// it only acts as the transaction source and signs the envelope).
const serverKeypair = Keypair.random();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ref = projectsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) return Response.json({ error: "Project not found" }, { status: 404 });

  const project = doc.data()!;

  // Only the project owner may request a challenge. Admins and maintainers do
  // not bypass this check: ownership has to be proven by the owner's wallet.
  if (project.user_id !== auth.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const stellarAccountId =
    typeof project.stellar_account_id === "string" ? project.stellar_account_id : "";

  if (stellarAccountId.length !== 56 || !stellarAccountId.startsWith("G")) {
    return Response.json(
      { error: "Project must have a valid stellar_account_id to verify ownership" },
      { status: 400 }
    );
  }

  try {
    const nonce = randomBytes(32).toString("hex");

    // A manageData operation sourced from the project account proves that the
    // signer controls stellar_account_id. The operation name distinguishes
    // this challenge from a login challenge.
    const account = new Account(serverKeypair.publicKey(), "0");
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.manageData({
          name: `${VERIFY_OWNER_DATA_NAME}:${project.numericId}`,
          value: nonce,
          source: stellarAccountId,
        })
      )
      .setTimeout(CHALLENGE_TTL_SECONDS)
      .build();

    transaction.sign(serverKeypair);
    const challengeXdr = transaction.toXDR();
    const now = Date.now();
    const expiresAt = now + CHALLENGE_TTL_MS;

    // Reuse the auth challenge store keyed by the signing public key, exactly
    // like /api/auth/challenge.
    await challengesCol().doc(stellarAccountId).set({
      publicKey: stellarAccountId,
      challenge: challengeXdr,
      nonce,
      created_at: now,
      expires_at: expiresAt,
    });

    return Response.json({
      challengeXdr,
      networkPassphrase: Networks.TESTNET,
      projectId: project.numericId ?? id,
      stellarAccountId,
      expiresAt,
    });
  } catch (err) {
    console.error("Owner verification challenge error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
