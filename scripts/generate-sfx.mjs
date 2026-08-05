import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sampleRate = 44100;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const assetDirectory = path.resolve(scriptDirectory, "..", "assets");

const effects = {
  click: {
    duration: .11,
    notes: [[520, 0, .075, .62], [760, .025, .07, .42]]
  },
  hit: {
    duration: .18,
    notes: [[720, 0, .14, .62], [1080, .045, .12, .48]]
  },
  wrong: {
    duration: .28,
    notes: [[190, 0, .24, .7], [142, .08, .18, .48]]
  },
  success: {
    duration: .34,
    notes: [[620, 0, .18, .58], [830, .09, .19, .55], [1040, .18, .15, .48]]
  },
  open: {
    duration: .34,
    notes: [[330, 0, .23, .52], [495, .07, .22, .48], [660, .15, .18, .44]]
  },
  complete: {
    duration: .55,
    notes: [[523.25, 0, .32, .55], [659.25, .08, .34, .55], [783.99, .16, .35, .52], [1046.5, .27, .25, .46]]
  },
  coin: {
    duration: .3,
    notes: [[988, 0, .16, .58], [1318.5, .065, .17, .6], [1760, .13, .14, .48]]
  }
};

function synthesize({ duration, notes }) {
  const sampleCount = Math.ceil(duration * sampleRate);
  const samples = new Float64Array(sampleCount);

  for (const [frequency, start, noteDuration, amplitude] of notes) {
    const firstSample = Math.floor(start * sampleRate);
    const lastSample = Math.min(sampleCount, Math.ceil((start + noteDuration) * sampleRate));
    for (let index = firstSample; index < lastSample; index += 1) {
      const time = index / sampleRate - start;
      const progress = time / noteDuration;
      const attack = Math.min(1, time / .008);
      const release = Math.max(0, 1 - progress) ** 1.8;
      const wave = Math.sin(Math.PI * 2 * frequency * time)
        + .28 * Math.sin(Math.PI * 2 * frequency * 2 * time);
      samples[index] += wave * attack * release * amplitude;
    }
  }

  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const normalization = peak ? .88 / peak : 1;
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index] * normalization));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }
  return buffer;
}

await mkdir(assetDirectory, { recursive: true });
for (const [name, effect] of Object.entries(effects)) {
  const buffer = synthesize(effect);
  await writeFile(path.join(assetDirectory, `sfx-${name}.wav`), buffer);
  console.log(`Generated sfx-${name}.wav (${buffer.length} bytes)`);
}
