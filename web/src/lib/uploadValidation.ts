export type ImageKind = "png" | "jpeg" | "webp" | "svg";

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_FILES = 10;
export const MAX_DIMENSION = 4096; // px, per side

export const KIND_INFO: Record<ImageKind, { mime: string; ext: string }> = {
  png: { mime: "image/png", ext: "png" },
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  webp: { mime: "image/webp", ext: "webp" },
  svg: { mime: "image/svg+xml", ext: "svg" },
};

export const ALLOWED_MIME_TYPES = Object.values(KIND_INFO).map((k) => k.mime);

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Detects the real file type from its leading bytes. Never trusts file.type or file.name. */
export function detectKind(buf: Buffer): ImageKind | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE)) return "png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  const text = buf.toString("utf8").replace(/^\uFEFF/, "").trimStart();
  if (/^(<\?xml[\s\S]*?\?>\s*)?<svg[\s>]/i.test(text)) return "svg";
  return null;
}

/** Reads width/height from the file header. Returns null if it cannot be parsed. */
export function getDimensions(
  buf: Buffer,
  kind: Exclude<ImageKind, "svg">,
): { width: number; height: number } | null {
  try {
    if (kind === "png") {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (kind === "webp") {
      const chunk = buf.toString("ascii", 12, 16);
      if (chunk === "VP8 ") {
        return {
          width: buf.readUInt16LE(26) & 0x3fff,
          height: buf.readUInt16LE(28) & 0x3fff,
        };
      }
      if (chunk === "VP8L") {
        const bits = buf.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
      }
      if (chunk === "VP8X") {
        return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
      }
      return null;
    }
    // jpeg: walk the marker segments until a start-of-frame marker
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xff) {
        i++;
        continue;
      }
      const isSof =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
  } catch {
    return null;
  }
}

// Strict deny-list for SVG. Anything that can run script, load external
// resources, or hide a payload is rejected instead of cleaned.
const UNSAFE_SVG_PATTERNS: RegExp[] = [
  /<!/, // DOCTYPE, ENTITY, CDATA, comments
  /<\?(?!xml[\s?])/i, // processing instructions other than the xml declaration
  /&#/, // numeric character references can hide payloads
  /<\s*([\w.-]+:)?(script|foreignObject|iframe|embed|object|audio|video|animate\w*|set|style|link|meta|image|a)\b/i, // incl. namespace-prefixed (<x:script>)
  /[\s/"']on\w+\s*=/i, // inline event handlers
  /javascript\s*:/i,
  /data\s*:/i,
  /href\s*=\s*["']\s*(?!#)/i, // only same-document references are allowed
  /url\s*\(\s*["']?\s*(?!#)/i,
  /@import/i,
];

export function isSafeSvg(text: string): boolean {
  return !UNSAFE_SVG_PATTERNS.some((pattern) => pattern.test(text));
}
