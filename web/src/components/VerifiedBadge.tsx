/**
 * "Verified owner" badge: shown when the project owner has proved control of
 * the project's Stellar account. Renders nothing otherwise (no layout shift).
 */
export default function VerifiedBadge({
  verifiedAt,
  account,
}: {
  verifiedAt?: string | null;
  account?: string | null;
}) {
  if (!verifiedAt) return null;

  const tooltip = account
    ? `Owner proved control of ${account}`
    : "Owner proved control of the project's Stellar account";

  return (
    <span
      title={tooltip}
      aria-label={`Verified owner. ${tooltip}`}
      className="inline-flex shrink-0 items-center gap-1 text-aurora-bright"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
    </span>
  );
}
