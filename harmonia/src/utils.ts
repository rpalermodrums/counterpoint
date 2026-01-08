import { Fraction } from "./fraction";
import type { Note, ModeDefinition, SpeciesValue, ModeName } from "./types";
import { createNote, Interval, Mode, Species } from "./types";

export function calculateInterval(pitch1: number, pitch2: number): number {
  return Math.abs(pitch1 - pitch2) % 12;
}

const PERFECT_CONSONANCES = [Interval.UNISON, Interval.PERFECT_FIFTH, Interval.OCTAVE] as const;
const IMPERFECT_CONSONANCES = [Interval.MINOR_THIRD, Interval.MAJOR_THIRD, Interval.MINOR_SIXTH, Interval.MAJOR_SIXTH] as const;
const SUSPENSION_PREPARATIONS = [Interval.MINOR_THIRD, Interval.MAJOR_THIRD, Interval.PERFECT_FOURTH, Interval.PERFECT_FIFTH, Interval.MINOR_SIXTH, Interval.MAJOR_SIXTH] as const;
const SUSPENSIONS = [Interval.MINOR_SECOND, Interval.MAJOR_SECOND, Interval.PERFECT_FOURTH, Interval.TRITONE] as const;
const SUSPENSION_RESOLUTIONS = [Interval.MINOR_THIRD, Interval.MAJOR_THIRD, Interval.PERFECT_FIFTH, Interval.MINOR_SIXTH, Interval.MAJOR_SIXTH] as const;

export function isPerfectConsonance(interval: number): boolean {
  return (PERFECT_CONSONANCES as readonly number[]).includes(interval);
}

export function isImperfectConsonance(interval: number): boolean {
  return (IMPERFECT_CONSONANCES as readonly number[]).includes(interval);
}

export function isConsonant(interval: number): boolean {
  return isPerfectConsonance(interval) || isImperfectConsonance(interval);
}

export function isDissonant(interval: number): boolean {
  return !isConsonant(interval);
}

export function isPassingTone(prevPitch: number, currPitch: number, nextPitch: number): boolean {
  return (prevPitch < currPitch && currPitch < nextPitch) || (prevPitch > currPitch && currPitch > nextPitch);
}

export function checkParallelMotion(prevCp: number, currCp: number, prevCf: number, currCf: number): boolean {
  const prevInterval = calculateInterval(prevCp, prevCf);
  const currInterval = calculateInterval(currCp, currCf);
  return isPerfectConsonance(prevInterval) && isPerfectConsonance(currInterval) && (currCp - prevCp) * (currCf - prevCf) > 0;
}

export function checkContraryMotion(prevCp: number, currCp: number, prevCf: number, currCf: number): boolean {
  return (currCp - prevCp) * (currCf - prevCf) < 0;
}

export function isValidSuspensionPreparation(interval: number): boolean {
  return (SUSPENSION_PREPARATIONS as readonly number[]).includes(interval);
}

export function isValidSuspension(interval: number): boolean {
  return (SUSPENSIONS as readonly number[]).includes(interval);
}

export function isValidSuspensionResolution(interval: number): boolean {
  return (SUSPENSION_RESOLUTIONS as readonly number[]).includes(interval);
}

export function isDownwardResolution(prevPitch: number, currPitch: number): boolean {
  return currPitch < prevPitch;
}

export function isStrongBeat(position: Fraction): boolean {
  return position.numerator % position.denominator === 0;
}

export function calculatePitchRange(notes: readonly Note[]): number {
  if (notes.length === 0) return 0;
  const pitches = notes.map((n) => n.pitch);
  return Math.max(...pitches) - Math.min(...pitches);
}

export function countStepwiseMotion(notes: readonly Note[]): number {
  let count = 0;
  for (let i = 1; i < notes.length; i++) {
    const curr = notes[i];
    const prev = notes[i - 1];
    if (curr && prev && [1, 2].includes(Math.abs(curr.pitch - prev.pitch))) count++;
  }
  return count;
}

export function countLeaps(notes: readonly Note[]): number {
  let count = 0;
  for (let i = 1; i < notes.length; i++) {
    const curr = notes[i];
    const prev = notes[i - 1];
    if (curr && prev && Math.abs(curr.pitch - prev.pitch) >= 4) count++;
  }
  return count;
}

export function countRepeatedNotes(notes: readonly Note[]): number {
  let count = 0;
  for (let i = 1; i < notes.length; i++) {
    const curr = notes[i];
    const prev = notes[i - 1];
    if (curr && prev && curr.pitch === prev.pitch) count++;
  }
  return count;
}

export function calculateTotalDuration(notes: readonly Note[]): Fraction {
  return notes.reduce((sum, n) => sum.add(n.duration), Fraction.ZERO);
}

export function isInMode(pitch: number, tonic: number, mode: ModeDefinition): boolean {
  return mode.intervals.includes((pitch - tonic + 120) % 12);
}

export function generatePossibleNotes(cfNote: Note, species: SpeciesValue, mode: ModeDefinition): Note[] {
  const possiblePitches: number[] = [];
  for (let p = cfNote.pitch - 12; p <= cfNote.pitch + 13; p++) {
    if (isInMode(p, cfNote.pitch, mode)) {
      possiblePitches.push(p);
    }
  }

  let duration: Fraction;
  switch (species) {
    case Species.FIRST:
      duration = cfNote.duration;
      break;
    case Species.SECOND:
      duration = cfNote.duration.divide(Fraction.from(2));
      break;
    case Species.THIRD:
      duration = cfNote.duration.divide(Fraction.from(4));
      break;
    case Species.FOURTH:
      duration = cfNote.duration;
      break;
    case Species.FIFTH:
      duration = cfNote.duration;
      break;
    default:
      duration = cfNote.duration;
  }

  return possiblePitches.map((pitch) => createNote(pitch, duration, cfNote.position));
}

export function pitchToNoteName(pitch: number): string {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(pitch / 12) - 1;
  const noteName = noteNames[pitch % 12] ?? "C";
  return `${noteName}${octave}`;
}

export function noteNameToPitch(name: string): number {
  const match = name.match(/^([A-G]#?)(\d+)$/i);
  if (!match || !match[1] || !match[2]) throw new Error(`Invalid note name: ${name}`);
  const noteNames: Record<string, number> = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
  const note = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  return (octave + 1) * 12 + (noteNames[note] ?? 0);
}
