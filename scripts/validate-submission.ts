/**
 * Submission validation utilities for Stellar Wave Hub project submissions.
 * Used by the submission script and property-based tests.
 */

/**
 * Counts the number of words in a string.
 * Words are defined as sequences of non-whitespace characters.
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Checks that a description meets the minimum word count requirement (200 words).
 */
export function isDescriptionValid(description: string): boolean {
  return countWords(description) >= 200;
}

/**
 * Checks that a tags string contains both "privacy" and "security".
 * Tags are expected as a comma-separated string.
 */
export function hasRequiredTags(tags: string): boolean {
  if (!tags) return false;
  const lower = tags.toLowerCase();
  return lower.includes("privacy") && lower.includes("security");
}

/**
 * Checks that a research markdown file content contains:
 * - At least one Stellar account ID (G... 56 chars) or contract ID (C... 56 chars)
 * - At least one verification URL (http/https)
 */
export function researchFileIsValid(content: string): boolean {
  const stellarIdPattern = /[GC][A-Z2-7]{55}/;
  const urlPattern = /https?:\/\/[^\s]+/;
  return stellarIdPattern.test(content) && urlPattern.test(content);
}

/**
 * Validates a full project submission payload.
 * Returns an array of validation error messages (empty = valid).
 */
export function validateSubmissionPayload(payload: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (!payload.name || typeof payload.name !== "string" || payload.name.trim() === "") {
    errors.push("name is required");
  }
  if (!payload.description || typeof payload.description !== "string") {
    errors.push("description is required");
  } else if (!isDescriptionValid(payload.description)) {
    errors.push(`description must be at least 200 words (got ${countWords(payload.description)})`);
  }
  if (!payload.category || typeof payload.category !== "string" || payload.category.trim() === "") {
    errors.push("category is required");
  }
  if (!payload.tags || typeof payload.tags !== "string") {
    errors.push("tags is required");
  } else if (!hasRequiredTags(payload.tags)) {
    errors.push('tags must include "privacy" and "security"');
  }

  return errors;
}
