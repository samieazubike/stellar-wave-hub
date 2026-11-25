"use client";

import { useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export default function ShareButtons({
  url,
  title,
  description,
  className = "",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const shareText = description
    ? `Check out ${title} on Stellar Wave Hub - ${description}`
    : `Check out ${title} on Stellar Wave Hub!`;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);

  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("Link copied to clipboard!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const succeeded = document.execCommand("copy");
      document.body.removeChild(field);
      if (succeeded) {
        setCopied(true);
        showToast("Link copied to clipboard!");
        window.setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: shareText,
          url,
        });
        showToast("Shared successfully!");
      } catch (err: unknown) {
        // Ignore user cancellation (AbortError)
        if ((err as Error)?.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className={`relative inline-flex flex-wrap items-center gap-2 ${className}`}>
      {/* Mobile Web Share Button */}
      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="sm:hidden btn-ghost text-xs !py-1.5 inline-flex items-center gap-1.5"
          aria-label="Share project"
          title="Share via device options"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>
      )}

      {/* Share to X (Twitter) */}
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost text-xs !py-1.5 inline-flex items-center gap-1.5 text-ash hover:text-starlight hover:border-dust/60 transition-colors"
        aria-label="Share on X"
        title="Share on X"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>X</span>
      </a>

      {/* Share to Telegram */}
      <a
        href={telegramShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost text-xs !py-1.5 inline-flex items-center gap-1.5 text-ash hover:text-nova-bright hover:border-nova/40 transition-colors"
        aria-label="Share on Telegram"
        title="Share on Telegram"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.718-1.536 7.234-2.227 10.467-.291 1.365-.79 1.597-1.332 1.636-.938.067-1.65-.638-2.559-1.233-1.423-.933-2.227-1.514-3.606-2.423-1.593-1.05-.56-1.628.348-2.572.238-.247 4.37-4.004 4.45-4.344.01-.043.018-.204-.078-.29-.096-.085-.237-.056-.339-.033-.145.032-2.457 1.564-6.936 4.588-.656.45-1.25.67-1.78.658-.586-.012-1.713-.332-2.553-.605-1.03-.335-1.849-.512-1.777-1.08.037-.296.446-.599 1.226-.91 4.808-2.094 8.016-3.475 9.623-4.143 4.585-1.907 5.539-2.238 6.16-2.249.136-.002.441.032.639.192.167.135.213.317.235.445.022.128.05.419.028.648z" />
        </svg>
        <span>Telegram</span>
      </a>

      {/* Share to LinkedIn */}
      <a
        href={linkedInShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost text-xs !py-1.5 inline-flex items-center gap-1.5 text-ash hover:text-plasma-bright hover:border-plasma/40 transition-colors"
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
        <span>LinkedIn</span>
      </a>

      {/* Copy Link button */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="btn-ghost text-xs !py-1.5 inline-flex items-center gap-1.5 text-ash hover:text-moonlight transition-colors"
        aria-label={copied ? "Link copied" : "Copy project link"}
        title={copied ? "Copied!" : "Copy link"}
      >
        {copied ? (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-aurora-bright"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
        ) : (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
        <span>{copied ? "Copied!" : "Copy link"}</span>
      </button>

      {/* Copied Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-aurora/30 bg-nebula/95 px-4 py-2.5 text-xs font-medium text-aurora-bright shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
