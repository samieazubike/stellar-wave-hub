import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;
    const auth = getAuthUser(request);
    const supabase = getSupabase();

    const { data: story, error } = await supabase
      .from("story_submissions")
      .select(`
        id,
        project_id,
        author_id,
        title,
        body_md,
        status,
        tx_hash,
        slug,
        published_at,
        created_at,
        updated_at,
        projects (
          "numericId",
          name,
          slug,
          user_id
        )
      `)
      .eq("id", Number(id))
      .maybeSingle();

    if (error) throw error;
    if (!story) {
      return Response.json({ error: "Story submission not found" }, { status: 404 });
    }

    // Access check: only admin, story author, or project owner can view non-approved story
    if (story.status !== "approved") {
      if (
        !auth ||
        (!hasMinRole(auth.role, "admin") &&
          auth.userId !== story.author_id &&
          auth.userId !== (story.projects as any)?.user_id)
      ) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return Response.json({ story });
  } catch (err: any) {
    console.error("GET /api/stories/[id] error:", err);
    return Response.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await props.params;
    const body = await request.json().catch(() => null);
    if (!body || !body.status) {
      return Response.json({ error: "status is required" }, { status: 400 });
    }

    const { status } = body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return Response.json(
        { error: "status must be one of: 'approved', 'rejected', 'pending'" },
        { status: 400 },
      );
    }

    const supabase = getSupabase();
    const now = new Date().toISOString();
    const updateData: Record<string, any> = {
      status,
      updated_at: now,
    };

    if (status === "approved") {
      updateData.published_at = now;
    } else if (status === "rejected") {
      updateData.published_at = null;
    }

    const { data: updatedStory, error } = await supabase
      .from("story_submissions")
      .update(updateData)
      .eq("id", Number(id))
      .select(`
        id,
        project_id,
        title,
        body_md,
        status,
        tx_hash,
        slug,
        published_at,
        created_at,
        updated_at,
        projects (
          "numericId",
          name,
          slug
        )
      `)
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      story: updatedStory,
    });
  } catch (err: any) {
    console.error("PATCH /api/stories/[id] error:", err);
    return Response.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
