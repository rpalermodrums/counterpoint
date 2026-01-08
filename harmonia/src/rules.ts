import type { Note, SpeciesValue } from "./types";
import { Species } from "./types";
import { Fraction } from "./fraction";
import {
  calculateInterval,
  isConsonant,
  isPerfectConsonance,
  isPassingTone,
  checkParallelMotion,
  isValidSuspensionPreparation,
  isValidSuspension,
  isValidSuspensionResolution,
  isDownwardResolution,
  isStrongBeat,
} from "./utils";

export interface RuleCheckResult {
  valid: boolean;
  errors: string[];
}

export function checkFirstSpeciesRules(counterpoint: readonly Note[], cantusFirmus: readonly Note[]): RuleCheckResult {
  const errors: string[] = [];

  if (counterpoint.length !== cantusFirmus.length) {
    errors.push("Counterpoint should have the same number of notes as the cantus firmus");
  }

  const len = Math.min(counterpoint.length, cantusFirmus.length);
  for (let i = 0; i < len; i++) {
    const cpNote = counterpoint[i]!;
    const cfNote = cantusFirmus[i]!;

    if (!cpNote.duration.equals(cfNote.duration)) {
      errors.push(`Note duration mismatch at position ${i}`);
    }

    const interval = calculateInterval(cpNote.pitch, cfNote.pitch);
    if (!isConsonant(interval)) {
      errors.push(`Dissonant interval (${interval}) at position ${i}`);
    }

    if (i > 0) {
      const prevCp = counterpoint[i - 1]!;
      const prevCf = cantusFirmus[i - 1]!;
      if (checkParallelMotion(prevCp.pitch, cpNote.pitch, prevCf.pitch, cfNote.pitch)) {
        errors.push(`Parallel perfect consonance at position ${i}`);
      }
    }
  }

  if (counterpoint.length > 0 && cantusFirmus.length > 0) {
    const firstCp = counterpoint[0]!;
    const firstCf = cantusFirmus[0]!;
    const lastCp = counterpoint[counterpoint.length - 1]!;
    const lastCf = cantusFirmus[cantusFirmus.length - 1]!;

    if (!isPerfectConsonance(calculateInterval(firstCp.pitch, firstCf.pitch))) {
      errors.push("Counterpoint should begin with a perfect consonance");
    }
    if (!isPerfectConsonance(calculateInterval(lastCp.pitch, lastCf.pitch))) {
      errors.push("Counterpoint should end with a perfect consonance");
    }
  }

  if (counterpoint.length > 1 && cantusFirmus.length > 1) {
    const penultimateCp = counterpoint[counterpoint.length - 2]!;
    const penultimateCf = cantusFirmus[cantusFirmus.length - 2]!;
    const penultimateInterval = calculateInterval(penultimateCp.pitch, penultimateCf.pitch);
    if (![8, 9].includes(penultimateInterval)) {
      errors.push("Penultimate measure should be a major sixth or minor third");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function checkSecondSpeciesRules(counterpoint: readonly Note[], cantusFirmus: readonly Note[]): RuleCheckResult {
  const errors: string[] = [];

  if (counterpoint.length !== 2 * cantusFirmus.length) {
    errors.push("Counterpoint should have twice as many notes as the cantus firmus");
  }

  for (let i = 0; i < counterpoint.length; i += 2) {
    const cpStrong = counterpoint[i];
    const cfIndex = Math.floor(i / 2);
    const cfNote = cantusFirmus[cfIndex];

    if (!cfNote || !cpStrong) continue;

    const strongInterval = calculateInterval(cpStrong.pitch, cfNote.pitch);
    if (!isConsonant(strongInterval)) {
      errors.push(`Dissonant interval on strong beat at position ${i}`);
    }

    const cpWeak = counterpoint[i + 1];
    if (cpWeak) {
      const weakInterval = calculateInterval(cpWeak.pitch, cfNote.pitch);
      if (!isConsonant(weakInterval)) {
        const nextCp = counterpoint[i + 2];
        const nextPitch = nextCp ? nextCp.pitch : cfNote.pitch;
        if (![2, 11].includes(weakInterval) || !isPassingTone(cpStrong.pitch, cpWeak.pitch, nextPitch)) {
          errors.push(`Invalid weak beat interval at position ${i + 1}`);
        }
      }
    }
  }

  if (counterpoint.length > 0 && cantusFirmus.length > 0) {
    const firstCp = counterpoint[0]!;
    const firstCf = cantusFirmus[0]!;
    const lastCp = counterpoint[counterpoint.length - 1]!;
    const lastCf = cantusFirmus[cantusFirmus.length - 1]!;

    if (!isPerfectConsonance(calculateInterval(firstCp.pitch, firstCf.pitch))) {
      errors.push("Counterpoint should begin with a perfect consonance");
    }
    if (!isPerfectConsonance(calculateInterval(lastCp.pitch, lastCf.pitch))) {
      errors.push("Counterpoint should end with a perfect consonance");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function checkThirdSpeciesRules(counterpoint: readonly Note[], cantusFirmus: readonly Note[]): RuleCheckResult {
  const errors: string[] = [];

  if (counterpoint.length !== 4 * cantusFirmus.length) {
    errors.push("Counterpoint should have four times as many notes as the cantus firmus");
  }

  for (let i = 0; i < counterpoint.length; i += 4) {
    const cfIndex = Math.floor(i / 4);
    const cfNote = cantusFirmus[cfIndex];
    const firstCp = counterpoint[i];

    if (!cfNote || !firstCp) continue;

    const strongInterval = calculateInterval(firstCp.pitch, cfNote.pitch);
    if (!isConsonant(strongInterval)) {
      errors.push(`Dissonant interval on strong beat at position ${i}`);
    }

    for (let j = 1; j < 4; j++) {
      const cpNote = counterpoint[i + j];
      const prevCpNote = counterpoint[i + j - 1];
      const nextCpNote = counterpoint[i + j + 1];

      if (!cpNote || !prevCpNote) continue;

      const interval = calculateInterval(cpNote.pitch, cfNote.pitch);
      if (!isConsonant(interval)) {
        const nextPitch = nextCpNote ? nextCpNote.pitch : cfNote.pitch;
        if (![2, 11].includes(interval) || !isPassingTone(prevCpNote.pitch, cpNote.pitch, nextPitch)) {
          errors.push(`Invalid interval at position ${i + j}`);
        }
      }
    }
  }

  if (counterpoint.length > 0 && cantusFirmus.length > 0) {
    const firstCp = counterpoint[0]!;
    const firstCf = cantusFirmus[0]!;
    const lastCp = counterpoint[counterpoint.length - 1]!;
    const lastCf = cantusFirmus[cantusFirmus.length - 1]!;

    if (!isPerfectConsonance(calculateInterval(firstCp.pitch, firstCf.pitch))) {
      errors.push("Counterpoint should begin with a perfect consonance");
    }
    if (!isPerfectConsonance(calculateInterval(lastCp.pitch, lastCf.pitch))) {
      errors.push("Counterpoint should end with a perfect consonance");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function checkFourthSpeciesRules(counterpoint: readonly Note[], cantusFirmus: readonly Note[]): RuleCheckResult {
  const errors: string[] = [];

  if (counterpoint.length !== 2 * cantusFirmus.length) {
    errors.push("Counterpoint should have twice as many notes as the cantus firmus");
  }

  for (let i = 2; i < counterpoint.length; i += 2) {
    const cfIndex = Math.floor(i / 2);
    const cfNote = cantusFirmus[cfIndex];
    const prevCfNote = cantusFirmus[Math.floor((i - 1) / 2)];
    const prevCp = counterpoint[i - 1];
    const currCp = counterpoint[i];
    const nextCp = counterpoint[i + 1];

    if (!cfNote || !prevCfNote || !prevCp || !currCp) continue;

    const preparationInterval = calculateInterval(prevCp.pitch, prevCfNote.pitch);
    const suspensionInterval = calculateInterval(currCp.pitch, cfNote.pitch);

    if (!isValidSuspensionPreparation(preparationInterval)) {
      errors.push(`Invalid preparation interval at position ${i - 1}`);
    }
    if (!isValidSuspension(suspensionInterval)) {
      errors.push(`Invalid suspension interval at position ${i}`);
    }

    if (nextCp) {
      const resolutionInterval = calculateInterval(nextCp.pitch, cfNote.pitch);
      if (!isValidSuspensionResolution(resolutionInterval)) {
        errors.push(`Invalid resolution interval at position ${i + 1}`);
      }
      if (!isDownwardResolution(currCp.pitch, nextCp.pitch)) {
        errors.push(`Suspension not resolved downward at position ${i + 1}`);
      }
    }
  }

  if (counterpoint.length > 0 && cantusFirmus.length > 0) {
    const firstCp = counterpoint[0]!;
    const firstCf = cantusFirmus[0]!;
    const lastCp = counterpoint[counterpoint.length - 1]!;
    const lastCf = cantusFirmus[cantusFirmus.length - 1]!;

    if (!isPerfectConsonance(calculateInterval(firstCp.pitch, firstCf.pitch))) {
      errors.push("Counterpoint should begin with a perfect consonance");
    }
    if (!isPerfectConsonance(calculateInterval(lastCp.pitch, lastCf.pitch))) {
      errors.push("Counterpoint should end with a perfect consonance");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function checkFifthSpeciesRules(counterpoint: readonly Note[], cantusFirmus: readonly Note[]): RuleCheckResult {
  const errors: string[] = [];

  const cfDuration = cantusFirmus.reduce((sum, n) => sum.add(n.duration), Fraction.ZERO);
  const cpDuration = counterpoint.reduce((sum, n) => sum.add(n.duration), Fraction.ZERO);

  if (!cpDuration.equals(cfDuration)) {
    errors.push("Total duration of counterpoint should match the cantus firmus");
  }

  let currentMeasure = 0;
  for (let i = 0; i < counterpoint.length; i++) {
    const cpNote = counterpoint[i];
    if (!cpNote) continue;

    while (currentMeasure < cantusFirmus.length) {
      const cfCheck = cantusFirmus[currentMeasure];
      if (!cfCheck || !cfCheck.position.lessThanOrEqual(cpNote.position)) break;
      currentMeasure++;
    }

    const cfNote = cantusFirmus[Math.max(0, currentMeasure - 1)];
    if (!cfNote) continue;

    const interval = calculateInterval(cpNote.pitch, cfNote.pitch);

    if (isStrongBeat(cpNote.position)) {
      if (!isConsonant(interval)) {
        errors.push(`Dissonant interval on strong beat at position ${cpNote.position.toString()}`);
      }
    } else {
      if (!isConsonant(interval)) {
        const prevCp = counterpoint[i - 1];
        const nextCp = counterpoint[i + 1];
        if (prevCp && nextCp) {
          if (!isPassingTone(prevCp.pitch, cpNote.pitch, nextCp.pitch)) {
            errors.push(`Invalid dissonance on weak beat at position ${cpNote.position.toString()}`);
          }
        }
      }
    }

    const prevCpNote = counterpoint[i - 1];
    if (prevCpNote) {
      const posDiff = cpNote.position.subtract(prevCpNote.position);
      if (posDiff.equals(Fraction.HALF)) {
        const prevInterval = calculateInterval(prevCpNote.pitch, cfNote.pitch);
        if (
          isValidSuspension(prevInterval) &&
          isValidSuspensionResolution(interval) &&
          isDownwardResolution(prevCpNote.pitch, cpNote.pitch)
        ) {
          continue;
        } else if (!isConsonant(interval)) {
          errors.push(`Invalid suspension or dissonance treatment at position ${cpNote.position.toString()}`);
        }
      }
    }
  }

  if (counterpoint.length > 0 && cantusFirmus.length > 0) {
    const firstCp = counterpoint[0]!;
    const firstCf = cantusFirmus[0]!;
    const lastCp = counterpoint[counterpoint.length - 1]!;
    const lastCf = cantusFirmus[cantusFirmus.length - 1]!;

    if (!isPerfectConsonance(calculateInterval(firstCp.pitch, firstCf.pitch))) {
      errors.push("Counterpoint should begin with a perfect consonance");
    }
    if (!isPerfectConsonance(calculateInterval(lastCp.pitch, lastCf.pitch))) {
      errors.push("Counterpoint should end with a perfect consonance");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function checkSpeciesRules(counterpoint: readonly Note[], cantusFirmus: readonly Note[], species: SpeciesValue): RuleCheckResult {
  switch (species) {
    case Species.FIRST:
      return checkFirstSpeciesRules(counterpoint, cantusFirmus);
    case Species.SECOND:
      return checkSecondSpeciesRules(counterpoint, cantusFirmus);
    case Species.THIRD:
      return checkThirdSpeciesRules(counterpoint, cantusFirmus);
    case Species.FOURTH:
      return checkFourthSpeciesRules(counterpoint, cantusFirmus);
    case Species.FIFTH:
      return checkFifthSpeciesRules(counterpoint, cantusFirmus);
    default:
      return { valid: false, errors: ["Unknown species"] };
  }
}
