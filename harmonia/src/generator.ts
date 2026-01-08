import { Fraction } from "./fraction";
import type { Note, ModeDefinition, SpeciesValue } from "./types";
import { createNote, Species } from "./types";
import { calculateInterval, isConsonant, generatePossibleNotes } from "./utils";
import { checkSpeciesRules } from "./rules";

export interface GraphEdge {
  from: NodePair;
  to: NodePair;
  weight: number;
}

export type NodePair = readonly [Note, Note];

export class CounterpointGraph {
  private nodes: Map<string, NodePair> = new Map();
  private edges: Map<string, GraphEdge[]> = new Map();

  private nodeKey(pair: NodePair): string {
    return `${pair[0].pitch}:${pair[0].position.toString()}|${pair[1].pitch}:${pair[1].position.toString()}`;
  }

  addNode(pair: NodePair): void {
    this.nodes.set(this.nodeKey(pair), pair);
  }

  addEdge(from: NodePair, to: NodePair, weight: number): void {
    const key = this.nodeKey(from);
    const edges = this.edges.get(key) ?? [];
    edges.push({ from, to, weight });
    this.edges.set(key, edges);
  }

  getNodesAtPosition(position: Fraction): NodePair[] {
    const result: NodePair[] = [];
    for (const pair of this.nodes.values()) {
      if (pair[0].position.equals(position)) {
        result.push(pair);
      }
    }
    return result;
  }

  getSuccessors(node: NodePair): NodePair[] {
    const key = this.nodeKey(node);
    const edges = this.edges.get(key) ?? [];
    return edges.map((e) => e.to);
  }

  getPathWeight(path: NodePair[]): number {
    let weight = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const currentNode = path[i];
      const nextNode = path[i + 1];
      if (!currentNode || !nextNode) continue;
      const key = this.nodeKey(currentNode);
      const edges = this.edges.get(key) ?? [];
      const edge = edges.find((e) => this.nodeKey(e.to) === this.nodeKey(nextNode));
      if (edge) weight += edge.weight;
    }
    return weight;
  }
}

function isValidTransition(prevNode: NodePair, currentNode: NodePair): boolean {
  const prevCp = prevNode[1];
  const currCf = currentNode[0];
  const currCp = currentNode[1];

  if (Math.abs(prevCp.pitch - currCp.pitch) > 12) return false;
  if (!isConsonant(calculateInterval(currCp.pitch, currCf.pitch))) return false;

  return true;
}

function calculateTransitionWeight(prevNode: NodePair, currentNode: NodePair): number {
  let weight = 1.0;

  const prevCf = prevNode[0];
  const prevCp = prevNode[1];
  const currCf = currentNode[0];
  const currCp = currentNode[1];

  if ((currCf.pitch - prevCf.pitch) * (currCp.pitch - prevCp.pitch) < 0) {
    weight *= 1.2;
  }

  const interval = calculateInterval(currCp.pitch, currCf.pitch);
  if ([3, 4, 8, 9].includes(interval)) {
    weight *= 1.1;
  }

  return weight;
}

export function initializeCounterpointGraph(cfNotes: readonly Note[], species: SpeciesValue, mode: ModeDefinition): CounterpointGraph {
  const graph = new CounterpointGraph();

  for (let i = 0; i < cfNotes.length; i++) {
    const cfNote = cfNotes[i];
    if (!cfNote) continue;

    const possibleCpNotes = generatePossibleNotes(cfNote, species, mode);

    for (const cpNote of possibleCpNotes) {
      graph.addNode([cfNote, cpNote]);
    }

    if (i > 0) {
      const prevCfNote = cfNotes[i - 1];
      if (!prevCfNote) continue;

      const prevNodes = graph.getNodesAtPosition(prevCfNote.position);
      const currentNodes = graph.getNodesAtPosition(cfNote.position);

      for (const prevNode of prevNodes) {
        for (const currentNode of currentNodes) {
          if (isValidTransition(prevNode, currentNode)) {
            const weight = calculateTransitionWeight(prevNode, currentNode);
            graph.addEdge(prevNode, currentNode, weight);
          }
        }
      }
    }
  }

  return graph;
}

export function generateInitialPopulation(graph: CounterpointGraph, populationSize: number, startPosition: Fraction): Note[][] {
  const population: Note[][] = [];

  for (let p = 0; p < populationSize; p++) {
    const counterpoint: Note[] = [];
    const startNodes = graph.getNodesAtPosition(startPosition);
    if (startNodes.length === 0) continue;

    let currentNode: NodePair | undefined = startNodes[Math.floor(Math.random() * startNodes.length)];
    if (!currentNode) continue;

    counterpoint.push(currentNode[1]);

    while (true) {
      const successors = graph.getSuccessors(currentNode);
      if (successors.length === 0) break;
      currentNode = successors[Math.floor(Math.random() * successors.length)];
      if (!currentNode) break;
      counterpoint.push(currentNode[1]);
    }

    population.push(counterpoint);
  }

  return population;
}

export function evaluateFitness(counterpoint: readonly Note[], cfNotes: readonly Note[], species: SpeciesValue, mode: ModeDefinition): number {
  const result = checkSpeciesRules(counterpoint, cfNotes, species);

  if (!result.valid) return 0.0;

  let score = 1.0 - result.errors.length * 0.1;

  const melodicScore = evaluateMelodicAspects(counterpoint);
  score += melodicScore * 0.3;

  const harmonicScore = evaluateHarmonicAspects(counterpoint, cfNotes);
  score += harmonicScore * 0.3;

  const modeScore = evaluateModeAdherence(counterpoint, mode);
  score += modeScore * 0.2;

  const musicalityScore = evaluateMusicality(counterpoint);
  score += musicalityScore * 0.2;

  return Math.min(score, 1.0);
}

function evaluateMelodicAspects(counterpoint: readonly Note[]): number {
  if (counterpoint.length < 2) return 0.5;

  let stepwiseCount = 0;
  let leapCount = 0;
  for (let i = 1; i < counterpoint.length; i++) {
    const curr = counterpoint[i];
    const prev = counterpoint[i - 1];
    if (!curr || !prev) continue;
    const interval = Math.abs(curr.pitch - prev.pitch);
    if (interval <= 2) stepwiseCount++;
    else if (interval >= 5) leapCount++;
  }

  const stepwiseRatio = stepwiseCount / (counterpoint.length - 1);
  const leapPenalty = Math.max(0, leapCount / (counterpoint.length - 1) - 0.2) * 2;

  return Math.max(0, stepwiseRatio - leapPenalty);
}

function evaluateHarmonicAspects(counterpoint: readonly Note[], cantusFirmus: readonly Note[]): number {
  if (counterpoint.length === 0 || cantusFirmus.length === 0) return 0.5;

  let consonantCount = 0;
  const len = Math.min(counterpoint.length, cantusFirmus.length);
  for (let i = 0; i < len; i++) {
    const cp = counterpoint[i];
    const cf = cantusFirmus[i];
    if (cp && cf && isConsonant(calculateInterval(cp.pitch, cf.pitch))) {
      consonantCount++;
    }
  }

  return consonantCount / len;
}

function evaluateModeAdherence(counterpoint: readonly Note[], mode: ModeDefinition): number {
  if (counterpoint.length === 0) return 0.5;

  let inModeCount = 0;
  for (const note of counterpoint) {
    if (mode.intervals.includes(note.pitch % 12)) {
      inModeCount++;
    }
  }

  return inModeCount / counterpoint.length;
}

function evaluateMusicality(counterpoint: readonly Note[]): number {
  if (counterpoint.length < 3) return 0.5;

  const pitches = counterpoint.map((n) => n.pitch);
  const maxPitch = Math.max(...pitches);
  const maxIndex = pitches.indexOf(maxPitch);
  const climaxPosition = maxIndex / (pitches.length - 1);

  const climaxScore = climaxPosition > 0.3 && climaxPosition < 0.8 ? 1.0 : 0.5;

  const uniquePitches = new Set(pitches).size;
  const varietyScore = Math.min(uniquePitches / pitches.length * 2, 1.0);

  return (climaxScore + varietyScore) / 2;
}

export function selectParents(population: Note[][], fitnessScores: number[], tournamentSize: number = 5): Note[][] {
  const selectedParents: Note[][] = [];

  for (let i = 0; i < population.length; i++) {
    const tournamentIndices: number[] = [];
    for (let j = 0; j < tournamentSize; j++) {
      tournamentIndices.push(Math.floor(Math.random() * population.length));
    }

    let bestIndex = tournamentIndices[0] ?? 0;
    for (const idx of tournamentIndices) {
      const currentFitness = fitnessScores[idx] ?? 0;
      const bestFitness = fitnessScores[bestIndex] ?? 0;
      if (currentFitness > bestFitness) {
        bestIndex = idx;
      }
    }

    const parent = population[bestIndex];
    if (parent) selectedParents.push(parent);
  }

  return selectedParents;
}

export function crossover(parent1: Note[], parent2: Note[]): Note[] {
  if (parent1.length !== parent2.length || parent1.length === 0) {
    return [...parent1];
  }

  const crossoverPoint = 1 + Math.floor(Math.random() * (parent1.length - 1));
  return [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
}

export function mutate(individual: Note[], mutationRate: number): Note[] {
  const pitchChanges = [-2, -1, 1, 2];
  return individual.map((note) => {
    if (Math.random() < mutationRate) {
      const change = pitchChanges[Math.floor(Math.random() * pitchChanges.length)] ?? 0;
      const newPitch = Math.max(0, Math.min(127, note.pitch + change));
      return createNote(newPitch, note.duration, note.position);
    }
    return note;
  });
}

export function optimizeCounterpoint(counterpoint: Note[], cfNotes: readonly Note[], species: SpeciesValue, mode: ModeDefinition): Note[] {
  const n = cfNotes.length;
  if (n === 0 || counterpoint.length === 0) return counterpoint;

  const dp: number[][] = Array.from({ length: n }, () => Array(128).fill(0) as number[]);

  const firstCp = counterpoint[0];
  const firstCf = cfNotes[0];
  if (!firstCp || !firstCf) return counterpoint;

  for (let pitch = 0; pitch < 128; pitch++) {
    const testNote = createNote(pitch, firstCp.duration, firstCp.position);
    const dpRow = dp[0];
    if (dpRow) dpRow[pitch] = evaluateFitness([testNote], [firstCf], species, mode);
  }

  for (let i = 1; i < n; i++) {
    const prevDpRow = dp[i - 1];
    const currDpRow = dp[i];
    if (!prevDpRow || !currDpRow) continue;

    const bestPrevScore = Math.max(...prevDpRow);
    const cpIdx = Math.min(i, counterpoint.length - 1);
    const cpNote = counterpoint[cpIdx];
    const cfNote = cfNotes[i];

    if (!cpNote || !cfNote) continue;

    for (let pitch = 0; pitch < 128; pitch++) {
      const testNote = createNote(pitch, cpNote.duration, cpNote.position);
      const currentScore = evaluateFitness([testNote], [cfNote], species, mode);
      currDpRow[pitch] = bestPrevScore + currentScore;
    }
  }

  const optimized: Note[] = [];
  const lastDpRow = dp[n - 1];
  if (!lastDpRow) return counterpoint;

  let currentPitch = lastDpRow.indexOf(Math.max(...lastDpRow));
  const lastCp = counterpoint[counterpoint.length - 1];
  if (lastCp) {
    optimized.unshift(createNote(currentPitch, lastCp.duration, lastCp.position));
  }

  for (let i = n - 2; i >= 0; i--) {
    const dpRow = dp[i];
    if (!dpRow) continue;
    currentPitch = dpRow.indexOf(Math.max(...dpRow));
    const cpIdx = Math.min(i, counterpoint.length - 1);
    const cpNote = counterpoint[cpIdx];
    if (cpNote) {
      optimized.unshift(createNote(currentPitch, cpNote.duration, cpNote.position));
    }
  }

  return optimized;
}

export interface GeneratorConfig {
  populationSize: number;
  maxGenerations: number;
  mutationRate: number;
  onProgress?: (generation: number, bestFitness: number) => void;
}

const DEFAULT_CONFIG: GeneratorConfig = {
  populationSize: 100,
  maxGenerations: 50,
  mutationRate: 0.1,
};

export function generateCounterpoint(cfNotes: readonly Note[], species: SpeciesValue, mode: ModeDefinition, config: Partial<GeneratorConfig> = {}): Note[] {
  const { populationSize, maxGenerations, mutationRate, onProgress } = { ...DEFAULT_CONFIG, ...config };

  if (cfNotes.length === 0) return [];

  const firstCf = cfNotes[0];
  if (!firstCf) return [];

  const graph = initializeCounterpointGraph(cfNotes, species, mode);
  let population = generateInitialPopulation(graph, populationSize, firstCf.position);

  if (population.length === 0) return [];

  for (let generation = 0; generation < maxGenerations; generation++) {
    const fitnessScores = population.map((individual) => evaluateFitness(individual, cfNotes, species, mode));

    const bestFitness = Math.max(...fitnessScores);
    onProgress?.(generation + 1, bestFitness);

    if (bestFitness === 1.0) break;

    const parents = selectParents(population, fitnessScores);

    const newPopulation: Note[][] = [];
    while (newPopulation.length < populationSize) {
      const parent1 = parents[Math.floor(Math.random() * parents.length)];
      const parent2 = parents[Math.floor(Math.random() * parents.length)];
      if (!parent1 || !parent2) continue;
      let child = crossover(parent1, parent2);
      child = mutate(child, mutationRate);
      newPopulation.push(child);
    }

    population = newPopulation;
  }

  const finalScores = population.map((individual) => evaluateFitness(individual, cfNotes, species, mode));
  const bestIndex = finalScores.indexOf(Math.max(...finalScores));
  const bestCounterpoint = population[bestIndex];

  if (!bestCounterpoint) return [];

  return optimizeCounterpoint(bestCounterpoint, cfNotes, species, mode);
}
