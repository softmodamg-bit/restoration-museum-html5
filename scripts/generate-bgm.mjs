import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const outputPath = path.join(projectDirectory, "assets", "museum-bgm.wav");
const sampleRate = 22050;
const durationSeconds = 32;
const totalSamples = sampleRate * durationSeconds;
const samples = new Float64Array(totalSamples);

const midiToFrequency = midi => 440 * (2 ** ((midi - 69) / 12));

function addTone(midi, start, duration, amplitude, character = "bell") {
  const frequency = midiToFrequency(midi);
  const firstSample = Math.max(0, Math.floor(start * sampleRate));
  const lastSample = Math.min(totalSamples, Math.ceil((start + duration) * sampleRate));

  for (let index = firstSample; index < lastSample; index += 1) {
    const localTime = index / sampleRate - start;
    const normalizedTime = localTime / duration;
    let envelope = 1;
    let wave = 0;

    if (character === "pad") {
      envelope = Math.min(1, localTime / .75, (duration - localTime) / .9);
      wave = Math.sin(Math.PI * 2 * frequency * localTime)
        + .22 * Math.sin(Math.PI * 2 * frequency * 2 * localTime)
        + .08 * Math.sin(Math.PI * 2 * frequency * .5 * localTime);
    } else if (character === "bass") {
      envelope = Math.min(1, localTime / .16) * Math.max(0, 1 - normalizedTime) ** .45;
      wave = Math.sin(Math.PI * 2 * frequency * localTime)
        + .16 * Math.sin(Math.PI * 2 * frequency * 2 * localTime);
    } else {
      envelope = Math.min(1, localTime / .025) * Math.exp(-3.7 * normalizedTime);
      wave = Math.sin(Math.PI * 2 * frequency * localTime)
        + .32 * Math.sin(Math.PI * 2 * frequency * 2 * localTime)
        + .12 * Math.sin(Math.PI * 2 * frequency * 3 * localTime);
    }

    samples[index] += wave * envelope * amplitude;
  }
}

const chords = [
  [55, 59, 62],
  [52, 55, 59],
  [48, 52, 55],
  [50, 54, 57]
];
const melody = [
  67, 69, 71, 74, 71, 69, 67, 64,
  64, 67, 69, 71, 69, 67, 64, 62,
  64, 67, 72, 71, 67, 64, 62, 60,
  62, 66, 69, 74, 69, 66, 62, 59
];

chords.forEach((chord, chordIndex) => {
  const chordStart = chordIndex * 8;
  chord.forEach(note => addTone(note, chordStart, 8.1, .052, "pad"));
  addTone(chord[0] - 12, chordStart, 4.2, .08, "bass");
  addTone(chord[0] - 12, chordStart + 4, 4.1, .075, "bass");

  for (let beat = 0; beat < 16; beat += 1) {
    const note = chord[beat % chord.length] + 12 + (beat % 4 === 3 ? 12 : 0);
    addTone(note, chordStart + beat * .5, .48, .052, "bell");
  }
});

melody.forEach((note, index) => {
  if (index % 4 !== 3) addTone(note, index, .8, .043, "bell");
});

for (let second = 2; second < durationSeconds; second += 4) {
  addTone(79 + ((second / 4) % 3) * 2, second, 1.6, .035, "bell");
}

for (let index = 0; index < totalSamples; index += 1) {
  const time = index / sampleRate;
  const loopFade = Math.min(1, time / .16, (durationSeconds - time) / .16);
  samples[index] *= Math.max(0, loopFade);
}

let peak = 0;
for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
const normalization = peak ? .82 / peak : 1;
const dataSize = totalSamples * 2;
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

for (let index = 0; index < totalSamples; index += 1) {
  const value = Math.max(-1, Math.min(1, samples[index] * normalization));
  buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, buffer);
console.log(`Generated ${outputPath} (${buffer.length} bytes, ${durationSeconds}s mono WAV)`);
