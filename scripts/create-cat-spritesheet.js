import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

const frame = 64;
const frames = 11;
const width = frame * frames;
const height = frame;
const pixels = Buffer.alloc(width * height * 4);

const colors = {
  black: [22, 22, 30, 255],
  dark: [14, 14, 18, 255],
  shade: [32, 32, 42, 255],
  eye: [141, 255, 135, 255],
  nose: [47, 34, 39, 255],
  heart: [255, 107, 156, 255],
  shadow: [0, 0, 0, 40],
};

function px(x, y, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const index = (y * width + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function rect(frameIndex, x, y, w, h, color) {
  const offset = frameIndex * frame;
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      px(offset + xx, yy, color);
    }
  }
}

function shadow(i, y = 55) {
  rect(i, 16, y, 34, 3, colors.shadow);
  rect(i, 20, y - 2, 26, 3, colors.shadow);
}

function frontCat(i, options = {}) {
  const blink = Boolean(options.blink);
  const tailOffset = options.tailOffset ?? 0;
  shadow(i);

  rect(i, 49, 30 + tailOffset, 4, 4, colors.dark);
  rect(i, 53, 26 + tailOffset, 4, 4, colors.dark);
  rect(i, 56, 22 + tailOffset, 4, 4, colors.black);
  rect(i, 55, 18 + tailOffset, 4, 4, colors.black);
  rect(i, 51, 15 + tailOffset, 5, 4, colors.black);

  rect(i, 20, 28, 24, 4, colors.black);
  rect(i, 16, 32, 32, 16, colors.black);
  rect(i, 20, 48, 24, 4, colors.black);
  rect(i, 20, 32, 24, 16, colors.shade);
  rect(i, 18, 50, 8, 4, colors.dark);
  rect(i, 38, 50, 8, 4, colors.dark);

  rect(i, 18, 18, 4, 4, colors.dark);
  rect(i, 22, 14, 4, 4, colors.black);
  rect(i, 26, 18, 4, 4, colors.black);
  rect(i, 38, 18, 4, 4, colors.black);
  rect(i, 42, 14, 4, 4, colors.black);
  rect(i, 46, 18, 4, 4, colors.dark);
  rect(i, 20, 22, 28, 4, colors.black);
  rect(i, 16, 26, 36, 16, colors.black);
  rect(i, 20, 42, 28, 4, colors.black);
  rect(i, 20, 26, 28, 16, colors.shade);

  if (blink) {
    rect(i, 24, 34, 4, 1, colors.eye);
    rect(i, 40, 34, 4, 1, colors.eye);
  } else {
    rect(i, 24, 32, 4, 4, colors.eye);
    rect(i, 40, 32, 4, 4, colors.eye);
  }

  rect(i, 32, 38, 4, 4, colors.nose);
  rect(i, 28, 42, 4, 2, colors.dark);
  rect(i, 36, 42, 4, 2, colors.dark);
}

function sideCat(i, pose) {
  const run = pose.startsWith("run");
  const bob = pose === "run-b" ? -2 : pose === "run-c" ? 1 : 0;
  const stretch = pose === "run-a";
  shadow(i, run ? 56 : 55);

  rect(i, 11, 39 + bob, 8, 4, colors.dark);
  rect(i, 7, 35 + bob, 8, 4, colors.dark);
  rect(i, 5, 31 + bob, 6, 4, colors.black);
  rect(i, 8, 27 + bob, 7, 4, colors.black);

  rect(i, stretch ? 17 : 18, 35 + bob, stretch ? 28 : 25, 4, colors.black);
  rect(i, 14, 39 + bob, stretch ? 36 : 33, 8, colors.black);
  rect(i, 18, 47 + bob, stretch ? 26 : 24, 4, colors.black);
  rect(i, 22, 39 + bob, 20, 8, colors.shade);

  rect(i, 43, 27 + bob, 4, 4, colors.black);
  rect(i, 47, 23 + bob, 4, 4, colors.black);
  rect(i, 51, 27 + bob, 4, 4, colors.dark);
  rect(i, 39, 31 + bob, 18, 4, colors.black);
  rect(i, 37, 35 + bob, 22, 12, colors.black);
  rect(i, 41, 47 + bob, 14, 4, colors.black);
  rect(i, 41, 35 + bob, 16, 10, colors.shade);
  rect(i, 51, 38 + bob, 4, 4, colors.eye);
  rect(i, 57, 41 + bob, 3, 3, colors.nose);

  if (pose === "walk-a") {
    rect(i, 19, 50, 8, 4, colors.dark);
    rect(i, 38, 50, 8, 4, colors.dark);
    rect(i, 27, 53, 8, 4, colors.black);
    rect(i, 45, 53, 8, 4, colors.black);
  } else if (pose === "walk-b") {
    rect(i, 17, 53, 9, 4, colors.dark);
    rect(i, 40, 53, 9, 4, colors.dark);
    rect(i, 27, 50, 8, 4, colors.black);
    rect(i, 44, 50, 8, 4, colors.black);
  } else if (pose === "run-a") {
    rect(i, 16, 53, 12, 4, colors.dark);
    rect(i, 39, 50, 11, 4, colors.dark);
    rect(i, 27, 50, 11, 4, colors.black);
    rect(i, 45, 54, 10, 3, colors.black);
  } else if (pose === "run-b") {
    rect(i, 20, 50, 8, 4, colors.dark);
    rect(i, 36, 53, 12, 4, colors.dark);
    rect(i, 29, 54, 8, 3, colors.black);
    rect(i, 44, 50, 10, 4, colors.black);
  } else {
    rect(i, 21, 52, 7, 4, colors.dark);
    rect(i, 37, 52, 7, 4, colors.dark);
    rect(i, 28, 52, 7, 4, colors.black);
    rect(i, 44, 52, 7, 4, colors.black);
  }
}

function caughtCat(i) {
  shadow(i, 57);
  rect(i, 16, 36, 33, 14, colors.black);
  rect(i, 20, 39, 25, 9, colors.shade);
  rect(i, 18, 50, 27, 4, colors.black);
  rect(i, 15, 30, 4, 4, colors.dark);
  rect(i, 19, 26, 5, 4, colors.black);
  rect(i, 24, 30, 5, 4, colors.black);
  rect(i, 37, 30, 5, 4, colors.black);
  rect(i, 42, 26, 5, 4, colors.black);
  rect(i, 47, 30, 4, 4, colors.dark);
  rect(i, 18, 34, 32, 12, colors.black);
  rect(i, 22, 35, 24, 8, colors.shade);
  rect(i, 24, 38, 5, 2, colors.eye);
  rect(i, 39, 38, 5, 2, colors.eye);
  rect(i, 32, 42, 4, 3, colors.nose);
}

function sleepCat(i, options = {}) {
  const breath = options.breath ?? 0;
  shadow(i, 58);

  rect(i, 16, 40 + breath, 34, 4, colors.black);
  rect(i, 12, 44 + breath, 42, 8, colors.black);
  rect(i, 16, 52 + breath, 34, 4, colors.black);
  rect(i, 20, 44 + breath, 26, 7, colors.shade);

  rect(i, 48, 46 + breath, 7, 4, colors.dark);
  rect(i, 53, 42 + breath, 5, 4, colors.dark);
  rect(i, 55, 38 + breath, 4, 4, colors.black);

  rect(i, 18, 27 + breath, 4, 4, colors.dark);
  rect(i, 22, 23 + breath, 4, 4, colors.black);
  rect(i, 26, 27 + breath, 4, 4, colors.black);
  rect(i, 38, 27 + breath, 4, 4, colors.black);
  rect(i, 42, 23 + breath, 4, 4, colors.black);
  rect(i, 46, 27 + breath, 4, 4, colors.dark);
  rect(i, 20, 31 + breath, 28, 4, colors.black);
  rect(i, 16, 35 + breath, 36, 12, colors.black);
  rect(i, 20, 47 + breath, 28, 4, colors.black);
  rect(i, 20, 35 + breath, 28, 11, colors.shade);
  rect(i, 24, 40 + breath, 5, 1, colors.eye);
  rect(i, 39, 40 + breath, 5, 1, colors.eye);
  rect(i, 32, 43 + breath, 4, 3, colors.nose);

  rect(i, 22, 49 + breath, 12, 3, colors.dark);
  rect(i, 34, 49 + breath, 12, 3, colors.dark);
  rect(i, 26, 48 + breath, 8, 2, colors.black);
  rect(i, 34, 48 + breath, 8, 2, colors.black);
}

frontCat(0, { tailOffset: 0 });
frontCat(1, { tailOffset: 1 });
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
