import { getSupabase } from "@/lib/firebase";

export interface PublicApiProject {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  website_url: string | null;
  github_url: string | null;
  logo_url: string | null;
  stellar_account_id: string | null;
  stellar_contract_id: string | null;
  stellar_network: string;
  featured: boolean;
  created_at: string;
  rating: { average: number | null; count: number };
}

type ProjectRow = {
  numericId: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string | null;
  website_url: string | null;
  github_url: string | null;
  logo_url: string | null;
  stellar_account_id: string | null;
  stellar_contract_id: string | null;
  stellar_network: string;
  featured: number;
  created_at: string;
};

const PROJECT_FIELDS = 'numericId,slug,name,description,category,tags,website_url,github_url,logo_url,stellar_account_id,stellar_contract_id,stellar_network,featured,created_at';

export async function getApprovedProjects(): Promise<PublicApiProject[]> {
  const supabase = getSupabase();
  const rows: ProjectRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_FIELDS)
      .in("status", ["approved", "featured"])
      .order("numericId", { ascending: true })
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data as ProjectRow[] || []));
    if (!data || data.length < 1000) break;
  }
  if (rows.length === 0) return [];

  const totals = new Map<number, { sum: number; count: number }>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("ratings")
      .select("project_id,score")
      .order("numericId", { ascending: true })
      .range(offset, offset + 999);
    if (error) throw error;
    for (const rating of data || []) {
      const id = Number(rating.project_id);
      const current = totals.get(id) || { sum: 0, count: 0 };
      current.sum += Number(rating.score);
      current.count += 1;
      totals.set(id, current);
    }
    if (!data || data.length < 1000) break;
  }

  return rows.map((row) => {
    const total = totals.get(Number(row.numericId));
    return {
      id: Number(row.numericId),
      slug: row.slug,
      name: row.name,
      description: row.description,
      category: row.category,
      tags: row.tags ? row.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      website_url: row.website_url,
      github_url: row.github_url,
      logo_url: row.logo_url,
      stellar_account_id: row.stellar_account_id,
      stellar_contract_id: row.stellar_contract_id,
      stellar_network: row.stellar_network,
      featured: Boolean(row.featured),
      created_at: row.created_at,
      rating: {
        average: total ? Math.round((total.sum / total.count) * 100) / 100 : null,
        count: total?.count || 0,
      },
    };
  });
}

export async function getLatestFinancialSnapshot(projectId: number) {
  const { data, error } = await getSupabase()
    .from("financial_snapshots")
    .select("snapshot_data,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? { captured_at: data.created_at, summary: data.snapshot_data } : null;
}

export const publicApiCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
  "Cache-Control": "private, no-store",
};
