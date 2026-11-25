import {getSupabase} from "@/lib/firebase";

export const dynamic = "force-dynamic";

interface Suggestion {
	id: number;
	name: string;
	slug: string;
	logo_url: string | null;
}

export async function GET(request: Request) {
	const url = new URL(request.url);
	const q = (url.searchParams.get("q") ?? "").replace(/[%_,()]/g, " ").trim();

	if (!q) {
		return Response.json({suggestions: []});
	}

	try {
		const supabase = getSupabase();
		const {data, error} = await supabase
			.from("projects")
			.select("numericId,name,slug,logo_url")
			.in("status", ["approved", "featured"])
			.ilike("name", `%${q}%`)
			.limit(30);

		if (error) throw error;

		const needle = q.toLowerCase();
		const suggestions: Suggestion[] = (data ?? [])
			.map((row) => ({
				id: Number(row.numericId),
				name: String(row.name ?? ""),
				slug: String(row.slug ?? row.numericId ?? ""),
				logo_url: typeof row.logo_url === "string" ? row.logo_url : null,
			}))
			.filter((project) => project.name)
			.sort((a, b) => {
				const aName = a.name.toLowerCase();
				const bName = b.name.toLowerCase();
				const aPrefix = aName.startsWith(needle) ? 0 : 1;
				const bPrefix = bName.startsWith(needle) ? 0 : 1;
				if (aPrefix !== bPrefix) return aPrefix - bPrefix;
				return a.name.localeCompare(b.name);
			})
			.slice(0, 6);

		return Response.json({suggestions}, {
			headers: {"Cache-Control": "no-store"},
		});
	} catch (error) {
		console.error("Project suggestions error:", error);
		return Response.json({suggestions: []}, {status: 500});
	}
}
