import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { projectsCol, usersCol } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (user.role !== "maintainer" && user.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Forbidden: maintainer or admin access required" },
      { status: 403 }
    );
  }

  try {
    // Count pending projects
    const pendingSnap = await projectsCol.ref
      .where("status", "==", "submitted")
      .get();
    const pendingCount = pendingSnap.size;

    // Count total projects
    const totalSnap = await projectsCol.ref.get();
    const totalProjects = totalSnap.size;

    // Count total users
    const usersSnap = await usersCol.ref.get();
    const totalUsers = usersSnap.size;

    // Recently moderated (approved or rejected in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const moderatedSnap = await projectsCol.ref
      .where("updated_at", ">=", sevenDaysAgo.toISOString())
      .where("status", "in", ["approved", "rejected"])
      .orderBy("updated_at", "desc")
      .limit(10)
      .get();

    const recentlyModerated = moderatedSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.numericId,
        name: data.name,
        slug: data.slug,
        status: data.status,
        moderatedAt: data.updated_at,
        moderatedBy: data.moderated_by || "system",
      };
    });

    return NextResponse.json({
      ok: true,
      pendingCount,
      totalProjects,
      totalUsers,
      recentlyModerated,
    });
  } catch (error) {
    console.error("Maintainer stats error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load moderation stats" },
      { status: 500 }
    );
  }
}