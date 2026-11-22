import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const SIZE = 256
const STRIDE = 1 + SIZE * 4

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c >>> 0
}

function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makePngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

const raw = Buffer.alloc(STRIDE * SIZE)
for (let y = 0; y < SIZE; y++) {
  const row = y * STRIDE
  raw[row] = 0
  for (let x = 0; x < SIZE; x++) {
    const px = row + 1 + x * 4
    const min = 16
    const max = SIZE - 17
    const r = 56
    const dx = Math.max(min + r - x, 0, x - (max - r))
    const dy = Math.max(min + r - y, 0, y - (max - r))
    const inside = x >= min && x <= max && y >= min && y <= max && dx * dx + dy * dy <= r * r
    if (!inside) continue

    const bar1 = x >= 68 && x <= 90 && y >= 100 && y <= 156
    const bar2 = x >= 116 && x <= 140 && y >= 68 && y <= 188
    const bar3 = x >= 166 && x <= 188 && y >= 92 && y <= 164

    if (bar1 || bar2 || bar3) {
      raw[px] = 173
      raw[px + 1] = 198
      raw[px + 2] = 255
      raw[px + 3] = 255
    } else {
      raw[px] = 53
      raw[px + 1] = 75
      raw[px + 2] = 140
      raw[px + 3] = 255
    }
  }
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8
ihdr[9] = 6

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  makePngChunk('IHDR', ihdr),
  makePngChunk('IDAT', zlib.deflateSync(raw)),
  makePngChunk('IEND', Buffer.alloc(0))
])

const icoHeader = Buffer.alloc(22)
icoHeader.writeUInt16LE(0, 0)
icoHeader.writeUInt16LE(1, 2)
icoHeader.writeUInt16LE(1, 4)
icoHeader[6] = 0
icoHeader[7] = 0
icoHeader.writeUInt16LE(1, 10)
icoHeader.writeUInt16LE(32, 12)
icoHeader.writeUInt32LE(png.length, 14)
icoHeader.writeUInt32LE(22, 18)

const outPath = path.join(process.cwd(), 'build', 'icon.ico')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, Buffer.concat([icoHeader, png]))
console.log(`Generated ${outPath} (${22 + png.length} bytes)`)
