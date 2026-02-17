import { TaskCategory } from './task.model';

export interface MinionStats {
  speed: number;       // 0.7–1.3, affects task completion time
  efficiency: number;  // 0.7–1.3, affects gold reward bonus
}

export interface Minion {
  id: string;
  name: string;
  appearance: MinionAppearance;
  status: 'idle' | 'working';
  assignedTaskId: string | null;
  stats: MinionStats;
  specialty: TaskCategory;
  xp: number;
  level: number;
}

export interface MinionAppearance {
  color: string;
  accessory: 'goggles' | 'helmet' | 'cape' | 'horns' | 'none';
}

/** XP required to reach a given level. Level 1 = 0 XP, Level 2 = 10, etc. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Each level requires increasingly more XP: 10, 25, 50, 85, 130, ...
  return Math.floor(10 * Math.pow(level - 1, 1.6));
}

/** Calculate minion level from total XP */
export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

/** Specialty bonus multiplier when minion works matching category */
export const SPECIALTY_BONUS = 0.25; // +25% speed and efficiency

export const MINION_NAMES: string[] = [
  'Grim', 'Skulk', 'Mortis', 'Dread', 'Vex',
  'Blight', 'Scourge', 'Wraith', 'Gloom', 'Malice',
  'Spite', 'Ruin', 'Hex', 'Fang', 'Shade',
  'Doom', 'Murk', 'Cinder', 'Rot', 'Snarl',
  'Blaze', 'Torment', 'Havoc', 'Nox', 'Vile',
];

export const MINION_COLORS: string[] = [
  '#6c3483', '#1a5276', '#7b241c', '#1e8449', '#b9770e',
  '#5b2c6f', '#154360', '#922b21', '#196f3d', '#9a7d0a',
  '#4a235a', '#1b4f72', '#78281f', '#1d8348', '#7d6608',
];

export const MINION_ACCESSORIES: MinionAppearance['accessory'][] = [
  'goggles', 'helmet', 'cape', 'horns', 'none',
];

export const SPECIALTY_CATEGORIES: TaskCategory[] = [
  'schemes', 'heists', 'research', 'mayhem',
];
