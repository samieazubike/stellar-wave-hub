import { randomBytes } from "crypto";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Account,
  Operation,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import firestore from "@/lib/firebase";
export const dynamic = "force-dynamic";

function challengesCol() { return firestore.collection("auth_challenges"); }

// Server keypair used to build auth transactions (not a funded account — just for signing)
const serverKeypair = Keypair.random();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const publicKey = url.searchParams.get("publicKey");

  if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith("G")) {
    return Response.json({ error: "Valid Stellar public key required" }, { status: 400 });
  }

  const nonce = randomBytes(32).toString("hex");

  // Build a minimal auth transaction the user must sign to prove wallet ownership
  const account = new Account(serverKeypair.publicKey(), "0");
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.manageData({
        name: "stellar_wave_hub_auth",
        value: nonce,
        source: publicKey,
      })
    )
    .setTimeout(300) // 5 minutes
    .build();

  transaction.sign(serverKeypair);
  const challengeXdr = transaction.toXDR();

  // Store challenge with 5-minute TTL
  // Using 'challenge' column to store the XDR (matches existing Supabase schema)
  await challengesCol().doc(publicKey).set({
    publicKey,
    challenge: challengeXdr,
    nonce,
    created_at: Date.now(),
    expires_at: Date.now() + 5 * 60 * 1000,
  });

  return Response.json({
    challengeXdr,
    networkPassphrase: Networks.TESTNET,
  });
}
