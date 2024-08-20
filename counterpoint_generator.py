import random
from typing import List, Tuple
import networkx as nx
from fractions import Fraction

from counterpoint_utils import Note, Voice, Species, Mode, calculate_interval, is_consonant, generate_possible_notes
from counterpoint_rules import (check_first_species_rules, check_second_species_rules, 
                                check_third_species_rules, check_fourth_species_rules, 
                                check_fifth_species_rules)

class CounterpointGraph:
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_node(self, note_pair: Tuple[Note, Note]):
        self.graph.add_node(note_pair)

    def add_edge(self, from_pair: Tuple[Note, Note], to_pair: Tuple[Note, Note], weight: float):
        self.graph.add_edge(from_pair, to_pair, weight=weight)

    def get_nodes_at_position(self, position: Fraction) -> List[Tuple[Note, Note]]:
        return [node for node in self.graph.nodes if node[0].position == position]

    def get_path_weight(self, path: List[Tuple[Note, Note]]) -> float:
        return sum(self.graph[path[i]][path[i+1]]['weight'] for i in range(len(path)-1))

def generate_counterpoint(cantus_firmus: List[Note], species: Species, mode: Mode, 
                          population_size: int = 100, max_generations: int = 50) -> List[Note]:
    cf_voice = Voice(cantus_firmus)
    cp_graph = initialize_counterpoint_graph(cf_voice, species, mode)
    
    population = generate_initial_population(cp_graph, population_size)
    
    for generation in range(max_generations):
        fitness_scores = [evaluate_fitness(individual, cf_voice, species, mode) for individual in population]
        
        best_individual = max(zip(population, fitness_scores), key=lambda x: x[1])[0]
        print(f"Generation {generation + 1}: Best fitness = {max(fitness_scores):.2f}")
        
        if max(fitness_scores) == 1.0:  # Perfect score achieved
            break
        
        parents = select_parents(population, fitness_scores)
        
        new_population = []
        while len(new_population) < population_size:
            parent1, parent2 = random.choice(parents), random.choice(parents)
            child = crossover(parent1, parent2)
            child = mutate(child, mutation_rate=0.1)
            new_population.append(child)
        
        population = new_population
    
    best_counterpoint = max(population, key=lambda x: evaluate_fitness(x, cf_voice, species, mode))
    optimized_counterpoint = optimize_counterpoint(best_counterpoint, cf_voice, species, mode)
    
    return optimized_counterpoint

def initialize_counterpoint_graph(cf_voice: Voice, species: Species, mode: Mode) -> CounterpointGraph:
    graph = CounterpointGraph()
    cf_notes = cf_voice.notes
    
    for i, cf_note in enumerate(cf_notes):
        possible_cp_notes = generate_possible_notes(cf_note, species, mode)
        for cp_note in possible_cp_notes:
            graph.add_node((cf_note, cp_note))
        
        if i > 0:
            prev_nodes = graph.get_nodes_at_position(cf_notes[i-1].position)
            current_nodes = graph.get_nodes_at_position(cf_note.position)
            for prev_node in prev_nodes:
                for current_node in current_nodes:
                    if is_valid_transition(prev_node, current_node, species, mode):
                        weight = calculate_transition_weight(prev_node, current_node, species, mode)
                        graph.add_edge(prev_node, current_node, weight)
    
    return graph

def is_valid_transition(prev_node: Tuple[Note, Note], current_node: Tuple[Note, Note], 
                        species: Species, mode: Mode) -> bool:
    # Implement basic transition validity checks
    prev_cf, prev_cp = prev_node
    curr_cf, curr_cp = current_node
    
    # Check for valid melodic intervals
    if abs(prev_cp.pitch - curr_cp.pitch) > 12:  # Octave
        return False
    
    # Check for valid harmonic intervals
    if not is_consonant(calculate_interval(curr_cp.pitch, curr_cf.pitch)):
        return False
    
    # Add more checks based on species and mode
    
    return True

def calculate_transition_weight(prev_node: Tuple[Note, Note], current_node: Tuple[Note, Note], 
                                species: Species, mode: Mode) -> float:
    # Implement a basic weighting system
    weight = 1.0
    
    prev_cf, prev_cp = prev_node
    curr_cf, curr_cp = current_node
    
    # Prefer contrary motion
    if (curr_cf.pitch - prev_cf.pitch) * (curr_cp.pitch - prev_cp.pitch) < 0:
        weight *= 1.2
    
    # Prefer imperfect consonances
    if calculate_interval(curr_cp.pitch, curr_cf.pitch) in [3, 4, 8, 9]:
        weight *= 1.1
    
    # Add more weighting factors based on species and mode
    
    return weight

def generate_initial_population(cp_graph: CounterpointGraph, population_size: int) -> List[List[Note]]:
    population = []
    for _ in range(population_size):
        counterpoint = []
        current_node = random.choice(cp_graph.get_nodes_at_position(Fraction(0, 1)))
        counterpoint.append(current_node[1])  # Append the counterpoint note
        
        while True:
            next_nodes = list(cp_graph.graph.successors(current_node))
            if not next_nodes:
                break
            current_node = random.choice(next_nodes)
            counterpoint.append(current_node[1])
        
        population.append(counterpoint)
    
    return population

def evaluate_fitness(counterpoint: List[Note], cf_voice: Voice, species: Species, mode: Mode) -> float:
    cf_notes = cf_voice.notes
    
    # Check species-specific rules
    if species == Species.FIRST:
        valid, errors = check_first_species_rules(counterpoint, cf_notes)
    elif species == Species.SECOND:
        valid, errors = check_second_species_rules(counterpoint, cf_notes)
    elif species == Species.THIRD:
        valid, errors = check_third_species_rules(counterpoint, cf_notes)
    elif species == Species.FOURTH:
        valid, errors = check_fourth_species_rules(counterpoint, cf_notes)
    else:  # Species.FIFTH
        valid, errors = check_fifth_species_rules(counterpoint, cf_notes)

    if not valid:
        return 0.0  # Invalid counterpoint

    score = 1.0 - (len(errors) * 0.1)  # Deduct 0.1 for each error
    
    # Evaluate melodic aspects
    melodic_score = evaluate_melodic_aspects(counterpoint)
    score += melodic_score * 0.3  # 30% weight
    
    # Evaluate harmonic aspects
    harmonic_score = evaluate_harmonic_aspects(counterpoint, cf_notes)
    score += harmonic_score * 0.3  # 30% weight
    
    # Evaluate mode adherence
    mode_score = evaluate_mode_adherence(counterpoint, mode)
    score += mode_score * 0.2  # 20% weight
    
    # Evaluate musicality
    musicality_score = evaluate_musicality(counterpoint, cf_notes)
    score += musicality_score * 0.2  # 20% weight
    
    return min(score, 1.0)  # Cap the score at 1.0

def evaluate_melodic_aspects(counterpoint: List[Note]) -> float:
    # Implement melodic evaluation (stepwise motion, limited leaps, etc.)
    return 0.5  # Placeholder

def evaluate_harmonic_aspects(counterpoint: List[Note], cantus_firmus: List[Note]) -> float:
    # Implement harmonic evaluation (consonance, voice leading, etc.)
    return 0.5  # Placeholder

def evaluate_mode_adherence(counterpoint: List[Note], mode: Mode) -> float:
    # Implement mode adherence evaluation
    return 0.5  # Placeholder

def evaluate_musicality(counterpoint: List[Note], cantus_firmus: List[Note]) -> float:
    # Implement musicality evaluation (variety, climax, etc.)
    return 0.5  # Placeholder

def select_parents(population: List[List[Note]], fitness_scores: List[float]) -> List[List[Note]]:
    # Implement tournament selection
    tournament_size = 5
    selected_parents = []
    
    for _ in range(len(population)):
        tournament = random.sample(list(zip(population, fitness_scores)), tournament_size)
        winner = max(tournament, key=lambda x: x[1])[0]
        selected_parents.append(winner)
    
    return selected_parents

def crossover(parent1: List[Note], parent2: List[Note]) -> List[Note]:
    if len(parent1) != len(parent2):
        raise ValueError("Parents must have the same length")
    
    crossover_point = random.randint(1, len(parent1) - 1)
    return parent1[:crossover_point] + parent2[crossover_point:]

def mutate(individual: List[Note], mutation_rate: float) -> List[Note]:
    mutated = []
    for note in individual:
        if random.random() < mutation_rate:
            new_pitch = note.pitch + random.choice([-2, -1, 1, 2])
            new_pitch = max(0, min(127, new_pitch))  # Ensure pitch is within MIDI range
            mutated.append(Note(new_pitch, note.duration, note.position))
        else:
            mutated.append(note)
    return mutated

def optimize_counterpoint(counterpoint: List[Note], cf_voice: Voice, species: Species, mode: Mode) -> List[Note]:
    cf_notes = cf_voice.notes
    n = len(cf_notes)
    dp = [[0 for _ in range(128)] for _ in range(n)]  # Assuming MIDI pitch range
    
    # Initialize the first column of dp
    for pitch in range(128):
        initial_note = Note(pitch, counterpoint[0].duration, counterpoint[0].position)
        dp[0][pitch] = evaluate_fitness([initial_note], Voice([cf_notes[0]]), species, mode)
    
    # Fill the dp table
    for i in range(1, n):
        for pitch in range(128):
            current_note = Note(pitch, counterpoint[i].duration, counterpoint[i].position)
            best_prev_score = max(dp[i-1])
            current_score = evaluate_fitness([current_note], Voice([cf_notes[i]]), species, mode)
            dp[i][pitch] = best_prev_score + current_score
    
    # Backtrack to find the best path
    optimized_counterpoint = []
    current_pitch = max(range(128), key=lambda p: dp[n-1][p])
    optimized_counterpoint.append(Note(current_pitch, counterpoint[-1].duration, counterpoint[-1].position))
    
    for i in range(n-2, -1, -1):
        best_pitch = max(range(128), key=lambda p: dp[i][p])
        optimized_counterpoint.append(Note(best_pitch, counterpoint[i].duration, counterpoint[i].position))
    
    return list(reversed(optimized_counterpoint))

# Example usage
if __name__ == "__main__":
    cantus_firmus = [
        Note(60, Fraction(1, 1), Fraction(0, 1)),  # C4
        Note(62, Fraction(1, 1), Fraction(1, 1)),  # D4
        Note(64, Fraction(1, 1), Fraction(2, 1)),  # E4
        Note(65, Fraction(1, 1), Fraction(3, 1)),  # F4
        Note(62, Fraction(1, 1), Fraction(4, 1)),  # D4
        Note(60, Fraction(1, 1), Fraction(5, 1)),  # C4
    ]
    species = Species.FIRST
    mode = Mode.IONIAN

    counterpoint = generate_counterpoint(cantus_firmus, species, mode)
    print("Generated Counterpoint:")
    for note in counterpoint:
        print(f"Pitch: {note.pitch}, Duration: {note.duration}, Position: {note.position}")

