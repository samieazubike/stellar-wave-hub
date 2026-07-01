"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

interface Note {
  id: number;
  project_id: number;
  author_id: number;
  body: string;
  created_at: string;
  author_username?: string | null;
}

interface SubmissionNotesProps {
  projectId: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SubmissionNotes({ projectId }: SubmissionNotesProps) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Only admins can access notes
  if (!user || user.role !== "admin") return null;

  const queryKey = ["submission-notes", projectId];

  const { data, isLoading } = useQuery<{ notes: Note[] }>({
    queryKey,
    queryFn: () =>
      fetch(`/api/notes/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch notes");
        return r.json();
      }),
    enabled: open, // only fetch when panel is expanded
    staleTime: 30_000,
  });

  const notes = data?.notes ?? [];

  const { mutate: addNote, isPending } = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/notes/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add note");
      }
      return res.json();
    },
    onSuccess: () => {
      setDraft("");
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      setSubmitError(err.message);
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [draft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    addNote(trimmed);
  };

  return (
    <div className="mt-4 border-t border-dust/20 pt-3">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-ash hover:text-moonlight transition-colors group"
      >
        {/* Lock icon — internal only signal */}
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-60 group-hover:opacity-100 transition-opacity"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="font-medium">
          Internal notes
          {notes.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-nova/20 text-nova-bright text-[10px] font-bold">
              {notes.length}
            </span>
          )}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="mt-3 space-y-3">
          {/* Admin-only badge */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-nova-bright bg-nova/10 border border-nova/20 rounded px-1.5 py-0.5">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              Admin only · not visible to submitters
            </span>
          </div>

          {/* Notes list */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-xl" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <p className="text-xs text-ash italic">No notes yet. Be the first to add one.</p>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl bg-stardust/30 border border-dust/20 px-3 py-2.5"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-moonlight">
                      {note.author_username ?? `User #${note.author_id}`}
                    </span>
                    <span className="text-[10px] text-ash shrink-0">
                      {timeAgo(note.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-moonlight/90 whitespace-pre-wrap break-words leading-relaxed">
                    {note.body}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Add note form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add an internal note…"
              rows={2}
              maxLength={4000}
              className="w-full resize-none rounded-xl bg-stardust/50 border border-dust/30 focus:border-nova/40 focus:outline-none px-3 py-2 text-sm text-moonlight placeholder:text-ash/50 transition-colors leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
            {submitError && (
              <p className="text-xs text-supernova">{submitError}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ash">⌘↵ to submit</span>
              <button
                type="submit"
                disabled={!draft.trim() || isPending}
                className="btn-nova text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving…" : "Add note"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
