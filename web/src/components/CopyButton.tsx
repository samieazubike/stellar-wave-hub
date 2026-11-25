"use client";

import { useState } from "react";

interface CopyButtonProps {
  value: string;
  className?: string;
}

/** Copies a full account or contract ID while exposing a short success state. */
export default function CopyButton({ value, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const succeeded = document.execCommand("copy");
      document.body.removeChild(field);
      if (!succeeded) return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      disabled={!value}
      aria-label={copied ? "Copied to clipboard" : "Copy ID to clipboard"}
      title={copied ? "Copied!" : "Copy to clipboard"}
      className={`inline-flex items-center justify-center rounded-md p-1.5 text-ash transition-colors hover:bg-nova/10 hover:text-nova-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m5 12 4 4L19 6" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="8" y="8" width="13" height="13" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </svg>
      )}
      <span className="sr-only" aria-live="polite">{copied ? "Copied!" : "Copy ID"}</span>
    </button>
  );
}
