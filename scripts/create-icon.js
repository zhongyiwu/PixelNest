import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

const size = 128;
const pixels = Buffer.alloc(size * size * 4);

function setPixel(x, y, color) {
  if (x < 0 || x >= size || y < 0 || y >= size) {
    return;
  }

  const index = (y * size + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function rect(x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      setPixel(xx, yy, color);
    }
  }
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput));

  return Buffer.concat([length, typeBuffer, data, crc]);
}

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

const black = [18, 18, 24, 255];
const shade = [31, 31, 42, 255];
const eye = [141, 255, 135, 255];
const nose = [48, 35, 40, 255];

rect(44, 28, 8, 8, black);
rect(52, 20, 8, 8, black);
rect(60, 28, 8, 8, shade);
rect(76, 28, 8, 8, shade);
rect(84, 20, 8, 8, black);
rect(92, 28, 8, 8, black);
rect(36, 36, 72, 40, black);
rect(44, 44, 56, 32, shade);
rect(48, 56, 8, 8, eye);
rect(80, 56, 8, 8, eye);
rect(64, 68, 8, 8, nose);
rect(40, 76, 64, 20, black);
rect(48, 84, 48, 20, shade);
rect(36, 96, 16, 8, black);
rect(84, 96, 16, 8, black);
rect(96, 68, 8, 8, black);
rect(104, 60, 8, 8, black);
rect(112, 52, 8, 8, black);
rect(112, 44, 8, 8, black);
rect(104, 36, 8, 8, shade);

const scanlines = Buffer.alloc((size * 4 + 1) * size);
for (let y = 0; y < size; y += 1) {
  const rowStart = y * (size * 4 + 1);
  scanlines[rowStart] = 0;
  pixels.copy(scanlines, rowStart + 1, y * size * 4, (y + 1) * size * 4);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0);
header.writeUInt32BE(size, 4);
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

const output = "src-tauri/icons/icon.png";
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, png);
console.log(`Created ${output}`);
