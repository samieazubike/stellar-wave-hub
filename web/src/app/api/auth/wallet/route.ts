import { Keypair, TransactionBuilder, Networks } from "@stellar/stellar-sdk";
import firestore from "@/lib/firebase";
import { usersCol, nextId } from "@/lib/db";
import { signToken } from "@/lib/auth";
export const dynamic = "force-dynamic";

function challengesCol() { return firestore.collection("auth_challenges"); }

export async function POST(request: Request) {
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
    const transaction = TransactionBuilder.fromXDR(
      signedXdr,
      Networks.TESTNET
    );

    // Check that the transaction contains the user's signature
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

    // Find or create user by stellar_address
    let user;
    const existingSnap = await usersCol.ref
      .where("stellar_address", "==", publicKey)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const userData = existingSnap.docs[0].data();
      user = {
        id: userData.numericId,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        stellar_address: userData.stellar_address,
        github_url: userData.github_url,
        bio: userData.bio,
      };
    } else {
      const numericId = await nextId("users");
      const shortKey = publicKey.slice(0, 8);
      const username = `stellar_${shortKey.toLowerCase()}`;

      const newUser = {
        numericId,
        username,
        email: null,
        password_hash: null,
        role: "contributor",
        stellar_address: publicKey,
        github_url: null,
        bio: null,
        auth_method: "wallet",
        created_at: new Date().toISOString(),
      };

      await usersCol.ref.doc(String(numericId)).set(newUser);

      user = {
        id: numericId,
        username,
        email: null,
        role: "contributor",
        stellar_address: publicKey,
        github_url: null,
        bio: null,
      };
    }

    const token = signToken({ userId: user.id as number, role: user.role as string });

    return Response.json({ token, user });
  } catch (err) {
    console.error("Wallet auth error:", err);
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }
}
