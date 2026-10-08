// Draws the app's icon, its Android layers, the mark of the launch screen and the favicon of the
// browser view, into assets/images/. The picture is the portal's own mark (a zero line and a move
// to its right: components/marks.tsx, Logo), in the portal's ink on the portal's page.
//
//   node scripts/draw-icons.mjs        (or `make icons`)
//
// Nothing is installed for it: the shapes are three strokes, so each pixel is coloured by how far
// it is from them, and the PNG is written by hand.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "images");
const PAGE = [0x0b, 0x0c, 0x0d]; // lib/theme.ts: color.page
const INK = [0xf2, 0xf0, 0xea]; // color.inkStrong
const WHITE = [0xff, 0xff, 0xff];

// The mark on its own 20 by 20 grid: two round-ended strokes, 2 wide, and a dot.
const STROKES = [[4, 2, 4, 18], [4, 10, 12, 10]];
const DOT = { x: 14.5, y: 10, r: 2.75 };
const BOX = { x: 10.125, y: 10, height: 18 }; // the middle of what is drawn, and how tall it is

// How far a point of the grid is from the mark: negative inside it.
function distance(x, y) {
  let d = Math.hypot(x - DOT.x, y - DOT.y) - DOT.r;
  for (const [x1, y1, x2, y2] of STROKES) {
    const along = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2)));
    d = Math.min(d, Math.hypot(x - x1 - along * (x2 - x1), y - y1 - along * (y2 - y1)) - 1);
  }
  return d;
}

// A square picture: the mark in `ink`, `tall` of the side high, over `ground` (or over nothing).
function draw(side, tall, ink, ground) {
  const unit = (tall * side) / BOX.height; // pixels per step of the grid
  const rows = Buffer.alloc(side * (side * 4 + 1)); // each row starts with its filter: none
  for (let py = 0; py < side; py++) {
    for (let px = 0; px < side; px++) {
      const d = distance(BOX.x + (px + 0.5 - side / 2) / unit, BOX.y + (py + 0.5 - side / 2) / unit) * unit;
      const cover = Math.max(0, Math.min(1, 0.5 - d)); // the edge fades over one pixel
      const at = py * (side * 4 + 1) + 1 + px * 4;
      for (let c = 0; c < 3; c++) rows[at + c] = ground ? Math.round(ground[c] + (ink[c] - ground[c]) * cover) : ink[c];
      rows[at + 3] = ground ? 255 : Math.round(cover * 255);
    }
  }
  return png(side, rows);
}

const CRC = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  let crc = 0xffffffff;
  for (const byte of body) crc = CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, body.length + 4);
  return out;
}

function png(side, rows) {
  const head = Buffer.alloc(13);
  head.writeUInt32BE(side, 0);
  head.writeUInt32BE(side, 4);
  head.set([8, 6, 0, 0, 0], 8); // 8 bits a channel, red green blue and alpha
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", head),
    chunk("IDAT", deflateSync(rows, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const PICTURES = {
  // The icon of the iPhone app, and of an Android too old for layers: square, with no clear pixel.
  "icon.png": draw(1024, 0.46, INK, PAGE),
  // Android cuts its icon to the shape the phone likes and may move the layers apart: the mark
  // stays inside the middle that every shape keeps.
  "android-icon-foreground.png": draw(1024, 0.34, INK, null),
  "android-icon-background.png": draw(1024, 0, PAGE, PAGE),
  // The icon in one colour, for a phone that tints its icons: only its shape is used.
  "android-icon-monochrome.png": draw(432, 0.34, WHITE, null),
  // The mark alone, shown on the page's colour while the app starts (app.json sets how wide).
  "splash-icon.png": draw(1024, 0.9, INK, null),
  "favicon.png": draw(48, 0.62, INK, PAGE),
};

mkdirSync(OUT, { recursive: true });
for (const [name, picture] of Object.entries(PICTURES)) {
  writeFileSync(join(OUT, name), picture);
  console.log(`${name}  ${(picture.length / 1024).toFixed(1)} KB`);
}
