import { getSupabase } from "@/lib/firebase";
import { projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { createNoteSchema } from "@/lib/validation/schemas/notes";

export const dynamic = "force-dynamic";

// GET /api/notes/[projectId] — list all notes for a project (admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { projectId } = await params;
  const numericProjectId = Number(projectId);
  if (Number.isNaN(numericProjectId)) {
    return Response.json({ error: "Invalid project ID" }, { status: 400 });
  }

  // Verify project exists
  const pDoc = await projectsCol.ref.doc(projectId).get();
  if (!pDoc.exists) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("submission_notes")
      .select(
        "id, project_id, author_id, body, created_at, users:author_id(username)",
      )
      .eq("project_id", numericProjectId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const notes = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      project_id: row.project_id,
      author_id: row.author_id,
      body: row.body,
      created_at: row.created_at,
      author_username:
        row.users && typeof row.users === "object" && !Array.isArray(row.users)
          ? (row.users as Record<string, unknown>).username
          : null,
    }));

    return Response.json({ notes });
  } catch (err) {
    console.error("Notes GET error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/notes/[projectId] — add a note to a project (admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { projectId } = await params;
  const numericProjectId = Number(projectId);
  if (Number.isNaN(numericProjectId)) {
    return Response.json({ error: "Invalid project ID" }, { status: 400 });
  }

  // Verify project exists
  const pDoc = await projectsCol.ref.doc(projectId).get();
  if (!pDoc.exists) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, createNoteSchema);
  if (!parsed.success) return parsed.response;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("submission_notes")
      .insert({
        project_id: numericProjectId,
        author_id: auth.userId,
        body: parsed.data.body,
        created_at: new Date().toISOString(),
      })
      .select("id, project_id, author_id, body, created_at")
      .single();

    if (error) throw error;

    return Response.json({ note: data }, { status: 201 });
  } catch (err) {
    console.error("Notes POST error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
