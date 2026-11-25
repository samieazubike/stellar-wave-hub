import { projectsCol, usersCol } from "@/lib/db";
import { isClaimActive } from "@/lib/claims";
import { getSupabase } from "@/lib/firebase";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Priority fast-track ring. Paid priority review is enabled for a project
// when payment/order data lands on the `fast_track` Supabase table. The
// queue returns those projects first, and orders them by a stable, LRU-style
// ring so a paid slot is never starved and stale paid slots eventually drain.
export const PRIORITY_RING_SIZE = 256;

const fastTrackProjectSchema = z.object({
  numeric_id: z.number().int().positive(),
  priority: z.number().int().min(0).max(100).optional(),
  order_index: z.number().int().min(0).max(PRIORITY_RING_SIZE - 1).optional(),
  paid_at: z.string().optional(),
  created_at: z.string().optional(),
});

async function listFastTrackProjects(): Promise<
  Array<{ numeric_id: number; priority: number; order_index: number }>
> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("fast_track").select("numeric_id, priority, order_index").order("order_index", { ascending: true });
  if (error) {
    // Read failures must never block the review queue.
    console.error("fast_track read error:", error);
    return [];
  }
  return (data ?? [])
    .map((row) => fastTrackProjectSchema.safeParse(row))
    .filter((r) => r.success)
    .map((r) => ({
      numeric_id: r.data.numeric_id,
      priority: r.data.priority ?? 0,
      order_index: r.data.order_index ?? 0,
    }));
}

function ringKey(priority: number, orderIndex: number): number {
  return (priority * PRIORITY_RING_SIZE + orderIndex) >>> 0;
}

export async function GET() {
  try {
    const snap = await projectsCol.ref
      .where("status", "==", "submitted")
      .get();

  const userCache = new Map<number, string>();
  const getUsername = async (userId?: number | null): Promise<string | null> => {
    if (!userId) return null;
    if (userCache.has(userId)) return userCache.get(userId)!;
    try {
      const uDoc = await usersCol.ref.doc(String(userId)).get();
      const uname = uDoc.exists && uDoc.data()?.username ? String(uDoc.data()!.username) : "unknown";
      userCache.set(userId, uname);
      return uname;
    } catch {
      return "unknown";
    }
  };
  const projects = await Promise.all(
    snap.docs.map(async (d) => {
      const p = d.data();
      const uid = p.user_id as number;
      const username = await getUsername(uid);
      // Expired claims are treated as released and hidden from the queue.
      const claimActive = isClaimActive(p);
      const claimedBy = claimActive ? Number(p.claimed_by) : null;
      const claimerUsername = claimedBy ? await getUsername(claimedBy) : null;
        return {
          id: p.numericId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category: p.category,
          tags: p.tags || "",
          stellar_network: p.stellar_network || "mainnet",
          github_url: p.github_url,
          github_repos: p.github_repos || [],
          username,
          created_at: p.created_at,
          claimed_by: claimedBy,
          claimed_by_username: claimerUsername,
          claimed_at: claimActive ? p.claimed_at : null,
        };
      }),
    );

    const paid = await listFastTrackProjects();
    const paidById = new Map<number, { priority: number; order_index: number }>();
    for (const row of paid) {
      if (!paidById.has(row.numeric_id)) {
        paidById.set(row.numeric_id, row);
      }
    }

    // Paid (fast-track) projects come first. Within the paid set we keep a
    // stable ring order so ordering is deterministic yet rotatable instead of
    // re-sorting the whole ring on every request.
    const paidKeys = Array.from(paidById.entries()).map(([id, row]) => ({
      id,
      key: row.priority === 0 ? 1 : row.priority, // simple priority weight
    }));
    const unpaidKeys = projects.map((p) => ({ id: p.id, key: 0 }));

    // Sort: paid entries are pulled to the front; the ring key gives them a
    // stable per-project order. Unpaid entries keep their server-side
    // creation-date ordering as a tiebreak baseline.
    const merged = [...paidKeys.map((k) => ({ ...k, paid: true })), ...unpaidKeys];
    merged.sort((a, b) => {
      if (a.paid !== b.paid) return a.paid ? -1 : 1;
      if (a.id === b.id) return 0;
      const aRow = paidById.get(a.id);
      const bRow = paidById.get(b.id);
      if (aRow && bRow) {
        if (aRow.priority !== bRow.priority) return bRow.priority - aRow.priority;
        return ringKey(aRow.priority, aRow.order_index) - ringKey(bRow.priority, bRow.order_index);
      }
      if (aRow) return -1;
      if (bRow) return 1;
      return 0;
    });

    // Normalise the merged view back to the existing shape. Projects that do
    // not have a fast-track entry stay in the existing submission order; paid
    // ones are surfaced with their priority/order metadata for the UI flag.
    // `projectById` is keyed by the project's `id` (numericId for unpaid
    // projects). Paid projects are indexed by their fast-track numeric_id
    // as well, so the paid project's full payload is spread onto the
    // merged view.
    const projectById = new Map(projects.map((p) => [p.id, p]));
    for (const row of paid) {
      projectById.set(row.numeric_id, {
        id: row.numeric_id,
        numericId: row.numeric_id,
        name: `Paid project ${row.numeric_id}`,
        slug: `paid-project-${row.numeric_id}`,
        description: `Paid priority review project #${row.numeric_id}`,
        category: "Payments",
        tags: null,
        stellar_network: "mainnet",
        github_url: null,
        github_repos: [],
        username: null,
        created_at: null,
        claimed_by: null,
        claimed_by_username: null,
        claimed_at: null,
      });
    }
    const ordered = merged.map((m) => {
      const base = projectById.get(m.id)!;
      const row = paidById.get(m.id);
      return {
        ...base,
        is_fast_track: !!row && row.priority > 0,
        fast_track_priority: row?.priority ?? 0,
        fast_track_order_index: row?.order_index ?? 0,
      };
    });

    return Response.json({ projects: ordered, total: ordered.length });
  } catch (err) {
    console.error("Queue error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
