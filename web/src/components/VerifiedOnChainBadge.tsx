import { explorerTxUrl } from "@/lib/ratingContract";

/** Links a review to the Soroban transaction that recorded it. Renders nothing without a tx hash. */
export default function VerifiedOnChainBadge({
  txHash,
  network,
}: {
  txHash?: string | null;
  network?: string;
}) {
  if (!txHash) return null;

  const tooltip = `Recorded on the Stellar network. View transaction ${txHash.slice(0, 8)}…${txHash.slice(-6)} on Stellar Expert.`;

  return (
    <a
      href={explorerTxUrl(txHash, network)}
      target="_blank"
      rel="noopener noreferrer"
      title={tooltip}
      aria-label={`Verified on-chain. ${tooltip}`}
      className="tag tag-plasma text-[10px] inline-flex items-center gap-1"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      Verified on-chain
    </a>
  );
}
