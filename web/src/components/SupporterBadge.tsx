/**
 * SupporterBadge — shown when a user's total donations meet the threshold.
 *
 * The badge is presentational: callers pass the server-computed eligibility
 * flag so client pages never need the donation data or the threshold config.
 * It renders nothing when the user is not a supporter, avoiding layout shift.
 */

export interface SupporterBadgeProps {
  isSupporter?: boolean;
  totalXlm?: number;
  size?: "sm" | "md";
  className?: string;
}

export default function SupporterBadge({
  isSupporter = false,
  totalXlm,
  size = "sm",
  className = "",
}: SupporterBadgeProps) {
  if (!isSupporter) return null;

  const tooltip =
    totalXlm !== undefined
      ? `Supporter — ${totalXlm} XLM donated`
      : "Supporter — donated to the community";
  const sizeClasses =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px] gap-1"
      : "px-2.5 py-0.5 text-xs gap-1.5";

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      className={`tag tag-solar inline-flex shrink-0 items-center font-semibold ${sizeClasses} ${className}`.trim()}
    >
      <svg
        width={size === "sm" ? 9 : 11}
        height={size === "sm" ? 9 : 11}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      Supporter
    </span>
  );
}
