import { ratingsCol, projectsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { ownerReplySchema } from "@/lib/validation/schemas/ratings";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseJsonBody(request, ownerReplySchema);
  if (!parsed.success) return parsed.response;

  const { id } = await params;
  const ref = ratingsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return Response.json({ error: "Rating not found" }, { status: 404 });
  }

  const rating = doc.data()!;
  const projectDoc = await projectsCol.ref.doc(String(rating.project_id)).get();
  if (!projectDoc.exists) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const project = projectDoc.data()!;
  if (project.user_id !== auth.userId) {
    return Response.json(
      { error: "Forbidden: Only the project owner can reply to reviews" },
      { status: 403 }
    );
  }

  const replyAt = new Date().toISOString();
  await ref.update({
    owner_reply: parsed.data.owner_reply,
    owner_reply_at: replyAt,
  });

  return Response.json({
    message: "Reply saved",
    owner_reply: parsed.data.owner_reply,
    owner_reply_at: replyAt,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ref = ratingsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return Response.json({ error: "Rating not found" }, { status: 404 });
  }

  const rating = doc.data()!;
  const projectDoc = await projectsCol.ref.doc(String(rating.project_id)).get();
  if (!projectDoc.exists) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const project = projectDoc.data()!;
  if (project.user_id !== auth.userId && !hasMinRole(auth.role, "admin")) {
    return Response.json(
      { error: "Forbidden: Only the project owner can delete review replies" },
      { status: 403 }
    );
  }

  await ref.update({
    owner_reply: null,
    owner_reply_at: null,
  });

  return Response.json({ message: "Reply deleted" });
}
