from typing import List, Tuple
from counterpoint_utils import Note, Voice, Species, Mode, calculate_interval, is_consonant, is_perfect_consonance, is_passing_tone, check_parallel_motion, is_valid_suspension_preparation, is_valid_suspension, is_valid_suspension_resolution, is_downward_resolution, is_strong_beat

def check_first_species_rules(counterpoint: List[Note], cantus_firmus: List[Note]) -> Tuple[bool, List[str]]:
    errors = []
    if len(counterpoint) != len(cantus_firmus):
        errors.append("Counterpoint should have the same number of notes as the cantus firmus")
    
    for i, (cp_note, cf_note) in enumerate(zip(counterpoint, cantus_firmus)):
        if cp_note.duration != cf_note.duration:
            errors.append(f"Note duration mismatch at position {i}")
        
        interval = calculate_interval(cp_note.pitch, cf_note.pitch)
        if not is_consonant(interval):
            errors.append(f"Dissonant interval ({interval}) at position {i}")

        if i > 0:
            if check_parallel_motion(counterpoint[i-1].pitch, cp_note.pitch,
                                     cantus_firmus[i-1].pitch, cf_note.pitch):
                errors.append(f"Parallel perfect consonance at position {i}")

    # Check beginning and ending
    if not is_perfect_consonance(calculate_interval(counterpoint[0].pitch, cantus_firmus[0].pitch)):
        errors.append("Counterpoint should begin with a perfect consonance")
    if not is_perfect_consonance(calculate_interval(counterpoint[-1].pitch, cantus_firmus[-1].pitch)):
        errors.append("Counterpoint should end with a perfect consonance")

    # Check penultimate measure
    if len(counterpoint) > 1:
        penultimate_interval = calculate_interval(counterpoint[-2].pitch, cantus_firmus[-2].pitch)
        if penultimate_interval not in [8, 9]:  # Major sixth or minor third
            errors.append("Penultimate measure should be a major sixth or minor third")

    return len(errors) == 0, errors

def check_second_species_rules(counterpoint: List[Note], cantus_firmus: List[Note]) -> Tuple[bool, List[str]]:
    errors = []
    if len(counterpoint) != 2 * len(cantus_firmus):
        errors.append("Counterpoint should have twice as many notes as the cantus firmus")
    
    for i in range(0, len(counterpoint), 2):
        cp_strong = counterpoint[i]
        cf_note = cantus_firmus[i//2]
        
        # Check strong beat consonance
        strong_interval = calculate_interval(cp_strong.pitch, cf_note.pitch)
        if not is_consonant(strong_interval):
            errors.append(f"Dissonant interval on strong beat at position {i}")
        
        # Check weak beat
        if i + 1 < len(counterpoint):
            cp_weak = counterpoint[i+1]
            weak_interval = calculate_interval(cp_weak.pitch, cf_note.pitch)
            if not is_consonant(weak_interval) and not (weak_interval in [2, 11] and
                    is_passing_tone(cp_strong.pitch, cp_weak.pitch, counterpoint[i+2].pitch if i+2 < len(counterpoint) else cf_note.pitch)):
                errors.append(f"Invalid weak beat interval at position {i+1}")

    # Check beginning and ending
    if not is_perfect_consonance(calculate_interval(counterpoint[0].pitch, cantus_firmus[0].pitch)):
        errors.append("Counterpoint should begin with a perfect consonance")
    if not is_perfect_consonance(calculate_interval(counterpoint[-1].pitch, cantus_firmus[-1].pitch)):
        errors.append("Counterpoint should end with a perfect consonance")

    return len(errors) == 0, errors

def check_third_species_rules(counterpoint: List[Note], cantus_firmus: List[Note]) -> Tuple[bool, List[str]]:
    errors = []
    if len(counterpoint) != 4 * len(cantus_firmus):
        errors.append("Counterpoint should have four times as many notes as the cantus firmus")
    
    for i in range(0, len(counterpoint), 4):
        cf_note = cantus_firmus[i//4]
        
        # Check first quarter note (strong beat)
        strong_interval = calculate_interval(counterpoint[i].pitch, cf_note.pitch)
        if not is_consonant(strong_interval):
            errors.append(f"Dissonant interval on strong beat at position {i}")
        
        # Check second, third, and fourth quarter notes
        for j in range(1, 4):
            if i + j < len(counterpoint):
                interval = calculate_interval(counterpoint[i+j].pitch, cf_note.pitch)
                if not is_consonant(interval):
                    if not (interval in [2, 11] and  # Passing tone check
                            is_passing_tone(counterpoint[i+j-1].pitch, counterpoint[i+j].pitch, 
                                            counterpoint[i+j+1].pitch if i+j+1 < len(counterpoint) else cf_note.pitch)):
                        errors.append(f"Invalid interval at position {i+j}")

    # Check beginning and ending
    if not is_perfect_consonance(calculate_interval(counterpoint[0].pitch, cantus_firmus[0].pitch)):
        errors.append("Counterpoint should begin with a perfect consonance")
    if not is_perfect_consonance(calculate_interval(counterpoint[-1].pitch, cantus_firmus[-1].pitch)):
        errors.append("Counterpoint should end with a perfect consonance")

    return len(errors) == 0, errors

def check_fourth_species_rules(counterpoint: List[Note], cantus_firmus: List[Note]) -> Tuple[bool, List[str]]:
    errors = []
    if len(counterpoint) != 2 * len(cantus_firmus):
        errors.append("Counterpoint should have twice as many notes as the cantus firmus")
    
    for i in range(0, len(counterpoint), 2):
        cf_note = cantus_firmus[i//2]
        
        # Check for suspension
        if i > 0:
            prev_cp = counterpoint[i-1]
            curr_cp = counterpoint[i]
            next_cp = counterpoint[i+1] if i+1 < len(counterpoint) else None
            
            preparation_interval = calculate_interval(prev_cp.pitch, cantus_firmus[(i-1)//2].pitch)
            suspension_interval = calculate_interval(curr_cp.pitch, cf_note.pitch)
            resolution_interval = calculate_interval(next_cp.pitch, cf_note.pitch) if next_cp else None
            
            if not is_valid_suspension_preparation(preparation_interval):
                errors.append(f"Invalid preparation interval at position {i-1}")
            if not is_valid_suspension(suspension_interval):
                errors.append(f"Invalid suspension interval at position {i}")
            if resolution_interval and not is_valid_suspension_resolution(resolution_interval):
                errors.append(f"Invalid resolution interval at position {i+1}")
            
            # Check for downward resolution
            if next_cp and not is_downward_resolution(curr_cp.pitch, next_cp.pitch):
                errors.append(f"Suspension not resolved downward at position {i+1}")

    # Check beginning and ending
    if not is_perfect_consonance(calculate_interval(counterpoint[0].pitch, cantus_firmus[0].pitch)):
        errors.append("Counterpoint should begin with a perfect consonance")
    if not is_perfect_consonance(calculate_interval(counterpoint[-1].pitch, cantus_firmus[-1].pitch)):
        errors.append("Counterpoint should end with a perfect consonance")

    return len(errors) == 0, errors

def check_fifth_species_rules(counterpoint: List[Note], cantus_firmus: List[Note]) -> Tuple[bool, List[str]]:
    errors = []
    
    cf_duration = sum(note.duration for note in cantus_firmus)
    cp_duration = sum(note.duration for note in counterpoint)
    if cp_duration != cf_duration:
        errors.append("Total duration of counterpoint should match the cantus firmus")
    
    current_measure = 0
    for i, cp_note in enumerate(counterpoint):
        while current_measure < len(cantus_firmus) and cantus_firmus[current_measure].position <= cp_note.position:
            current_measure += 1
        cf_note = cantus_firmus[current_measure - 1]
        
        interval = calculate_interval(cp_note.pitch, cf_note.pitch)
        
        # Check for consonance on strong beats
        if is_strong_beat(cp_note.position):
            if not is_consonant(interval):
                errors.append(f"Dissonant interval on strong beat at position {cp_note.position}")
        else:
            # Allow passing tones and neighbor tones on weak beats
            if not is_consonant(interval):
                if i > 0 and i < len(counterpoint) - 1:
                    if not is_passing_tone(counterpoint[i-1].pitch, cp_note.pitch, counterpoint[i+1].pitch):
                        errors.append(f"Invalid dissonance on weak beat at position {cp_note.position}")
        
        # Check for proper handling of suspensions
        if i > 0 and cp_note.position - counterpoint[i-1].position == Fraction(1, 2):
            prev_interval = calculate_interval(counterpoint[i-1].pitch, cf_note.pitch)
            if is_valid_suspension(prev_interval) and is_valid_suspension_resolution(interval) and is_downward_resolution(counterpoint[i-1].pitch, cp_note.pitch):
                # Valid suspension resolution
                pass
            elif not is_consonant(interval):
                errors.append(f"Invalid suspension or dissonance treatment at position {cp_note.position}")

    # Check beginning and ending
    if not is_perfect_consonance(calculate_interval(counterpoint[0].pitch, cantus_firmus[0].pitch)):
        errors.append("Counterpoint should begin with a perfect consonance")
    if not is_perfect_consonance(calculate_interval(counterpoint[-1].pitch, cantus_firmus[-1].pitch)):
        errors.append("Counterpoint should end with a perfect consonance")

    return len(errors) == 0, errors

