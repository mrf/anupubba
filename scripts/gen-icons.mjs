// Generates the PWA icon set into public/ with no image dependencies:
// a bodhi leaf with its long drip tip, sage ink on paper, encoded as PNG
// by hand. Same technique as the eight-winds icon script.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const PAPER = [246, 243, 236];
const INK = [85, 100, 63];

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

/** @param {Uint8Array} bytes */
function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * @param {string} type
 * @param {Uint8Array} data
 */
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  const typed = new Uint8Array(4 + data.length);
  for (let i = 0; i < 4; i++) {
    typed[i] = type.charCodeAt(i);
  }
  typed.set(data, 4);
  out.set(typed, 4);
  view.setUint32(8 + data.length, crc32(typed));
  return out;
}

/**
 * @param {number} size
 * @param {Uint8Array} rgb  size*size*3 bytes
 */
function encodePng(size, rgb) {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, size);
  view.setUint32(4, size);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor
  const raw = new Uint8Array(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw.set(rgb.subarray(y * size * 3, (y + 1) * size * 3), y * (size * 3 + 1) + 1);
  }
  return Buffer.concat([
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

/**
 * Bodhi-leaf outline: the classic heart curve, tip stretched into the
 * leaf's long drip tip, in unit coordinates (y grows downward).
 */
function leafVertices() {
  const points = [];
  for (let k = 0; k < 720; k++) {
    const t = (k / 720) * 2 * Math.PI;
    const x = 16 * Math.sin(t) ** 3;
    const heartY = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const y = heartY < 0 ? -heartY * 1.55 : -heartY;
    points.push([x, y]);
  }
  return points;
}

/**
 * @param {[number, number][]} unitPoints
 * @param {number} cx @param {number} cy @param {number} scale
 * @returns {[number, number][]}
 */
function placed(unitPoints, cx, cy, scale) {
  return unitPoints.map(([x, y]) => [cx + x * scale, cy + y * scale]);
}

/**
 * Even-odd point-in-polygon test.
 * @param {[number, number][]} poly @param {number} x @param {number} y
 */
function inPolygon(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** @param {number} size */
function drawIcon(size) {
  const c = size / 2;
  // Leaf extents: x ±16, y from -12 (lobes) to +26 (tip); fit inside the ring.
  const scale = (size * 0.55) / 40;
  const leaf = placed(leafVertices(), c, c - size * 0.06, scale);
  const stemHalf = size * 0.008;
  const stemTop = c - size * 0.06 - 16 * scale;
  const stemBottom = c - size * 0.06 - 4 * scale;
  const ringR = size * 0.42;
  const ringW = size * 0.012;
  const rgb = new Uint8Array(size * size * 3);
  const samples = [-1 / 3, 0, 1 / 3];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hit = 0;
      for (const dy of samples) {
        for (const dx of samples) {
          const px = x + 0.5 + dx;
          const py = y + 0.5 + dy;
          const d = Math.hypot(px - c, py - c);
          const inStem =
            Math.abs(px - c) < stemHalf && py >= stemTop && py <= stemBottom;
          if (inPolygon(leaf, px, py) || inStem || Math.abs(d - ringR) < ringW) {
            hit++;
          }
        }
      }
      const t = hit / 9;
      const i = (y * size + x) * 3;
      for (let ch = 0; ch < 3; ch++) {
        rgb[i + ch] = Math.round((PAPER[ch] ?? 0) * (1 - t) + (INK[ch] ?? 0) * t);
      }
    }
  }
  return encodePng(size, rgb);
}

function iconSvg() {
  const path = leafVertices()
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${(256 + x * 7).toFixed(1)},${(226 + y * 7).toFixed(1)}`)
    .join(' ');
  const paper = `rgb(${PAPER.join(',')})`;
  const ink = `rgb(${INK.join(',')})`;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
    `  <rect width="512" height="512" fill="${paper}"/>`,
    `  <circle cx="256" cy="256" r="215" fill="none" stroke="${ink}" stroke-width="6"/>`,
    `  <line x1="256" y1="${226 - 16 * 7}" x2="256" y2="${226 - 4 * 7}" stroke="${ink}" stroke-width="8"/>`,
    `  <path d="${path} Z" fill="${ink}"/>`,
    '</svg>',
    '',
  ].join('\n');
}

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, 'icon-192.png'), drawIcon(192));
writeFileSync(join(publicDir, 'icon-512.png'), drawIcon(512));
writeFileSync(join(publicDir, 'apple-touch-icon.png'), drawIcon(180));
writeFileSync(join(publicDir, 'icon.svg'), iconSvg());
console.log('Wrote icon-192.png, icon-512.png, apple-touch-icon.png, icon.svg');
