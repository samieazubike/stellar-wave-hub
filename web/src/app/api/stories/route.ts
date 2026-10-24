import slugify from "slugify";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { getProjectStoryPriceXlm } from "@/lib/pricing";
import { verifyStellarPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const projectId = searchParams.get("project_id");

    const supabase = getSupabase();
    let query = supabase
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
          logo_url,
          user_id
        )
      `)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (projectId) {
      query = query.eq("project_id", Number(projectId));
    }

    // Non-admins can only see their own submissions or approved public stories
    if (!auth || !hasMinRole(auth.role, "admin")) {
      if (!auth) {
        // Unauthenticated users can only see approved stories
        query = query.eq("status", "approved");
      } else if (!projectId) {
        // Authenticated non-admin: either approved or created by them
        query = query.or(`status.eq.approved,author_id.eq.${auth.userId}`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ submissions: data || [] });
  } catch (err: any) {
    console.error("GET /api/stories error:", err);
    return Response.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { project_id, title, body_md, tx_hash } = body;

    if (!project_id || isNaN(Number(project_id))) {
      return Response.json({ error: "project_id is required and must be numeric" }, { status: 400 });
    }

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return Response.json(
        { error: "title is required and must be at least 3 characters" },
        { status: 400 },
      );
    }

    if (!body_md || typeof body_md !== "string" || body_md.trim().length < 10) {
      return Response.json(
        { error: "body_md is required and must be at least 10 characters" },
        { status: 400 },
      );
    }

    if (!tx_hash || typeof tx_hash !== "string" || !tx_hash.trim()) {
      return Response.json(
        { error: "tx_hash is required" },
        { status: 400 },
      );
    }

    const cleanTxHash = tx_hash.trim();
    const cleanTitle = title.trim();
    const cleanBodyMd = body_md.trim();
    const numericProjectId = Number(project_id);

    const supabase = getSupabase();

    // 1. Fetch project to ensure it exists and verify owner
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`"numericId", name, slug, user_id`)
      .eq("numericId", numericProjectId)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Owner only check (or admin)
    if (project.user_id !== auth.userId && !hasMinRole(auth.role, "admin")) {
      return Response.json(
        { error: "Only the project owner can submit a story for this project" },
        { status: 403 },
      );
    }

    // 2. Check if tx_hash was already redeemed in payments table
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("tx_hash", cleanTxHash)
      .maybeSingle();

    if (existingPayment) {
      return Response.json(
        { error: "Payment transaction has already been redeemed" },
        { status: 400 },
      );
    }

    // Also check story_submissions
    const { data: existingStory } = await supabase
      .from("story_submissions")
      .select("id")
      .eq("tx_hash", cleanTxHash)
      .maybeSingle();

    if (existingStory) {
      return Response.json(
        { error: "Payment transaction has already been redeemed" },
        { status: 400 },
      );
    }

    // 3. Verify on-chain payment on Horizon
    const expectedPrice = getProjectStoryPriceXlm();
    const recipient =
      process.env.STELLAR_TREASURY_ACCOUNT ||
      process.env.NEXT_PUBLIC_STELLAR_TREASURY_ACCOUNT ||
      undefined;

    let paymentDetails;
    try {
      paymentDetails = await verifyStellarPayment(cleanTxHash, {
        expectedAmount: expectedPrice,
        recipient,
      });
    } catch (verifyErr: any) {
      return Response.json(
        { error: verifyErr.message || "Failed to verify payment on Horizon" },
        { status: 400 },
      );
    }

    // 4. Record redemption in payments table
    const { error: paymentInsertError } = await supabase.from("payments").insert({
      tx_hash: cleanTxHash,
      product: "project_story",
      amount: paymentDetails.amount,
      metadata: {
        project_id: numericProjectId,
        project_name: project.name,
        project_slug: project.slug,
        author_id: auth.userId,
        title: cleanTitle,
      },
      created_at: new Date().toISOString(),
    });

    if (paymentInsertError) {
      if (paymentInsertError.code === "23505") {
        return Response.json(
          { error: "Payment transaction has already been redeemed" },
          { status: 400 },
        );
      }
      throw paymentInsertError;
    }

    // 5. Generate unique slug
    const baseSlugPart = slugify(cleanTitle, { lower: true, strict: true }) || "story";
    let slug = `${project.slug}-${baseSlugPart}`;

    const { data: slugMatch } = await supabase
      .from("story_submissions")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugMatch) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 6. Insert story submission
    const now = new Date().toISOString();
    const { data: storySubmission, error: storyError } = await supabase
      .from("story_submissions")
      .insert({
        project_id: numericProjectId,
        author_id: auth.userId,
        title: cleanTitle,
        body_md: cleanBodyMd,
        status: "pending",
        tx_hash: cleanTxHash,
        slug,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (storyError) {
      throw storyError;
    }

    return Response.json(
      {
        success: true,
        story: storySubmission,
        message: "Story submitted successfully and is pending admin review.",
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/stories error:", err);
    return Response.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.id) {
      return Response.json({ error: "Story id is required" }, { status: 400 });
    }

    const { id, status } = body;
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
    console.error("PATCH /api/stories error:", err);
    return Response.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
