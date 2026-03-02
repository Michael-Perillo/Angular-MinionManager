export type VoucherId = 'iron-fingers' | 'board-expansion' | 'operations-desk' |
                        'rapid-intel' | 'hire-discount' | 'dept-funding';

export interface VoucherDefinition {
  id: VoucherId;
  name: string;
  description: string;
  icon: string;
  maxLevel: 3;
  levelCosts: [number, number, number];
  levelEffects: [number, number, number];
  effectLabel: string;
}

export const VOUCHERS: Record<VoucherId, VoucherDefinition> = {
  'iron-fingers':     { id: 'iron-fingers',     name: 'Iron Fingers',     icon: '\u{1F44A}', description: 'Increased click power',           maxLevel: 3, levelCosts: [40, 200, 600],  levelEffects: [2, 5, 12],          effectLabel: 'click power' },
  'board-expansion':  { id: 'board-expansion',  name: 'Board Expansion',  icon: '\u{1F4CB}', description: 'More mission board slots',        maxLevel: 3, levelCosts: [60, 250, 650],  levelEffects: [3, 7, 12],          effectLabel: 'board slots' },
  'operations-desk':  { id: 'operations-desk',  name: 'Operations Desk',  icon: '\u{1F5C2}\uFE0F', description: 'More active task slots',           maxLevel: 3, levelCosts: [80, 350, 900],  levelEffects: [2, 4, 7],           effectLabel: 'active tasks' },
  'rapid-intel':      { id: 'rapid-intel',      name: 'Rapid Intel',      icon: '\u{1F4E1}', description: 'Faster mission board refresh',     maxLevel: 3, levelCosts: [60, 250, 650],  levelEffects: [0.65, 0.40, 0.20],  effectLabel: '\u00D7 refresh' },
  'hire-discount':    { id: 'hire-discount',    name: 'Hire Discount',    icon: '\u{1F4B0}', description: 'Reduced minion hiring cost',       maxLevel: 3, levelCosts: [75, 300, 750],  levelEffects: [0.20, 0.40, 0.60],  effectLabel: '% discount' },
  'dept-funding':     { id: 'dept-funding',     name: 'Dept Funding',     icon: '\u{1F393}', description: 'Increased department XP gain',     maxLevel: 3, levelCosts: [75, 300, 750],  levelEffects: [0.50, 1.20, 2.50],  effectLabel: '% bonus XP' },
};

export const ALL_VOUCHER_IDS: VoucherId[] = [
  'iron-fingers', 'board-expansion', 'operations-desk',
  'rapid-intel', 'hire-discount', 'dept-funding',
];

export function createEmptyVoucherLevels(): Record<VoucherId, number> {
  return {
    'iron-fingers': 0, 'board-expansion': 0, 'operations-desk': 0,
    'rapid-intel': 0, 'hire-discount': 0, 'dept-funding': 0,
  };
}

/** Get the gold cost to upgrade a voucher to the given target level (1-indexed). */
export function getVoucherCost(id: VoucherId, targetLevel: number): number {
  const def = VOUCHERS[id];
  if (targetLevel < 1 || targetLevel > def.maxLevel) return 0;
  return def.levelCosts[targetLevel - 1];
}

/** Get the cumulative effect value for a voucher at the given current level (0 = not owned). */
export function getVoucherEffect(id: VoucherId, currentLevel: number): number {
  if (currentLevel <= 0) return 0;
  const def = VOUCHERS[id];
  const clamped = Math.min(currentLevel, def.maxLevel);
  return def.levelEffects[clamped - 1];
}
