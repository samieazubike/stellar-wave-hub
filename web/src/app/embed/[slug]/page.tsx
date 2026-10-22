import type { Metadata } from "next";
import { notFound } from "next/navigation";

// ---------------------------------------------------------------------------
// Types (subset of the full project shape returned by /api/projects/[id])
// ---------------------------------------------------------------------------
interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  featured: number;
  website_url?: string;
  logo_url?: string;
}

interface Averages {
  avg_score: number | null;
  total: number;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://stellarwavehub.com";

async function fetchProject(
  slug: string
): Promise<{ project: Project; averages: Averages } | null> {
  try {
    const res = await fetch(`${siteUrl}/api/projects/${slug}`, {
      // Re-validate every 5 minutes so the card stays reasonably fresh
      // without hitting the database on every iframe load.
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.project) return null;

    return {
      project: data.project as Project,
      averages: (data.averages ?? { avg_score: null, total: 0 }) as Averages,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchProject(slug);
  if (!result) return { title: "Project not found" };
  return {
    title: `${result.project.name} — Stellar Wave Hub`,
    robots: { index: false, follow: false },
  };
}

// ---------------------------------------------------------------------------
// Star display helper
// ---------------------------------------------------------------------------
function StarDisplay({ score, total }: { score: number | null; total: number }) {
  if (total === 0 || score === null) {
    return (
      <span className="text-ash text-xs">No ratings yet</span>
    );
  }

  const rounded = Math.round(score * 2) / 2; // round to nearest 0.5
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5" aria-label={`${score.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill =
            i <= Math.floor(rounded)
              ? "full"
              : i - 0.5 === rounded
                ? "half"
                : "empty";
          return (
            <svg
              key={i}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {fill === "full" && (
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  fill="var(--solar-bright)"
                  stroke="none"
                />
              )}
              {fill === "half" && (
                <>
                  <defs>
                    <linearGradient id={`half-${i}`} x1="0" x2="1" y1="0" y2="0">
                      <stop offset="50%" stopColor="var(--solar-bright)" />
                      <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    fill={`url(#half-${i})`}
                    stroke="var(--dust)"
                    strokeWidth="1"
                  />
                </>
              )}
              {fill === "empty" && (
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  fill="transparent"
                  stroke="var(--dust)"
                  strokeWidth="1.5"
                />
              )}
            </svg>
          );
        })}
      </div>
      <span className="text-solar-bright font-semibold text-xs tabular-nums">
        {score.toFixed(1)}
      </span>
      <span className="text-ash text-xs">
        ({total})
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category colour mapping (mirrors the project detail page palette)
// ---------------------------------------------------------------------------
function categoryClass(category: string): string {
  switch (category.toLowerCase()) {
    case "defi":
      return "tag-plasma";
    case "nft":
    case "gaming":
      return "tag-nova";
    case "infrastructure":
    case "tools":
      return "tag-aurora";
    default:
      return "tag-nova";
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await fetchProject(slug);

  if (!result) notFound();

  const { project, averages } = result;
  const projectUrl = `${siteUrl}/projects/${project.slug}`;

  // Logo letter — first char of name, upper-cased
  const logoLetter = project.name.charAt(0).toUpperCase();

  return (
    /*
     * The card is intentionally compact (max-w matches common embed widths).
     * We use inline styles for the outermost shell so it renders correctly
     * even when the host page's CSS partially bleeds into the iframe, and
     * Tailwind / CSS-variable classes for inner styling (loaded via globals.css
     * from the layout).
     */
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
        background: "var(--void, #06060f)",
        fontFamily: "var(--font-display, sans-serif)",
      }}
    >
      <a
        href={projectUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${project.name} on Stellar Wave Hub`}
        style={{ display: "block", width: "100%", maxWidth: "400px", textDecoration: "none" }}
      >
        {/* Card shell */}
        <div
          className="glass rounded-2xl border-glow"
          style={{
            padding: "20px",
            transition: "box-shadow 0.2s, transform 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 8px 32px rgba(124, 58, 237, 0.18)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "";
          }}
        >
          {/* Header row: logo + name + category */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            {/* Logo */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(6,182,212,0.25))",
                border: "1px solid rgba(124,58,237,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--nova-bright, #a78bfa)",
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {project.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={project.logo_url}
                  alt=""
                  style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "8px" }}
                />
              ) : (
                logoLetter
              )}
            </div>

            {/* Name + category */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: "var(--starlight, #f0eef6)",
                    fontWeight: 700,
                    fontSize: "16px",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "180px",
                  }}
                >
                  {project.name}
                </span>
                {project.featured === 1 && (
                  <span className={`tag tag-solar`} style={{ fontSize: "10px" }}>
                    Featured
                  </span>
                )}
              </div>

              {/* Category badge */}
              <div style={{ marginTop: "4px" }}>
                <span className={`tag ${categoryClass(project.category)}`} style={{ fontSize: "10px" }}>
                  {project.category}
                </span>
              </div>
            </div>
          </div>

          {/* Description — truncated to 2 lines */}
          {project.description && (
            <p
              style={{
                color: "var(--moonlight, #c4c0d4)",
                fontSize: "13px",
                lineHeight: "1.5",
                marginTop: "12px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {project.description}
            </p>
          )}

          {/* Rating row */}
          <div
            style={{
              marginTop: "14px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(61,56,86,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <StarDisplay score={averages.avg_score} total={averages.total} />

            {/* CTA */}
            <span
              className="btn-nova"
              style={{
                fontSize: "12px",
                padding: "6px 14px",
                borderRadius: "10px",
                whiteSpace: "nowrap",
              }}
            >
              View Project →
            </span>
          </div>

          {/* Branding footer */}
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "4px",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ash)"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span style={{ color: "var(--ash, #7c7893)", fontSize: "10px" }}>
              Stellar Wave Hub
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}
