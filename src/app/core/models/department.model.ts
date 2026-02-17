import { TaskCategory, TaskTier } from './task.model';

export interface Department {
  category: TaskCategory;
  xp: number;
  level: number;
}

/** XP required to reach a given department level */
export function deptXpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Level 2: 20, Level 3: 60, Level 4: 120, Level 5: 200, ...
  return Math.floor(20 * Math.pow(level - 1, 1.8));
}

/** Calculate department level from total XP */
export function deptLevelFromXp(xp: number): number {
  let level = 1;
  while (deptXpForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

/** Department XP earned per task tier */
export const DEPT_TIER_XP: Record<TaskTier, number> = {
  petty: 5,
  sinister: 12,
  diabolical: 25,
  legendary: 50,
};

/**
 * Which task tiers are available at each department level.
 * - Level 1: petty only
 * - Level 3: sinister unlocks
 * - Level 5: diabolical unlocks
 * - Level 8: legendary unlocks
 */
export function availableTiersForDeptLevel(level: number): TaskTier[] {
  const tiers: TaskTier[] = ['petty'];
  if (level >= 3) tiers.push('sinister');
  if (level >= 5) tiers.push('diabolical');
  if (level >= 8) tiers.push('legendary');
  return tiers;
}

export const DEPARTMENT_LABELS: Record<TaskCategory, { label: string; icon: string }> = {
  schemes: { label: 'Schemes', icon: '🗝️' },
  heists: { label: 'Heists', icon: '💎' },
  research: { label: 'Research', icon: '🧪' },
  mayhem: { label: 'Mayhem', icon: '💥' },
};
