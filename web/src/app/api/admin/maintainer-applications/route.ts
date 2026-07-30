import { maintainerApplicationsCol, usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = getAuthUser(request);
    if (!auth || auth.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snap = await maintainerApplicationsCol.ref
      .where("status", "==", "pending")
      .get();
      
    const applications = await Promise.all(snap.docs.map(async (doc) => {
      const data = doc.data();
      let user = null;
      if (data.user_id) {
        const userSnap = await usersCol.ref.doc(data.user_id.toString()).get();
        if (userSnap.exists) {
          const u = userSnap.data();
          user = u ? {
            username: u.username,
            email: u.email,
            github_url: u.github_url,
          } : null;
        }
      }
      return {
        id: data.id,
        user_id: data.user_id,
        status: data.status,
        reason: data.reason,
        created_at: data.created_at,
        user,
      };
    }));

    return Response.json({ applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
