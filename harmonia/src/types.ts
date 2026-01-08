import { Fraction } from "./fraction";

export interface Note {
  readonly pitch: number;
  readonly duration: Fraction;
  readonly position: Fraction;
}

export function createNote(pitch: number, duration: Fraction, position: Fraction): Note {
  return { pitch, duration, position };
}

export function noteToString(note: Note): string {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(note.pitch / 12) - 1;
  const noteName = noteNames[note.pitch % 12];
  return `${noteName}${octave}`;
}

export class Voice {
  private _notes: Note[] = [];

  constructor(notes: Note[] = []) {
    this._notes = [...notes];
  }

  get notes(): readonly Note[] {
    return this._notes;
  }

  get length(): number {
    return this._notes.length;
  }

  append(note: Note): void {
    this._notes.push(note);
  }

  [Symbol.iterator](): Iterator<Note> {
    return this._notes[Symbol.iterator]();
  }
}

export const Interval = {
  UNISON: 0,
  MINOR_SECOND: 1,
  MAJOR_SECOND: 2,
  MINOR_THIRD: 3,
  MAJOR_THIRD: 4,
  PERFECT_FOURTH: 5,
  TRITONE: 6,
  PERFECT_FIFTH: 7,
  MINOR_SIXTH: 8,
  MAJOR_SIXTH: 9,
  MINOR_SEVENTH: 10,
  MAJOR_SEVENTH: 11,
  OCTAVE: 12,
} as const;

export type IntervalValue = (typeof Interval)[keyof typeof Interval];

export interface ModeDefinition {
  readonly intervals: readonly number[];
  readonly degree: number;
  readonly name: string;
}

export const Mode = {
  IONIAN: { intervals: [0, 2, 4, 5, 7, 9, 11], degree: 0, name: "Ionian (Major)" },
  DORIAN: { intervals: [0, 2, 3, 5, 7, 9, 10], degree: 1, name: "Dorian" },
  PHRYGIAN: { intervals: [0, 1, 3, 5, 7, 8, 10], degree: 2, name: "Phrygian" },
  LYDIAN: { intervals: [0, 2, 4, 6, 7, 9, 11], degree: 3, name: "Lydian" },
  MIXOLYDIAN: { intervals: [0, 2, 4, 5, 7, 9, 10], degree: 4, name: "Mixolydian" },
  AEOLIAN: { intervals: [0, 2, 3, 5, 7, 8, 10], degree: 5, name: "Aeolian (Minor)" },
  LOCRIAN: { intervals: [0, 1, 3, 5, 6, 8, 10], degree: 6, name: "Locrian" },
} as const;

export type ModeName = keyof typeof Mode;

export const Species = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
  FIFTH: 5,
} as const;

export type SpeciesValue = (typeof Species)[keyof typeof Species];

export function getSpeciesName(species: SpeciesValue): string {
  const names: Record<SpeciesValue, string> = {
    1: "First Species (1:1)",
    2: "Second Species (2:1)",
    3: "Third Species (4:1)",
    4: "Fourth Species (Suspensions)",
    5: "Fifth Species (Florid)",
  };
  return names[species];
}

export function getSpeciesDescription(species: SpeciesValue): string {
  const descriptions: Record<SpeciesValue, string> = {
    1: "Note against note - all intervals must be consonant",
    2: "Two notes per cantus firmus note - passing tones allowed on weak beats",
    3: "Four notes per cantus firmus note - more elaborate melodic motion",
    4: "Syncopated rhythm with suspensions and resolutions",
    5: "Free counterpoint combining all previous species",
  };
  return descriptions[species];
}

export interface CantusFirmusPreset {
  readonly name: string;
  readonly pitches: readonly number[];
  readonly mode: ModeName;
}

export const CANTUS_FIRMUS_PRESETS: readonly CantusFirmusPreset[] = [
  { name: "Fux Mode I", pitches: [60, 62, 64, 65, 64, 62, 64, 62, 60], mode: "IONIAN" },
  { name: "Simple Ascending", pitches: [60, 62, 64, 65, 67, 65, 64, 62, 60], mode: "IONIAN" },
  { name: "Dorian Melody", pitches: [62, 64, 65, 67, 69, 67, 65, 64, 62], mode: "DORIAN" },
  { name: "Phrygian Descent", pitches: [64, 65, 67, 69, 67, 65, 64, 62, 64], mode: "PHRYGIAN" },
] as const;
