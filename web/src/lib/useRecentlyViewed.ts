"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "swh_recently_viewed";
const CHANGE_EVENT = "swh:recently-viewed-change";

export const MAX_RECENTLY_VIEWED = 8;

export interface RecentlyViewedProject {
  id: number;
  slug: string;
  name: string;
  logo_url?: string | null;
  category?: string;
}

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function handleStorageChange(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) notifyListeners();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function getSnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The strip
    // stays hidden because there is nothing to display.
    return "";
  }
}

function getServerSnapshot(): string {
  return "";
}

function isRecentlyViewedProject(value: unknown): value is RecentlyViewedProject {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    Number.isInteger(candidate.id) &&
    candidate.id > 0 &&
    typeof candidate.slug === "string" &&
    candidate.slug.trim().length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    (candidate.logo_url === undefined ||
      candidate.logo_url === null ||
      typeof candidate.logo_url === "string") &&
    (candidate.category === undefined || typeof candidate.category === "string")
  );
}

/** Parse a stored snapshot into a deduplicated, capped list. */
export function parseRecentlyViewed(snapshot: string | null): RecentlyViewedProject[] {
  if (!snapshot) return [];

  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (!Array.isArray(parsed)) return [];

    const projects = parsed.filter(isRecentlyViewedProject);
    const unique = projects.filter(
      (project, index) =>
        projects.findIndex((candidate) => candidate.slug === project.slug) === index,
    );
    return unique.slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    return [];
  }
}

/** Move a project to the front of the list, removing any older entry for it. */
export function mergeRecentlyViewed(
  current: RecentlyViewedProject[],
  project: RecentlyViewedProject,
): RecentlyViewedProject[] {
  return [
    project,
    ...current.filter((candidate) => candidate.slug !== project.slug),
  ].slice(0, MAX_RECENTLY_VIEWED);
}

function readStored(): RecentlyViewedProject[] {
  return parseRecentlyViewed(getSnapshot());
}

function writeStored(projects: RecentlyViewedProject[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    notifyListeners();
  } catch (error) {
    console.warn("Unable to save recently viewed projects.", error);
  }
}

export function useRecentlyViewed() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const recent = useMemo(() => parseRecentlyViewed(snapshot), [snapshot]);

  const record = useCallback((project: RecentlyViewedProject) => {
    writeStored(mergeRecentlyViewed(readStored(), project));
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      notifyListeners();
    } catch (error) {
      console.warn("Unable to clear recently viewed projects.", error);
    }
  }, []);

  return { recent, record, clear };
}
