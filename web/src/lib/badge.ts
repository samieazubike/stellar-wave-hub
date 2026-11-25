export const BADGE_LABEL = "Stellar Wave Hub";

const GRAY = "#9f9f9f";

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// Rough Verdana 11px width, good enough for a badge
const textWidth = (s: string) => Math.round(s.length * 6.6) + 12;

export function ratingBadge(avg: number | null): { value: string; color: string } {
  if (avg === null || !Number.isFinite(avg)) {
    return { value: "no ratings yet", color: GRAY };
  }
  const color = avg >= 4 ? "#4c1" : avg >= 3 ? "#dfb317" : "#fe7d37";
  return { value: `★ ${avg.toFixed(1)}`, color };
}

export function renderBadge(value: string, color: string): string {
  const fill = /^#[0-9a-f]{3,6}$/i.test(color) ? color : GRAY;
  const label = escapeXml(BADGE_LABEL);
  const val = escapeXml(value);
  const labelW = textWidth(BADGE_LABEL);
  const valueW = textWidth(value);
  const w = labelW + valueW;
  const lx = labelW / 2;
  const vx = labelW + valueW / 2;
  const aria = `${label}: ${val}`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${aria}">` +
    `<title>${aria}</title>` +
    `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>` +
    `<clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>` +
    `<g clip-path="url(#r)">` +
    `<rect width="${labelW}" height="20" fill="#555"/>` +
    `<rect x="${labelW}" width="${valueW}" height="20" fill="${fill}"/>` +
    `<rect width="${w}" height="20" fill="url(#s)"/>` +
    `</g>` +
    `<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">` +
    `<text x="${lx}" y="15" fill="#010101" fill-opacity=".3">${label}</text>` +
    `<text x="${lx}" y="14">${label}</text>` +
    `<text x="${vx}" y="15" fill="#010101" fill-opacity=".3">${val}</text>` +
    `<text x="${vx}" y="14">${val}</text>` +
    `</g></svg>`
  );
}