import { TaskCategory, TaskTier, TIER_UNLOCK_COSTS } from './task.model';

export interface Department {
  category: TaskCategory;
  level: number;          // 1-8, bought in shop
  workerSlots: number;    // 0-4, bought in shop
  hasManager: boolean;    // bought in shop
}

/** Per-department tier unlock tracking */
export type DeptTierUnlocks = Record<TaskCategory, Set<TaskTier>>;

/** Create default tier unlocks (petty always unlocked) */
export function createDefaultTierUnlocks(): DeptTierUnlocks {
  return {
    schemes: new Set<TaskTier>(['petty']),
    heists: new Set<TaskTier>(['petty']),
    research: new Set<TaskTier>(['petty']),
    mayhem: new Set<TaskTier>(['petty']),
  };
}

// ─── Gold-gated progression costs ──────

/** Gold cost to upgrade dept level: index 0 = 1→2, index 6 = 7→8 */
export const DEPT_LEVEL_COSTS = [30, 80, 200, 500, 1200, 2500, 5000];

/** Gold cost to buy worker slots: index 0 = 1st slot, index 3 = 4th slot */
export const WORKER_SLOT_COSTS = [20, 60, 150, 400];

/** Gold cost to buy a manager slot for a department */
export const MANAGER_SLOT_COST = 50;

/** Queue capacity for a department: base 1 + workerSlots + operationsDesk bonus */
export function getDeptQueueCapacity(workerSlots: number, operationsDeskBonus: number): number {
  return 1 + workerSlots + operationsDeskBonus;
}

/** Get the gold cost to upgrade a department from currentLevel to currentLevel+1. Returns 0 if already max. */
export function getDeptLevelCost(currentLevel: number): number {
  const idx = currentLevel - 1; // level 1→2 = index 0
  if (idx < 0 || idx >= DEPT_LEVEL_COSTS.length) return 0;
  return DEPT_LEVEL_COSTS[idx];
}

/** Get the gold cost to buy the next worker slot. Returns 0 if already at max (4). */
export function getWorkerSlotCost(currentSlots: number): number {
  if (currentSlots < 0 || currentSlots >= WORKER_SLOT_COSTS.length) return 0;
  return WORKER_SLOT_COSTS[currentSlots];
}

/** Get the integer additive mult bonus for a department at a given level.
 *  +1 per level above 1. Level 1 = +0, Level 5 = +4. */
export function getDeptMult(level: number): number {
  return Math.max(0, level - 1);
}

/** Get which tiers are unlocked for a department given its unlock set */
export function getUnlockedTiers(unlocks: Set<TaskTier>): TaskTier[] {
  const all: TaskTier[] = ['petty', 'sinister', 'diabolical', 'legendary'];
  return all.filter(t => unlocks.has(t));
}

/** Get the cost to unlock a tier in a department (0 = free/already unlocked) */
export function getTierUnlockCost(tier: TaskTier): number {
  return TIER_UNLOCK_COSTS[tier];
}

export const DEPARTMENT_LABELS: Record<TaskCategory, { label: string; icon: string }> = {
  schemes: { label: 'Schemes', icon: '🗝️' },
  heists: { label: 'Heists', icon: '💎' },
  research: { label: 'Research', icon: '🧪' },
  mayhem: { label: 'Mayhem', icon: '💥' },
};

// ─── Department-specific mechanic helpers ──────

/** Heists: gold variance floor multiplier. L1: 0.5×, L3: 0.75×, L5: 1.0× */
export function getHeistFloorMult(level: number): number {
  return 0.5 + Math.min(0.5, (level - 1) * 0.125);
}

/** Heists: gold variance ceiling multiplier (fixed at 2.5×) */
export const HEIST_CEIL_MULT = 2.5;

/** Roll a heist gold value in [floor(base*floorMult), floor(base*ceilMult)] */
export function rollHeistGold(baseGold: number, level: number, floorBonusPercent: number = 0): number {
  const floorMult = getHeistFloorMult(level) + (floorBonusPercent / 100);
  const low = Math.floor(baseGold * floorMult);
  const high = Math.floor(baseGold * HEIST_CEIL_MULT);
  if (low >= high) return high;
  return low + Math.floor(Math.random() * (high - low + 1));
}

/** Research: breakthrough threshold (completions needed).
 *  L1: 5, L3: 4, L5: 3. Formula: max(3, 6 - floor(level / 2)) */
export function getBreakthroughThreshold(level: number): number {
  return Math.max(3, 6 - Math.floor(level / 2));
}

/** Research: every N completions, add a scheme card to deck */
export const RESEARCH_DECK_GROWTH_INTERVAL = 3;

/** Mayhem: click reduction factor (operations have 40% fewer clicks) */
export const MAYHEM_CLICK_FACTOR = 0.6;

/** Mayhem: gold reduction factor (operations have 30% less base gold) */
export const MAYHEM_GOLD_FACTOR = 0.7;

/** Mayhem: apply click modifier to base clicks */
export function getMayhemClicks(baseClicks: number): number {
  return Math.max(3, Math.ceil(baseClicks * MAYHEM_CLICK_FACTOR));
}

/** Mayhem: apply gold modifier to base gold */
export function getMayhemGold(baseGold: number): number {
  return Math.max(1, Math.floor(baseGold * MAYHEM_GOLD_FACTOR));
}

/** Mayhem: combo threshold (consecutive completions for 2× gold) */
export const MAYHEM_COMBO_THRESHOLD = 3;

/** Mayhem: combo timeout (ms) — combo resets if no mayhem completion within this window */
export const MAYHEM_COMBO_TIMEOUT_MS = 8000;

// ─── Payout estimation ──────

export interface PayoutEstimate {
  baseGold: number;
  mult: number;         // total effective mult (≥1)
  expectedGold: number; // baseGold × mult
}

/** Estimate the gold payout for a task in a department, given all active multipliers.
 *  Pure function — no service dependency. */
export function estimateTaskPayout(
  baseGold: number,
  deptLevel: number,
  activeBreakthroughs: number,
  managerGoldMult: number,
  workerGoldMult: number,
  isSpecialOp: boolean,
  comboMult: number,
  bossPenalty: number,
): PayoutEstimate {
  let mult = 1
    + getDeptMult(deptLevel)
    + activeBreakthroughs
    + managerGoldMult
    + workerGoldMult
    + (isSpecialOp ? 1 : 0)
    + comboMult
    + bossPenalty;  // bossPenalty is negative (e.g. -1, -2)
  mult = Math.max(1, mult);
  return { baseGold, mult, expectedGold: baseGold * mult };
}
