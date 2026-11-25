import { projectsCol, ratingsCol, reportsCol, nextId } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { createReportSchema } from "@/lib/validation/schemas/reports";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const reportRateLimit = { limit: 10, windowMs: 60_000 };

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const targetType = url.searchParams.get("target_type");
  const targetIdParam = url.searchParams.get("target_id");

  if (!targetType || !targetIdParam) {
    return Response.json(
      { error: "target_type and target_id are required" },
      { status: 400 }
    );
  }

  const targetId = Number(targetIdParam);
  if (Number.isNaN(targetId) || targetId <= 0) {
    return Response.json({ error: "Invalid target_id" }, { status: 400 });
  }

  try {
    const existing = await reportsCol.ref
      .where("target_type", "==", targetType)
      .where("target_id", "==", targetId)
      .where("reporter_id", "==", auth.userId)
      .where("status", "==", "open")
      .limit(1)
      .get();

    return Response.json({
      hasOpenReport: !existing.empty,
      report: !existing.empty ? existing.docs[0].data() : null,
    });
  } catch (err) {
    console.error("Fetch report status error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit by reporter
  const rateLimit = checkRateLimit(`report:${auth.userId}`, reportRateLimit);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  const parsed = await parseJsonBody(request, createReportSchema);
  if (!parsed.success) return parsed.response;

  const { target_type, target_id, reason, note, details } = parsed.data;

  try {
    // 1. Verify target existence and prevent self-reporting
    if (target_type === "project") {
      let projectData: Record<string, unknown> | undefined;
      const projectDoc = await projectsCol.ref.doc(String(target_id)).get();
      if (projectDoc.exists) {
        projectData = projectDoc.data();
      } else {
        const snap = await projectsCol.ref
          .where("numericId", "==", target_id)
          .limit(1)
          .get();
        if (!snap.empty) {
          projectData = snap.docs[0].data();
        }
      }

      if (!projectData) {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }

      if (projectData.user_id === auth.userId) {
        return Response.json(
          { error: "Cannot report your own project" },
          { status: 400 }
        );
      }
    } else if (target_type === "rating") {
      let ratingData: Record<string, unknown> | undefined;
      const ratingDoc = await ratingsCol.ref.doc(String(target_id)).get();
      if (ratingDoc.exists) {
        ratingData = ratingDoc.data();
      } else {
        const snap = await ratingsCol.ref
          .where("numericId", "==", target_id)
          .limit(1)
          .get();
        if (!snap.empty) {
          ratingData = snap.docs[0].data();
        }
      }

      if (!ratingData) {
        return Response.json({ error: "Review not found" }, { status: 404 });
      }

      if (ratingData.user_id === auth.userId) {
        return Response.json(
          { error: "Cannot report your own review" },
          { status: 400 }
        );
      }
    }

    // 2. Acceptance criteria: One open report per user per target (dedupe)
    const existing = await reportsCol.ref
      .where("target_type", "==", target_type)
      .where("target_id", "==", target_id)
      .where("reporter_id", "==", auth.userId)
      .where("status", "==", "open")
      .limit(1)
      .get();

    if (!existing.empty) {
      return Response.json(
        {
          error: `You already have an open report for this ${
            target_type === "project" ? "project" : "review"
          }`,
        },
        { status: 409 }
      );
    }

    // 3. Save report with note and open status
    const numericId = await nextId("reports");
    const noteContent = (note ?? details ?? "")?.trim() || null;
    const now = new Date().toISOString();

    const reportData = {
      id: numericId,
      numericId,
      target_type,
      target_id,
      reporter_id: auth.userId,
      reason,
      note: noteContent,
      details: noteContent,
      status: "open",
      created_at: now,
      updated_at: now,
    };

    await reportsCol.ref.doc(String(numericId)).set(reportData);

    return Response.json(
      { message: "Report submitted", report: reportData },
      { status: 201 }
    );
  } catch (err) {
    console.error("Report error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
