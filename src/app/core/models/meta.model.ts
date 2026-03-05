import { QuarterResult } from './quarter.model';

// ─── App phase management ──────────────────

export type AppPhase = 'menu' | 'playing' | 'run-summary';

// ─── Run summary ───────────────────────────

export interface RunSummary {
  endedAt: number;
  yearsSurvived: number;
  quartersPassed: number;
  quartersPlayed: number;
  totalGoldEarned: number;
  totalTasksCompleted: number;
  bossesBeaten: number;
  infamyEarned: number;
}

export interface HallOfFameEntry extends RunSummary {
  id: string;
}

// ─── Compendium (discovery tracking) ───────

export interface CompendiumData {
  seenArchetypes: string[];   // archetype IDs (18 possible)
  seenTasks: string[];        // task template names (53+ possible)
  seenReviewers: string[];    // reviewer IDs (5 possible)
  seenModifiers: string[];    // modifier IDs (14 possible)
}

export function createEmptyCompendium(): CompendiumData {
  return {
    seenArchetypes: [],
    seenTasks: [],
    seenReviewers: [],
    seenModifiers: [],
  };
}

// ─── Meta save data ────────────────────────

export interface MetaSaveData {
  version: number;
  totalInfamy: number;
  hallOfFame: HallOfFameEntry[];
  compendium: CompendiumData;
  permanentUnlocks: string[];  // placeholder for Phase D
  soundEnabled: boolean;
}

export const META_SAVE_VERSION = 1;

export function createDefaultMetaSave(): MetaSaveData {
  return {
    version: META_SAVE_VERSION,
    totalInfamy: 0,
    hallOfFame: [],
    compendium: createEmptyCompendium(),
    permanentUnlocks: [],
    soundEnabled: true,
  };
}

// ─── Discovered items (per-run) ────────────

export interface DiscoveredItems {
  archetypes: string[];
  tasks: string[];
  reviewers: string[];
  modifiers: string[];
}

// ─── Infamy formula ────────────────────────

export function calculateInfamy(summary: Omit<RunSummary, 'infamyEarned' | 'endedAt'>): number {
  const yearBonus = summary.yearsSurvived * 20;
  const quarterBonus = summary.quartersPassed * 5;
  const goldBonus = Math.floor(summary.totalGoldEarned / 100);
  const bossBonus = summary.bossesBeaten * 50;
  // Perfect bonus: 25 if all Q1-Q3 quarters passed (quartersPlayed > 0 and quartersPassed === quartersPlayed)
  const perfectBonus = summary.quartersPlayed > 0 && summary.quartersPassed === summary.quartersPlayed ? 25 : 0;
  return yearBonus + quarterBonus + goldBonus + bossBonus + perfectBonus;
}

/** Breakdown of Infamy components for UI display */
export interface InfamyBreakdown {
  yearBonus: number;
  quarterBonus: number;
  goldBonus: number;
  bossBonus: number;
  perfectBonus: number;
  total: number;
}

export function getInfamyBreakdown(summary: Omit<RunSummary, 'infamyEarned' | 'endedAt'>): InfamyBreakdown {
  const yearBonus = summary.yearsSurvived * 20;
  const quarterBonus = summary.quartersPassed * 5;
  const goldBonus = Math.floor(summary.totalGoldEarned / 100);
  const bossBonus = summary.bossesBeaten * 50;
  const perfectBonus = summary.quartersPlayed > 0 && summary.quartersPassed === summary.quartersPlayed ? 25 : 0;
  return {
    yearBonus,
    quarterBonus,
    goldBonus,
    bossBonus,
    perfectBonus,
    total: yearBonus + quarterBonus + goldBonus + bossBonus + perfectBonus,
  };
}

// ─── Run summary builder ───────────────────

export function buildRunSummary(
  quarterResults: QuarterResult[],
  totalGoldEarned: number,
  totalTasksCompleted: number,
): RunSummary {
  const yearsSurvived = quarterResults.length > 0
    ? quarterResults[quarterResults.length - 1].year
    : 0;

  // Quarters passed = Q1-Q3 quarters that passed (exclude Q4 from "passed" count since Q4 fail = run over)
  const quartersPassed = quarterResults.filter(r => r.passed).length;

  // Quarters played = total Q1-Q3 quarters (not Q4)
  const quartersPlayed = quarterResults.filter(r => r.quarter !== 4).length;

  // Bosses beaten = Q4 quarters that passed
  const bossesBeaten = quarterResults.filter(r => r.quarter === 4 && r.passed).length;

  const partialSummary = {
    yearsSurvived,
    quartersPassed,
    quartersPlayed,
    totalGoldEarned,
    totalTasksCompleted,
    bossesBeaten,
  };

  return {
    ...partialSummary,
    endedAt: Date.now(),
    infamyEarned: calculateInfamy(partialSummary),
  };
}
