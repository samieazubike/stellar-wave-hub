import { Keypair, Networks, Transaction, TransactionBuilder } from "@stellar/stellar-sdk";

/** Verify the exact issued challenge, rather than any transaction signed by a wallet. */
export function verifyOwnerSignature(
  signedXdr: string,
  challengeXdr: string,
  publicKey: string,
  projectId: string,
): boolean {
  try {
    const signed = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    const challenge = TransactionBuilder.fromXDR(challengeXdr, Networks.TESTNET);
    if (!(signed instanceof Transaction) || !(challenge instanceof Transaction)) return false;
    if (!signed.hash().equals(challenge.hash())) return false;
    const operation = challenge.operations[0];
    if (challenge.operations.length !== 1 || operation.type !== "manageData" ||
        operation.name !== `stellar_wave_hub_verify_owner:${projectId}` ||
        operation.source !== publicKey) return false;
    const keypair = Keypair.fromPublicKey(publicKey);
    return signed.signatures.some((signature) => {
      try {
        return keypair.verify(signed.hash(), signature.signature());
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
