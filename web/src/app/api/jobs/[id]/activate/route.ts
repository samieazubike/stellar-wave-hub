import {getAuthUser, hasMinRole} from "@/lib/auth";
import {getSupabase} from "@/lib/firebase";
import {buildMemo, getPrice} from "@/lib/pricing";
import {notifyPurchase} from "@/lib/notify";
import {verifyStellarPayment} from "@/lib/payments";

export const dynamic = "force-dynamic";

type Params = {params: Promise<{id: string}>};

function parseId(raw: string): number | null {
	if (!/^\d+$/.test(raw)) return null;
	const id = Number(raw);
	return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function POST(request: Request, {params}: Params) {
	const auth = getAuthUser(request);
	if (!auth) return Response.json({error: "Unauthorized"}, {status: 401});

	const id = parseId((await params).id);
	if (!id) return Response.json({error: "Invalid job ID"}, {status: 400});

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({error: "Invalid request body"}, {status: 400});
	}

	const txHash = body && typeof body === "object"
		? (body as Record<string, unknown>).tx_hash
		: undefined;
	const featured = body && typeof body === "object"
		? (body as Record<string, unknown>).featured
		: false;
	if (typeof txHash !== "string" || !/^[a-f0-9]{64}$/i.test(txHash)) {
		return Response.json({error: "A valid Stellar transaction hash is required"}, {status: 400});
	}
	if (typeof featured !== "boolean") {
		return Response.json({error: "featured must be a boolean"}, {status: 400});
	}

	try {
		const supabase = getSupabase();
		const {data: job, error: jobError} = await supabase
			.from("jobs")
			.select("id,project_id,posted_by,title,status,expires_at,featured_until,tx_hash")
			.eq("id", id)
			.maybeSingle();
		if (jobError) throw jobError;
		if (!job) return Response.json({error: "Job not found"}, {status: 404});
		if (Number(job.posted_by) !== auth.userId && !hasMinRole(auth.role, "admin")) {
			return Response.json({error: "Forbidden"}, {status: 403});
		}

		if (job.status === "active") {
			if (job.tx_hash === txHash) {
				return Response.json({
					success: true,
					job_id: id,
					expires_at: job.expires_at,
					featured_until: job.featured_until,
				});
			}
			return Response.json({error: "This job has already been activated"}, {status: 409});
		}
		if (job.status !== "draft") {
			return Response.json({error: "Only draft jobs can be activated"}, {status: 409});
		}

		const price = getPrice("job_post");
		const memo = buildMemo("job_post", id);
		let payment: Awaited<ReturnType<typeof verifyStellarPayment>>;
		try {
			payment = await verifyStellarPayment(txHash, price, memo);
		} catch (error) {
			console.error("Job payment verification error:", error);
			return Response.json({error: "Payment could not be verified"}, {status: 422});
		}
		const {data, error: redemptionError} = await supabase.rpc("redeem_job_payment", {
			p_tx_hash: payment.txHash,
			p_user_id: Number(job.posted_by),
			p_job_id: id,
			p_amount: payment.amountXlm,
			p_source_address: payment.sourceAddress,
			p_destination_address: payment.destinationAddress,
			p_network: payment.network,
			p_featured: featured,
		});

		if (redemptionError?.code === "23505") {
			return Response.json({error: "This transaction has already been redeemed"}, {status: 409});
		}
		if (redemptionError?.code === "P0002") {
			return Response.json({error: "This job is no longer available for activation"}, {status: 409});
		}
		if (redemptionError) throw redemptionError;

		const result = data as {
			expires_at?: string;
			featured_until?: string | null;
			project_id?: number;
			title?: string;
		};
		void notifyPurchase({
			product: "job_post",
			amount: payment.amountXlm,
			project_id: result.project_id ?? Number(job.project_id),
			project_name: result.title ?? String(job.title),
			network: payment.network,
			tx_hash: payment.txHash,
		});

		return Response.json({
			success: true,
			job_id: id,
			expires_at: result.expires_at,
			featured_until: result.featured_until ?? null,
		});
	} catch (error) {
		console.error("Job activation error:", error);
		return Response.json({error: "Unable to activate job"}, {status: 500});
	}
}
