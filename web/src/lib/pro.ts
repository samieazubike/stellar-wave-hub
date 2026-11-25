export interface ProStatusFields {
  is_pro?: boolean | number | null;
  pro_until?: string | null;
  plan?: string | null;
}

export const FREE_RESEARCH_IMAGE_LIMIT = 10;
export const PRO_RESEARCH_IMAGE_LIMIT = 12;

/**
 * Determines whether a project currently has an active Pro plan.
 */
export function isPro(
  project?: ProStatusFields | null,
  now: number = Date.now(),
): boolean {
  if (!project) return false;

  if (project.pro_until) {
    const expiresAt = Date.parse(project.pro_until);
    if (!Number.isNaN(expiresAt)) {
      return expiresAt > now;
    }
  }

  if (project.is_pro === true || project.is_pro === 1) {
    return true;
  }

  if (typeof project.plan === "string" && project.plan.toLowerCase() === "pro") {
    return true;
  }

  return false;
}

export function getResearchImageLimit(
  project?: ProStatusFields | null,
  now: number = Date.now(),
): number {
  return isPro(project, now)
    ? PRO_RESEARCH_IMAGE_LIMIT
    : FREE_RESEARCH_IMAGE_LIMIT;
}
