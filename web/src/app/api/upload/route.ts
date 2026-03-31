import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
export const dynamic = "force-dynamic";

const BUCKET = "research-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return Response.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > 10) {
      return Response.json({ error: "Maximum 10 files allowed" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Ensure bucket exists (idempotent)
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });

    const urls: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return Response.json(
          { error: `Invalid file type: ${file.type}` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return Response.json(
          { error: `File too large: ${file.name} (max 5MB)` },
          { status: 400 },
        );
      }

      const ext = file.name.split(".").pop() || "png";
      const path = `${auth.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return Response.json(
          { error: `Upload failed: ${error.message}` },
          { status: 500 },
        );
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      urls.push(urlData.publicUrl);
    }

    return Response.json({ urls });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
