import type { Note } from "./types";

export function generateMidiFile(cantusFirmus: readonly Note[], counterpoint: readonly Note[], tempo: number = 120): Uint8Array {
  const ticksPerBeat = 480;

  const chunks: number[][] = [];

  chunks.push(createMidiHeader(2, ticksPerBeat));
  chunks.push(createTrack(cantusFirmus, 0, ticksPerBeat));
  chunks.push(createTrack(counterpoint, 1, ticksPerBeat));

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function createMidiHeader(numTracks: number, ticksPerBeat: number): number[] {
  return [
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x01,
    (numTracks >> 8) & 0xff, numTracks & 0xff,
    (ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff,
  ];
}

function createTrack(notes: readonly Note[], channel: number, ticksPerBeat: number): number[] {
  const events: number[] = [];

  let currentTick = 0;
  for (const note of notes) {
    const noteTick = Math.round(note.position.toNumber() * ticksPerBeat);
    const deltaTime = noteTick - currentTick;

    events.push(...encodeVariableLength(deltaTime));
    events.push(0x90 | channel, note.pitch, 100);

    const noteDuration = Math.round(note.duration.toNumber() * ticksPerBeat);
    events.push(...encodeVariableLength(noteDuration));
    events.push(0x80 | channel, note.pitch, 0);

    currentTick = noteTick + noteDuration;
  }

  events.push(0x00, 0xff, 0x2f, 0x00);

  const trackLength = events.length;
  return [
    0x4d, 0x54, 0x72, 0x6b,
    (trackLength >> 24) & 0xff,
    (trackLength >> 16) & 0xff,
    (trackLength >> 8) & 0xff,
    trackLength & 0xff,
    ...events,
  ];
}

function encodeVariableLength(value: number): number[] {
  if (value < 0) value = 0;

  const bytes: number[] = [];
  bytes.push(value & 0x7f);

  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }

  return bytes;
}

export function saveMidiFile(data: Uint8Array, filename: string): void {
  Bun.write(filename, data);
}

export async function exportToMidi(cantusFirmus: readonly Note[], counterpoint: readonly Note[], filename: string = "counterpoint.mid", tempo: number = 120): Promise<string> {
  const midiData = generateMidiFile(cantusFirmus, counterpoint, tempo);
  await Bun.write(filename, midiData);
  return filename;
}
