/**
 * RoleBadge — Display a user's role as a compact badge
 * 
 * Uses existing tag system from globals.css:
 * - contributor → tag-plasma (cyan/blue, neutral default)
 * - maintainer → tag-solar (amber/orange, elevated authority)
 * - admin → tag-supernova (red, highest authority)
 */

interface RoleBadgeProps {
  role: "contributor" | "maintainer" | "admin";
  className?: string;
}

const ROLE_STYLES = {
  contributor: "tag-plasma",
  maintainer: "tag-solar",
  admin: "tag-supernova",
} as const;

const ROLE_LABELS = {
  contributor: "Contributor",
  maintainer: "Maintainer",
  admin: "Admin",
} as const;

export default function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const styleClass = ROLE_STYLES[role] || "tag-plasma";
  const label = ROLE_LABELS[role] || role;

  return (
    <span
      className={`tag ${styleClass} text-xs ${className}`}
      role="img"
      aria-label={`Role: ${label}`}
    >
      {label}
    </span>
  );
}
