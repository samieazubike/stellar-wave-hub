import { Keypair, TransactionBuilder, Networks } from "@stellar/stellar-sdk";
import firestore from "@/lib/firebase";
import { usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

function challengesCol() { return firestore.collection("auth_challenges"); }

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { publicKey, signedXdr } = await request.json();

    if (!publicKey || !signedXdr) {
      return Response.json({ error: "publicKey and signedXdr are required" }, { status: 400 });
    }

    // Retrieve and validate challenge
    const challengeDoc = await challengesCol().doc(publicKey).get();
    if (!challengeDoc.exists) {
      return Response.json({ error: "No challenge found. Request a new one." }, { status: 400 });
    }

    const challengeData = challengeDoc.data()!;
    if (Date.now() > (challengeData.expires_at as number)) {
      await challengesCol().doc(publicKey).delete();
      return Response.json({ error: "Challenge expired. Request a new one." }, { status: 400 });
    }

    // Parse the signed transaction and verify the user's signature
    const transaction = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    const keypair = Keypair.fromPublicKey(publicKey);
    const txHash = transaction.hash();

    const userSigned = transaction.signatures.some((sig) => {
      try {
        return keypair.verify(txHash, sig.signature());
      } catch {
        return false;
      }
    });

    if (!userSigned) {
      return Response.json({ error: "Invalid signature — transaction not signed by wallet" }, { status: 401 });
    }

    // Clean up used challenge
    await challengesCol().doc(publicKey).delete();

    // Check if another user already has this wallet linked
    const existingSnap = await usersCol.ref
      .where("stellar_address", "==", publicKey)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existingUser = existingSnap.docs[0].data();
      if (existingUser.numericId !== auth.userId) {
        return Response.json(
          { error: "This wallet is already linked to another account" },
          { status: 409 },
        );
      }
      // Already linked to this user
      return Response.json({ success: true, stellar_address: publicKey });
    }

    // Link wallet to the authenticated user
    await usersCol.ref.doc(String(auth.userId)).update({
      stellar_address: publicKey,
    });

    return Response.json({ success: true, stellar_address: publicKey });
  } catch (err) {
    console.error("Link wallet error:", err);
    return Response.json({ error: "Failed to link wallet" }, { status: 500 });
  }
}
