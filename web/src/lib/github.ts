/** Extract "owner/repo" from a GitHub URL, or null if it isn't one. */
export function parseGithubRepo(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const match = /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?(?:[?#].*)?$/i.exec(url.trim());
  return match ? `${match[1]}/${match[2]}` : null;
}
