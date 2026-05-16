import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

const frame = 80;
const frames = 11;
const width = frame * frames;
const height = frame;
const pixels = Buffer.alloc(width * height * 4);

const c = {
  outline: [10, 10, 14, 255],
  black: [20, 20, 28, 255],
  shade: [34, 34, 45, 255],
  soft: [45, 45, 58, 255],
  eye: [141, 255, 135, 255],
  nose: [55, 38, 45, 255],
  shadow: [0, 0, 0, 42],
};

function px(x, y, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const index = (y * width + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function rect(i, x, y, w, h, color) {
  const ox = i * frame;
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      px(ox + xx, yy, color);
    }
  }
}

function shadow(i, y = 69, x = 18, w = 44) {
  rect(i, x, y, w, 4, c.shadow);
  rect(i, x + 5, y - 2, w - 10, 3, c.shadow);
}

function frontCat(i, { blink = false, sleepy = false, tail = 0 } = {}) {
  shadow(i);

  rect(i, 58, 38 + tail, 5, 5, c.outline);
  rect(i, 63, 34 + tail, 5, 5, c.outline);
  rect(i, 66, 29 + tail, 5, 5, c.black);
  rect(i, 64, 24 + tail, 5, 5, c.black);
  rect(i, 58, 20 + tail, 7, 5, c.black);
  rect(i, 59, 22 + tail, 4, 3, c.soft);

  rect(i, 25, 37, 30, 5, c.outline);
  rect(i, 20, 42, 40, 18, c.outline);
  rect(i, 25, 60, 30, 5, c.outline);
  rect(i, 26, 43, 28, 17, c.black);
  rect(i, 31, 43, 20, 15, c.shade);
  rect(i, 22, 62, 10, 5, c.outline);
  rect(i, 48, 62, 10, 5, c.outline);
  rect(i, 25, 62, 7, 3, c.soft);
  rect(i, 48, 62, 7, 3, c.soft);

  rect(i, 20, 22, 6, 6, c.outline);
  rect(i, 26, 16, 6, 6, c.black);
  rect(i, 32, 22, 6, 6, c.black);
  rect(i, 46, 22, 6, 6, c.black);
  rect(i, 52, 16, 6, 6, c.black);
  rect(i, 58, 22, 6, 6, c.outline);
  rect(i, 25, 27, 34, 5, c.outline);
  rect(i, 20, 32, 44, 20, c.outline);
  rect(i, 25, 52, 34, 5, c.outline);
  rect(i, 26, 33, 32, 18, c.black);
  rect(i, 31, 33, 22, 16, c.shade);
  rect(i, 26, 23, 4, 4, c.soft);
  rect(i, 54, 23, 4, 4, c.soft);

  if (blink || sleepy) {
    rect(i, 29, 42, 7, 2, c.eye);
    rect(i, 48, 42, 7, 2, c.eye);
  } else {
    rect(i, 29, 39, 6, 6, c.eye);
    rect(i, 49, 39, 6, 6, c.eye);
    rect(i, 32, 39, 2, 2, c.soft);
    rect(i, 52, 39, 2, 2, c.soft);
  }

  rect(i, 39, 48, 5, 4, c.nose);
  rect(i, 34, 53, 4, 2, c.outline);
  rect(i, 46, 53, 4, 2, c.outline);
}

function sideCat(i, pose) {
  const run = pose.startsWith("run");
  const bob = pose === "run-b" ? -2 : pose === "run-c" ? 1 : 0;
  const stretch = pose === "run-a";
  shadow(i, run ? 70 : 69, 14, run ? 52 : 48);

  rect(i, 14, 50 + bob, 11, 5, c.outline);
  rect(i, 9, 45 + bob, 10, 5, c.outline);
  rect(i, 6, 40 + bob, 8, 5, c.black);
  rect(i, 10, 35 + bob, 8, 5, c.black);
  rect(i, 11, 36 + bob, 5, 3, c.soft);

  rect(i, stretch ? 22 : 23, 42 + bob, stretch ? 36 : 32, 5, c.outline);
  rect(i, 17, 47 + bob, stretch ? 47 : 43, 11, c.outline);
  rect(i, 22, 58 + bob, stretch ? 34 : 31, 5, c.outline);
  rect(i, 25, 48 + bob, 27, 9, c.black);
  rect(i, 30, 48 + bob, 18, 8, c.shade);

  rect(i, 54, 30 + bob, 5, 5, c.black);
  rect(i, 59, 25 + bob, 5, 5, c.black);
  rect(i, 64, 30 + bob, 5, 5, c.outline);
  rect(i, 48, 35 + bob, 22, 5, c.outline);
  rect(i, 46, 40 + bob, 27, 16, c.outline);
  rect(i, 51, 56 + bob, 17, 5, c.outline);
  rect(i, 51, 41 + bob, 19, 13, c.black);
  rect(i, 55, 41 + bob, 13, 11, c.shade);
  rect(i, 64, 45 + bob, 5, 5, c.eye);
  rect(i, 71, 49 + bob, 3, 3, c.nose);

  if (pose === "walk-a") {
    rect(i, 23, 62, 11, 5, c.outline);
    rect(i, 49, 62, 11, 5, c.outline);
    rect(i, 34, 66, 11, 4, c.black);
    rect(i, 57, 66, 11, 4, c.black);
  } else if (pose === "walk-b") {
    rect(i, 21, 66, 12, 4, c.outline);
    rect(i, 51, 66, 12, 4, c.outline);
    rect(i, 35, 62, 10, 5, c.black);
    rect(i, 56, 62, 10, 5, c.black);
  } else if (pose === "run-a") {
    rect(i, 20, 66, 15, 4, c.outline);
    rect(i, 50, 62, 14, 5, c.outline);
    rect(i, 34, 62, 14, 5, c.black);
    rect(i, 59, 68, 12, 3, c.black);
  } else if (pose === "run-b") {
    rect(i, 25, 62, 11, 5, c.outline);
    rect(i, 47, 66, 15, 4, c.outline);
    rect(i, 37, 68, 10, 3, c.black);
    rect(i, 58, 62, 12, 5, c.black);
  } else {
    rect(i, 26, 65, 9, 4, c.outline);
    rect(i, 47, 65, 9, 4, c.outline);
    rect(i, 36, 65, 9, 4, c.black);
    rect(i, 57, 65, 9, 4, c.black);
  }
}

function caughtCat(i) {
  shadow(i, 70);
  rect(i, 18, 45, 43, 17, c.outline);
  rect(i, 24, 49, 31, 11, c.shade);
  rect(i, 22, 62, 34, 5, c.outline);
  rect(i, 18, 36, 5, 5, c.outline);
  rect(i, 23, 31, 6, 5, c.black);
  rect(i, 29, 36, 6, 5, c.black);
  rect(i, 45, 36, 6, 5, c.black);
  rect(i, 51, 31, 6, 5, c.black);
  rect(i, 57, 36, 5, 5, c.outline);
  rect(i, 21, 41, 40, 15, c.outline);
  rect(i, 27, 42, 28, 11, c.shade);
  rect(i, 29, 48, 7, 2, c.eye);
  rect(i, 47, 48, 7, 2, c.eye);
  rect(i, 39, 53, 5, 3, c.nose);
}

function sleepCat(i, { breath = 0 } = {}) {
  shadow(i, 72);

  rect(i, 18, 50 + breath, 44, 5, c.outline);
  rect(i, 14, 55 + breath, 52, 10, c.outline);
  rect(i, 19, 65 + breath, 42, 5, c.outline);
  rect(i, 24, 56 + breath, 32, 8, c.shade);
  rect(i, 60, 57 + breath, 8, 5, c.outline);
  rect(i, 66, 52 + breath, 5, 5, c.black);

  rect(i, 20, 35 + breath, 6, 6, c.outline);
  rect(i, 26, 29 + breath, 6, 6, c.black);
  rect(i, 32, 35 + breath, 6, 6, c.black);
  rect(i, 46, 35 + breath, 6, 6, c.black);
  rect(i, 52, 29 + breath, 6, 6, c.black);
  rect(i, 58, 35 + breath, 6, 6, c.outline);
  rect(i, 25, 40 + breath, 34, 5, c.outline);
  rect(i, 20, 45 + breath, 44, 16, c.outline);
  rect(i, 25, 61 + breath, 34, 5, c.outline);
  rect(i, 26, 46 + breath, 32, 13, c.black);
  rect(i, 31, 46 + breath, 22, 11, c.shade);
  rect(i, 29, 53 + breath, 7, 2, c.eye);
  rect(i, 48, 53 + breath, 7, 2, c.eye);
  rect(i, 39, 56 + breath, 5, 3, c.nose);
  rect(i, 25, 64 + breath, 16, 4, c.outline);
  rect(i, 43, 64 + breath, 16, 4, c.outline);
  rect(i, 31, 62 + breath, 9, 3, c.black);
  rect(i, 43, 62 + breath, 9, 3, c.black);
}

frontCat(0, { tail: 0 });
frontCat(1, { tail: 1 });
frontCat(2, { blink: true });
sideCat(3, "walk-a");
sideCat(4, "walk-b");
sideCat(5, "run-a");
sideCat(6, "run-b");
sideCat(7, "run-c");
caughtCat(8);
sleepCat(9, { breath: 0 });
sleepCat(10, { breath: 1 });

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

const scanlines = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y += 1) {
  const rowStart = y * (width * 4 + 1);
  scanlines[rowStart] = 0;
  pixels.copy(scanlines, rowStart + 1, y * width * 4, (y + 1) * width * 4);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(width, 0);
header.writeUInt32BE(height, 4);
header[8] = 8;
header[9] = 6;
header[10] = 0;
header[11] = 0;
header[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(scanlines)),
  chunk("IEND", Buffer.alloc(0)),
]);

const output = "assets/cat-spritesheet.png";
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, png);
console.log(`Created ${output} (${width}x${height})`);
