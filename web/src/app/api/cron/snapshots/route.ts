import {projectsCol} from "@/lib/db";
import {getSupabase} from "@/lib/firebase";
import {getTreasuryBalance} from "@/lib/ratingContract";
import {getAccountSummary} from "@/lib/stellarService";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
	const expectedSecret = process.env.CRON_SECRET;
	if (!expectedSecret) return false;

	const url = new URL(request.url);
	const providedSecret =
		request.headers.get("x-cron-secret") ?? url.searchParams.get("secret");

	return providedSecret === expectedSecret;
}

export async function GET(request: Request) {
	if (!isAuthorized(request)) {
		return Response.json({error: "Unauthorized"}, {status: 401});
	}

	try {
		const approvedProjectsSnap = await projectsCol.ref
			.where("status", "==", "approved")
			.get();

		const projects = approvedProjectsSnap.docs
			.map((doc) => doc.data())
			.filter(
				(project) =>
					typeof project.numericId === "number" &&
					typeof project.stellar_account_id === "string" &&
					project.stellar_account_id.trim().length > 0,
			);

		const supabase = getSupabase();
		const now = new Date();
		const startOfDay = new Date(now);
		startOfDay.setUTCHours(0, 0, 0, 0);
		const endOfDay = new Date(startOfDay);
		endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

		let created = 0;
		let skipped = 0;
		const errors: Array<{project_id: number; error: string}> = [];

		for (const project of projects) {
			const projectId = project.numericId as number;
			const stellarAccountId = project.stellar_account_id as string;

			const {data: existing, error: existingError} = await supabase
				.from("financial_snapshots")
				.select("id")
				.eq("project_id", projectId)
				.gte("created_at", startOfDay.toISOString())
				.lt("created_at", endOfDay.toISOString())
				.limit(1);

			if (existingError) {
				errors.push({project_id: projectId, error: existingError.message});
				continue;
			}

			if (existing && existing.length > 0) {
				skipped += 1;
				continue;
			}

			try {
				const summary = await getAccountSummary(stellarAccountId);
				const {error: insertError} = await supabase
					.from("financial_snapshots")
					.insert({
						project_id: projectId,
						snapshot_data: summary,
					});

				if (insertError) {
					errors.push({project_id: projectId, error: insertError.message});
					continue;
				}

				created += 1;
			} catch (error) {
				errors.push({
					project_id: projectId,
					error:
						error instanceof Error
							? error.message
							: "Failed to fetch account summary",
				});
			}
		}

		let treasury: {
			status: "created" | "skipped" | "unavailable" | "error";
			error?: string;
		} = {status: "unavailable"};
		let treasuryErrorMessage = "Failed to fetch treasury balance";

		try {
			const balance = await getTreasuryBalance();
			if (balance === null) {
				treasury = {status: "unavailable"};
			} else {
				const snapshotDate = now.toISOString().slice(0, 10);
				treasuryErrorMessage = "Failed to check today's treasury snapshot";
				const {data: existing, error: existingError} = await supabase
					.from("treasury_snapshots")
					.select("snapshot_date")
					.eq("snapshot_date", snapshotDate)
					.maybeSingle();

				if (existingError) {
					throw existingError;
				}

				if (existing) {
					treasury = {status: "skipped"};
				} else {
					treasuryErrorMessage = "Failed to save today's treasury snapshot";
					const {error: insertError} = await supabase
						.from("treasury_snapshots")
						.insert({snapshot_date: snapshotDate, balance: balance.toString()});

					if (insertError?.code === "23505") {
						treasury = {status: "skipped"};
					} else if (insertError) {
						throw insertError;
					} else {
						treasury = {status: "created"};
					}
				}
			}
		} catch (error) {
			console.error("Cron treasury snapshot failed:", error);
			treasury = {
				status: "error",
				error: treasuryErrorMessage,
			};
		}

		return Response.json({
			total_projects: projects.length,
			created,
			skipped,
			errors,
			treasury,
		});
	} catch (error) {
		console.error("Cron snapshots job failed:", error);
		return Response.json(
			{error: "Failed to run snapshots job"},
			{status: 500},
		);
	}
}
