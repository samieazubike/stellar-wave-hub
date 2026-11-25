export interface ProProject {
	pro_until?: string | null;
}

export function isPro(project: ProProject, now = Date.now()): boolean {
	if (!project.pro_until) return false;
	const expiration = Date.parse(project.pro_until);
	return Number.isFinite(expiration) && expiration > now;
}
