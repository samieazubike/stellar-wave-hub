import { randomUUID } from "node:crypto";
import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";
import {
  ALLOWED_MIME_TYPES,
  KIND_INFO,
  MAX_DIMENSION,
  MAX_FILES,
  MAX_FILE_SIZE,
  detectKind,
  getDimensions,
  isSafeSvg,
  type ImageKind,
} from "@/lib/uploadValidation";

export const dynamic = "force-dynamic";

// Rate limit: 20 uploads per hour per user (falls back to IP when anonymous)
const UPLOAD_RATE_LIMIT = { limit: 20, windowMs: 60 * 60_000 };

const BUCKET = "research-images";
// Reject oversized bodies before buffering them (files + multipart overhead)
const MAX_BODY_SIZE = MAX_FILES * MAX_FILE_SIZE + 1024 * 1024;

const badRequest = (error: string) => Response.json({ error }, { status: 400 });

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  const rateLimitKey = auth
    ? `upload:user:${auth.userId}`
    : `upload:ip:${getClientIp(request)}`;
  const rl = checkRateLimit(rateLimitKey, UPLOAD_RATE_LIMIT);
  if (!rl.allowed) return rateLimitExceededResponse(rl.retryAfterSeconds);

  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_SIZE) {
    return Response.json({ error: "Request too large" }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const entries = formData.getAll("files");

    if (!entries.length) return badRequest("No files provided");
    if (entries.length > MAX_FILES) {
      return badRequest(`Maximum ${MAX_FILES} files allowed`);
    }

    // Validate every file before uploading any, so a bad file never leaves partial uploads
    const validated: { buffer: Buffer; kind: ImageKind }[] = [];

    for (const entry of entries) {
      if (!(entry instanceof File)) return badRequest("Invalid file field");
      if (entry.size === 0) return badRequest(`Empty file: ${entry.name}`);
      if (entry.size > MAX_FILE_SIZE) {
        return badRequest(`File too large: ${entry.name} (max 2MB)`);
      }

      const buffer = Buffer.from(await entry.arrayBuffer());

      // Type comes from the file's magic bytes, never from file.type or file.name
      const kind = detectKind(buffer);
      if (!kind) {
        return badRequest(`Invalid file type: ${entry.name}. Allowed: PNG, JPEG, WebP, SVG`);
      }

      if (kind === "svg") {
        if (!isSafeSvg(buffer.toString("utf8"))) {
          return badRequest(`SVG contains unsafe content: ${entry.name}`);
        }
      } else {
        const dims = getDimensions(buffer, kind);
        if (!dims || dims.width < 1 || dims.height < 1) {
          return badRequest(`Could not read image dimensions: ${entry.name}`);
        }
        if (dims.width > MAX_DIMENSION || dims.height > MAX_DIMENSION) {
          return badRequest(
            `Image too large: ${entry.name} (max ${MAX_DIMENSION}x${MAX_DIMENSION}px)`,
          );
        }
      }

      validated.push({ buffer, kind });
    }

    const supabase = getSupabase();

    // Ensure bucket exists (idempotent)
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });

    const urls: string[] = [];

    for (const { buffer, kind } of validated) {
      const { mime, ext } = KIND_INFO[kind];
      // Random name and extension from the detected type, nothing from the client
      const path = `${auth.userId}/${randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: mime, upsert: false });

      if (error) {
        console.error("Upload error:", error);
        return Response.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }

    return Response.json({ urls });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
