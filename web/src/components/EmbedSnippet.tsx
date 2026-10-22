"use client";

import { useState, useCallback } from "react";

interface EmbedSnippetProps {
  slug: string;
}

/**
 * Displays a ready-to-paste <iframe> snippet for embedding a project card
 * on an external site, with a one-click copy button.
 */
export default function EmbedSnippet({ slug }: EmbedSnippetProps) {
  const [copied, setCopied] = useState(false);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://stellarwavehub.com";

  const snippet = `<iframe
  src="${siteUrl}/embed/${slug}"
  width="420"
  height="180"
  frameborder="0"
  style="border:none;border-radius:16px;overflow:hidden;"
  title="Stellar Wave Hub — ${slug}"
  loading="lazy"
></iframe>`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement("textarea");
      el.value = snippet;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [snippet]);

  return (
    <div className="glass rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-4">
        {/* Embed icon */}
        <div className="w-8 h-8 rounded-lg bg-nova/10 border border-nova/20 flex items-center justify-center shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--nova-bright)"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-lg text-starlight leading-tight">
            Embed this project
          </h2>
          <p className="text-xs text-ash mt-0.5">
            Paste this snippet into any webpage to show a live project card.
          </p>
        </div>
      </div>

      {/* Code block */}
      <div className="relative group">
        <pre
          className="rounded-xl bg-nebula border border-dust/30 px-4 py-3 text-xs text-moonlight/80 font-mono overflow-x-auto whitespace-pre leading-relaxed select-all"
          aria-label="Embed iframe snippet"
        >
          {snippet}
        </pre>

        {/* Copy button — overlaid top-right */}
        <button
          onClick={handleCopy}
          aria-label={copied ? "Copied!" : "Copy embed snippet"}
          className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
            bg-stardust/70 border border-dust/40 text-ash
            hover:border-nova/40 hover:text-nova-bright hover:bg-nova/10
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova"
        >
          {copied ? (
            <>
              {/* Checkmark */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--aurora-bright)"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ color: "var(--aurora-bright)" }}>Copied!</span>
            </>
          ) : (
            <>
              {/* Clipboard icon */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="9" y="2" width="6" height="4" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Preview link */}
      <p className="mt-3 text-xs text-ash">
        Preview:{" "}
        <a
          href={`${siteUrl}/embed/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-plasma-bright hover:underline font-mono"
        >
          {siteUrl}/embed/{slug}
        </a>
      </p>
    </div>
  );
}
