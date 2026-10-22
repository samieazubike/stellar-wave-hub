import { getAuthUser, hasMinRole } from "@/lib/auth";
import { nextId, projectUpdatesCol, projectsCol, usersCol } from "@/lib/db";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createUpdateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title must be 120 characters or fewer"),
  body: z.string().trim().min(1, "Body is required").max(5000, "Body must be 5000 characters or fewer"),
});

async function findProject(id: string) {
  if (/^\d+$/.test(id)) {
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId) || numericId <= 0) return null;
    const project = await projectsCol.ref.doc(id).get();
    return project.exists ? project.data()! : null;
  }

  const projects = await projectsCol.ref.where("slug", "==", id).limit(1).get();
  return projects.empty ? null : projects.docs[0].data();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const project = await findProject(id);
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    const projectId = Number(project.numericId);
    const updatesSnap = await projectUpdatesCol.ref
      .where("project_id", "==", projectId)
      .orderBy("created_at", "desc")
      .get();

    const updates = await Promise.all(
      updatesSnap.docs.map(async (doc) => {
        const update = doc.data();
        const author = await usersCol.ref.doc(String(update.author_id)).get();
        return {
          ...update,
          id: Number(update.id ?? doc.id),
          author_username: author.exists ? author.data()!.username : "Unknown user",
        };
      }),
    );

    return Response.json({ updates });
  } catch (err) {
    console.error("Project updates GET error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const project = await findProject(id);
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    if (project.user_id !== auth.userId && !hasMinRole(auth.role, "admin")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await parseJsonBody(request, createUpdateSchema);
    if (!parsed.success) return parsed.response;

    const numericId = await nextId("project_updates");
    const update = {
      id: numericId,
      project_id: Number(project.numericId),
      author_id: auth.userId,
      title: parsed.data.title,
      body: parsed.data.body,
      created_at: new Date().toISOString(),
    };

    await projectUpdatesCol.ref.doc(String(numericId)).set(update);
    return Response.json({ update }, { status: 201 });
  } catch (err) {
    console.error("Project updates POST error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const updateId = new URL(request.url).searchParams.get("updateId");
  if (!updateId || !/^\d+$/.test(updateId) || !Number.isSafeInteger(Number(updateId))) {
    return Response.json({ error: "A valid updateId is required" }, { status: 400 });
  }

  try {
    const project = await findProject(id);
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    const updateRef = projectUpdatesCol.ref.doc(updateId);
    const updateDoc = await updateRef.get();
    if (!updateDoc.exists || Number(updateDoc.data()!.project_id) !== Number(project.numericId)) {
      return Response.json({ error: "Project update not found" }, { status: 404 });
    }

    const update = updateDoc.data()!;
    if (
      project.user_id !== auth.userId &&
      !hasMinRole(auth.role, "admin")
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await updateRef.delete();
    return Response.json({ message: "Project update deleted" });
  } catch (err) {
    console.error("Project updates DELETE error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
