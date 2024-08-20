from enum import Enum
from fractions import Fraction
from typing import List, Tuple

class Note:
    def __init__(self, pitch: int, duration: Fraction, position: Fraction):
        self.pitch = pitch
        self.duration = duration
        self.position = position

    def __repr__(self):
        return f"Note(pitch={self.pitch}, duration={self.duration}, position={self.position})"

class Voice:
    def __init__(self, notes: List[Note] = None):
        self.notes = notes or []

    def append(self, note: Note):
        self.notes.append(note)

    def __iter__(self):
        return iter(self.notes)

    def __len__(self):
        return len(self.notes)

class Interval(Enum):
    UNISON = 0
    MINOR_SECOND = 1
    MAJOR_SECOND = 2
    MINOR_THIRD = 3
    MAJOR_THIRD = 4
    PERFECT_FOURTH = 5
    TRITONE = 6
    PERFECT_FIFTH = 7
    MINOR_SIXTH = 8
    MAJOR_SIXTH = 9
    MINOR_SEVENTH = 10
    MAJOR_SEVENTH = 11
    OCTAVE = 12

class Mode(Enum):
    IONIAN = ([0, 2, 4, 5, 7, 9, 11], 0)
    DORIAN = ([0, 2, 3, 5, 7, 9, 10], 1)
    PHRYGIAN = ([0, 1, 3, 5, 7, 8, 10], 2)
    LYDIAN = ([0, 2, 4, 6, 7, 9, 11], 3)
    MIXOLYDIAN = ([0, 2, 4, 5, 7, 9, 10], 4)
    AEOLIAN = ([0, 2, 3, 5, 7, 8, 10], 5)
    LOCRIAN = ([0, 1, 3, 5, 6, 8, 10], 6)

class Species(Enum):
    FIRST = 1
    SECOND = 2
    THIRD = 3
    FOURTH = 4
    FIFTH = 5

def calculate_interval(pitch1: int, pitch2: int) -> int:
    return abs(pitch1 - pitch2) % 12

def is_perfect_consonance(interval: int) -> bool:
    return interval in [Interval.UNISON.value, Interval.PERFECT_FIFTH.value, Interval.OCTAVE.value]

def is_imperfect_consonance(interval: int) -> bool:
    return interval in [Interval.MINOR_THIRD.value, Interval.MAJOR_THIRD.value, 
                        Interval.MINOR_SIXTH.value, Interval.MAJOR_SIXTH.value]

def is_consonant(interval: int) -> bool:
    return is_perfect_consonance(interval) or is_imperfect_consonance(interval)

def is_dissonant(interval: int) -> bool:
    return not is_consonant(interval)

def is_passing_tone(prev_pitch: int, curr_pitch: int, next_pitch: int) -> bool:
    return (prev_pitch < curr_pitch < next_pitch) or (prev_pitch > curr_pitch > next_pitch)

def check_parallel_motion(prev_cp: int, curr_cp: int, prev_cf: int, curr_cf: int) -> bool:
    prev_interval = calculate_interval(prev_cp, prev_cf)
    curr_interval = calculate_interval(curr_cp, curr_cf)
    return (is_perfect_consonance(prev_interval) and is_perfect_consonance(curr_interval) and
            (curr_cp - prev_cp) * (curr_cf - prev_cf) > 0)

def check_contrary_motion(prev_cp: int, curr_cp: int, prev_cf: int, curr_cf: int) -> bool:
    return (curr_cp - prev_cp) * (curr_cf - prev_cf) < 0

def is_valid_suspension_preparation(interval: int) -> bool:
    return interval in [Interval.MINOR_THIRD.value, Interval.MAJOR_THIRD.value, 
                        Interval.PERFECT_FOURTH.value, Interval.PERFECT_FIFTH.value, 
                        Interval.MINOR_SIXTH.value, Interval.MAJOR_SIXTH.value]

def is_valid_suspension(interval: int) -> bool:
    return interval in [Interval.MINOR_SECOND.value, Interval.MAJOR_SECOND.value, 
                        Interval.PERFECT_FOURTH.value, Interval.TRITONE.value]

def is_valid_suspension_resolution(interval: int) -> bool:
    return interval in [Interval.MINOR_THIRD.value, Interval.MAJOR_THIRD.value, 
                        Interval.PERFECT_FIFTH.value, Interval.MINOR_SIXTH.value, Interval.MAJOR_SIXTH.value]

def is_downward_resolution(prev_pitch: int, curr_pitch: int) -> bool:
    return curr_pitch < prev_pitch

def is_strong_beat(position: Fraction) -> bool:
    return position.numerator % position.denominator == 0

def calculate_pitch_range(notes: List[Note]) -> int:
    pitches = [note.pitch for note in notes]
    return max(pitches) - min(pitches)

def count_stepwise_motion(notes: List[Note]) -> int:
    return sum(1 for i in range(1, len(notes)) if abs(notes[i].pitch - notes[i-1].pitch) in [1, 2])

def count_leaps(notes: List[Note]) -> int:
    return sum(1 for i in range(1, len(notes)) if abs(notes[i].pitch - notes[i-1].pitch) >= 4)

def count_repeated_notes(notes: List[Note]) -> int:
    return sum(1 for i in range(1, len(notes)) if notes[i].pitch == notes[i-1].pitch)

def calculate_total_duration(notes: List[Note]) -> Fraction:
    return sum(note.duration for note in notes)

def is_in_mode(pitch: int, tonic: int, mode: Mode) -> bool:
    return (pitch - tonic) % 12 in mode.value[0]

def generate_possible_notes(cf_note: Note, species: Species, mode: Mode) -> List[Note]:
    possible_pitches = [p for p in range(cf_note.pitch - 12, cf_note.pitch + 13)
                        if is_in_mode(p, cf_note.pitch, mode)]
    
    if species == Species.FIRST:
        duration = cf_note.duration
    elif species == Species.SECOND:
        duration = cf_note.duration / 2
    elif species == Species.THIRD:
        duration = cf_note.duration / 4
    elif species == Species.FOURTH:
        duration = cf_note.duration
    else:  # Species.FIFTH (Florid)
        durations = [Fraction(1, 1), Fraction(1, 2), Fraction(1, 4)]
        duration = cf_note.duration  # This will be adjusted in the actual counterpoint generation
    
    return [Note(pitch, duration, cf_note.position) for pitch in possible_pitches]

# CounterpointGraph will be implemented in the main algorithm file
