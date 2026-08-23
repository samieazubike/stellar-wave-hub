import { approvalRequestsCol, projectsCol, usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending";

    const snap = await approvalRequestsCol.ref.where("status", "==", status).get();

    const userCache = new Map<number, string>();
    async function getUsername(uid: number): Promise<string> {
      if (userCache.has(uid)) return userCache.get(uid)!;
      const uDoc = await usersCol.ref.doc(String(uid)).get();
      const name = uDoc.exists ? (uDoc.data()!.username as string) : "unknown";
      userCache.set(uid, name);
      return name;
    }

    const requests = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const projectDoc = await projectsCol.ref.doc(String(data.project_id)).get();
        const project = projectDoc.exists ? projectDoc.data() : null;

        return {
          ...data,
          id: data.numericId,
          project_name: project?.name ?? "Unknown Project",
          project_slug: project?.slug ?? "",
          project_status: project?.status ?? "",
          requester_username: await getUsername(data.requested_by as number),
          reviewer_username: data.reviewer_id
            ? await getUsername(data.reviewer_id as number)
            : null,
        };
      })
    );

    // Sort by newest first
    requests.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));

    return Response.json({ approvalRequests: requests });
  } catch (err) {
    console.error("List approval requests error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
