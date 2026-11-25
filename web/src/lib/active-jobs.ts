import {getSupabase} from "./firebase";

export interface ActiveJobMetadata {
	has_active_jobs: boolean;
	active_job_url: string | null;
}

interface JobRow {
	project_id: number | string;
	status: string;
	expires_at: string;
	apply_url: string | null;
}

function isJobRow(value: unknown): value is JobRow {
	if (!value || typeof value !== "object") return false;
	const row = value as Record<string, unknown>;
	return (
		(typeof row.project_id === "number" || typeof row.project_id === "string") &&
		typeof row.status === "string" &&
		typeof row.expires_at === "string" &&
		(typeof row.apply_url === "string" || row.apply_url === null)
	);
}

function getMetadataByProject(
	rows: readonly unknown[],
	projectIds: readonly number[],
	now: Date,
): Map<number, ActiveJobMetadata> {
	const requestedIds = new Set(projectIds);
	const activeRows = rows
		.filter(isJobRow)
		.filter((job) => {
			const expiresAt = Date.parse(job.expires_at);
			return (
				requestedIds.has(Number(job.project_id)) &&
				job.status === "active" &&
				Number.isFinite(expiresAt) &&
				expiresAt > now.getTime()
			);
		})
		.sort((a, b) => (a.apply_url ?? "").localeCompare(b.apply_url ?? ""));

	const metadata = new Map<number, ActiveJobMetadata>();
	for (const job of activeRows) {
		const projectId = Number(job.project_id);
		if (!metadata.has(projectId)) {
			metadata.set(projectId, {
				has_active_jobs: true,
				active_job_url: job.apply_url,
			});
		}
	}

	return metadata;
}

export async function getActiveJobsByProject(
	projectIds: readonly number[],
	now = new Date(),
): Promise<Map<number, ActiveJobMetadata>> {
	const uniqueProjectIds = [...new Set(projectIds)];
	if (uniqueProjectIds.length === 0) return new Map();

	const {data, error} = await getSupabase()
		.from("jobs")
		.select("project_id,status,expires_at,apply_url")
		.in("project_id", uniqueProjectIds)
		.eq("status", "active")
		.gt("expires_at", now.toISOString());

	if (error) throw error;

	return getMetadataByProject(data ?? [], uniqueProjectIds, now);
}
