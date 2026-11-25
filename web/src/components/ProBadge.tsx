import { isPro, type ProStatusFields } from "@/lib/pro";

export interface ProBadgeProps {
  project?: ProStatusFields | null;
  proUntil?: string | null;
  isProActive?: boolean | number | null;
  plan?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Displays a "Pro" badge when a project has an active Pro subscription.
 * Renders nothing when inactive or expired to avoid layout shift.
 */
export function ProBadge({
  project,
  proUntil,
  isProActive,
  plan,
  size = "md",
  className = "",
}: ProBadgeProps) {
  const status: ProStatusFields = project ?? {
    is_pro: isProActive,
    pro_until: proUntil,
    plan,
  };

  if (!isPro(status)) return null;

  const expiresAt = status.pro_until ? new Date(status.pro_until) : null;
  const hasValidExpiry = expiresAt !== null && !Number.isNaN(expiresAt.getTime());
  const tooltip = hasValidExpiry
    ? `Pro project — active until ${expiresAt.toLocaleDateString()}`
    : "Pro project";

  const sizeClasses =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px] gap-1"
      : "px-2.5 py-0.5 text-xs gap-1.5";

  const iconSize = size === "sm" ? 10 : 12;

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      className={`inline-flex shrink-0 items-center rounded-full border border-plasma/40 bg-plasma/20 font-bold tracking-wide text-plasma-bright ${sizeClasses} ${className}`.trim()}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
      </svg>
      Pro
    </span>
  );
}

export default ProBadge;
