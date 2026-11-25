// Generator for the Soroban Security Scanner research screenshots.
//
// The dossier references three supporting images. Rather than committing opaque
// binary blobs, this script renders them deterministically from the layout
// description below, so the diagrams are reproducible and reviewable as code.
// Run with: node research/generate-soroban-security-scanner-screenshots.mjs
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, "..", "research");

const WIDTH = 1200;
const HEIGHT = 720;

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, pixelFn) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const BG = [11, 18, 32];
const PANEL = [22, 33, 54];
const BORDER = [56, 78, 116];
const ACCENT = [124, 92, 255];
const ACCENT2 = [0, 200, 180];
const TEXT = [226, 232, 240];

function inRect(x, y, rx, ry, rw, rh) {
  return x >= rx && x < rx + rw && y >= ry && y < ry + rh;
}

function inBorder(x, y, rx, ry, rw, rh, t = 2) {
  const outer = inRect(x, y, rx, ry, rw, rh);
  const inner = inRect(x, y, rx + t, ry + t, rw - 2 * t, rh - 2 * t);
  return outer && !inner;
}

function makeScene({ boxes, connectors, footer }) {
  return (x, y) => {
    const t = y / HEIGHT;
    let colour = [
      Math.round(BG[0] + t * 8),
      Math.round(BG[1] + t * 10),
      Math.round(BG[2] + t * 18),
    ];

    // title bar
    if (inRect(x, y, 0, 0, WIDTH, 64)) colour = [16, 24, 42];
    if (inRect(x, y, 0, 62, WIDTH, 2)) colour = ACCENT;
    if (inRect(x, y, 32, 24, 16, 16)) colour = ACCENT2;
    if (inRect(x, y, 60, 26, 260, 12)) colour = TEXT;

    // connectors first so boxes overlay them
    for (const c of connectors) {
      if (inRect(x, y, c.x, c.y, c.w, c.h)) colour = BORDER;
    }

    for (const b of boxes) {
      if (inRect(x, y, b.x, b.y, b.w, b.h)) colour = PANEL;
      if (inBorder(x, y, b.x, b.y, b.w, b.h)) colour = b.accent ?? BORDER;
      if (inRect(x, y, b.x + 2, b.y + 2, b.w - 4, 34)) colour = b.accent ?? ACCENT;
      for (let i = 0; i < b.lines; i++) {
        const lineY = b.y + 52 + i * 22;
        const lineW = b.w - 40 - (i % 3) * 40;
        if (inRect(x, y, b.x + 20, lineY, lineW, 8)) colour = TEXT;
      }
    }

    // footer
    if (inRect(x, y, 0, HEIGHT - 48, WIDTH, 48)) colour = [16, 24, 42];
    if (inRect(x, y, 0, HEIGHT - 48, WIDTH, 2)) colour = ACCENT2;
    if (inRect(x, y, 32, HEIGHT - 30, footer, 10)) colour = [120, 140, 170];

    return colour;
  };
}

const architecture = makeScene({
  boxes: [
    { x: 60, y: 110, w: 300, h: 150, lines: 3, accent: ACCENT },
    { x: 450, y: 110, w: 300, h: 150, lines: 3, accent: ACCENT2 },
    { x: 840, y: 110, w: 300, h: 150, lines: 3, accent: ACCENT },
    { x: 60, y: 330, w: 300, h: 150, lines: 3, accent: ACCENT2 },
    { x: 450, y: 330, w: 300, h: 150, lines: 3, accent: ACCENT },
    { x: 840, y: 330, w: 300, h: 150, lines: 3, accent: ACCENT2 },
    { x: 250, y: 550, w: 700, h: 110, lines: 2, accent: ACCENT },
  ],
  connectors: [
    { x: 360, y: 180, w: 90, h: 6 },
    { x: 750, y: 180, w: 90, h: 6 },
    { x: 210, y: 260, w: 6, h: 70 },
    { x: 600, y: 260, w: 6, h: 70 },
    { x: 990, y: 260, w: 6, h: 70 },
    { x: 360, y: 400, w: 90, h: 6 },
    { x: 750, y: 400, w: 90, h: 6 },
    { x: 600, y: 480, w: 6, h: 70 },
  ],
  footer: 420,
});

const scanFlow = makeScene({
  boxes: [
    { x: 60, y: 120, w: 240, h: 130, lines: 2, accent: ACCENT },
    { x: 340, y: 120, w: 240, h: 130, lines: 2, accent: ACCENT2 },
    { x: 620, y: 120, w: 240, h: 130, lines: 2, accent: ACCENT },
    { x: 900, y: 120, w: 240, h: 130, lines: 2, accent: ACCENT2 },
    { x: 340, y: 340, w: 240, h: 130, lines: 2, accent: ACCENT2 },
    { x: 620, y: 340, w: 240, h: 130, lines: 2, accent: ACCENT },
    { x: 900, y: 340, w: 240, h: 130, lines: 2, accent: ACCENT2 },
    { x: 340, y: 540, w: 520, h: 110, lines: 2, accent: ACCENT },
  ],
  connectors: [
    { x: 300, y: 180, w: 40, h: 6 },
    { x: 580, y: 180, w: 40, h: 6 },
    { x: 860, y: 180, w: 40, h: 6 },
    { x: 1020, y: 250, w: 6, h: 90 },
    { x: 860, y: 400, w: 40, h: 6 },
    { x: 580, y: 400, w: 40, h: 6 },
    { x: 460, y: 470, w: 6, h: 70 },
  ],
  footer: 380,
});

const onchain = makeScene({
  boxes: [
    { x: 60, y: 110, w: 1080, h: 120, lines: 3, accent: ACCENT2 },
    { x: 60, y: 260, w: 520, h: 200, lines: 5, accent: ACCENT },
    { x: 620, y: 260, w: 520, h: 200, lines: 5, accent: ACCENT2 },
    { x: 60, y: 490, w: 1080, h: 160, lines: 5, accent: ACCENT },
  ],
  connectors: [
    { x: 580, y: 350, w: 40, h: 6 },
    { x: 600, y: 460, w: 6, h: 30 },
  ],
  footer: 460,
});

const files = [
  ["soroban-security-scanner-architecture.png", architecture],
  ["soroban-security-scanner-scan-flow.png", scanFlow],
  ["soroban-security-scanner-onchain-verification.png", onchain],
];

export function generateScreenshots(targetDir = outDir) {
  const written = [];
  for (const [name, scene] of files) {
    const png = encodePng(WIDTH, HEIGHT, scene);
    fs.writeFileSync(path.join(targetDir, name), png);
    written.push({ name, bytes: png.length });
  }
  return written;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (invokedDirectly) {
  for (const { name, bytes } of generateScreenshots()) {
    console.log(`wrote research/${name} (${bytes} bytes)`);
  }
}
