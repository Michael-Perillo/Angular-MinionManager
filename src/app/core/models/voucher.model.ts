export type VoucherId = 'iron-fingers' | 'board-expansion' | 'operations-desk' |
                        'hire-discount' | 'dismissal-expert' |
                        'unlock-heists' | 'unlock-research' | 'unlock-mayhem';

export interface VoucherDefinition {
  id: VoucherId;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  levelCosts: number[];
  levelEffects: number[];
  effectLabel: string;
}

export const VOUCHERS: Record<VoucherId, VoucherDefinition> = {
  // ─── Department unlocks (single-level) ──────
  'unlock-heists':    { id: 'unlock-heists',    name: 'Heists Dept',    icon: '💎', description: 'Unlock the Heists department',    maxLevel: 1, levelCosts: [60],  levelEffects: [1], effectLabel: 'unlocked' },
  'unlock-research':  { id: 'unlock-research',  name: 'Research Dept',  icon: '🧪', description: 'Unlock the Research department',  maxLevel: 1, levelCosts: [65],  levelEffects: [1], effectLabel: 'unlocked' },
  'unlock-mayhem':    { id: 'unlock-mayhem',    name: 'Mayhem Dept',    icon: '💥', description: 'Unlock the Mayhem department',    maxLevel: 1, levelCosts: [75],  levelEffects: [1], effectLabel: 'unlocked' },
  // ─── Upgrades (multi-level) ─────────────────
  'iron-fingers':     { id: 'iron-fingers',     name: 'Iron Fingers',     icon: '👊', description: 'Increased click power',           maxLevel: 3, levelCosts: [40, 200, 600],  levelEffects: [2, 5, 12],          effectLabel: 'click power' },
  'board-expansion':  { id: 'board-expansion',  name: 'Board Expansion',  icon: '📋', description: 'More mission board slots',        maxLevel: 3, levelCosts: [60, 250, 650],  levelEffects: [3, 7, 12],          effectLabel: 'board slots' },
  'operations-desk':  { id: 'operations-desk',  name: 'Operations Desk',  icon: '🗂️', description: 'More queue capacity per department', maxLevel: 3, levelCosts: [80, 350, 900],  levelEffects: [2, 4, 7],           effectLabel: 'queue slots/dept' },
  'hire-discount':    { id: 'hire-discount',    name: 'Hire Discount',    icon: '💰', description: 'Reduced minion hiring cost',       maxLevel: 3, levelCosts: [75, 300, 750],  levelEffects: [0.20, 0.40, 0.60],  effectLabel: '% discount' },
  'dismissal-expert': { id: 'dismissal-expert', name: 'Dismissal Expert', icon: '✂️', description: 'Extra scheme dismissals per quarter', maxLevel: 3, levelCosts: [100, 400, 1000], levelEffects: [2, 5, 10],          effectLabel: 'dismissals' },
};

/** Department unlock voucher IDs */
export const UNLOCK_VOUCHER_IDS: VoucherId[] = [
  'unlock-heists', 'unlock-research', 'unlock-mayhem',
];

/** Upgrade voucher IDs (multi-level) */
export const UPGRADE_VOUCHER_IDS: VoucherId[] = [
  'iron-fingers', 'board-expansion', 'operations-desk',
  'hire-discount', 'dismissal-expert',
];

export const ALL_VOUCHER_IDS: VoucherId[] = [
  ...UNLOCK_VOUCHER_IDS,
  ...UPGRADE_VOUCHER_IDS,
];

export function createEmptyVoucherLevels(): Record<VoucherId, number> {
  const levels = {} as Record<VoucherId, number>;
  for (const id of ALL_VOUCHER_IDS) {
    levels[id] = 0;
  }
  return levels;
}

/** Get the gold cost to upgrade a voucher to the given target level (1-indexed).
 *  Costs multiply by year number for year-scaling. */
export function getVoucherCost(id: VoucherId, targetLevel: number, year: number = 1): number {
  const def = VOUCHERS[id];
  if (targetLevel < 1 || targetLevel > def.maxLevel) return 0;
  return def.levelCosts[targetLevel - 1] * year;
}

/** Get the cumulative effect value for a voucher at the given current level (0 = not owned). */
export function getVoucherEffect(id: VoucherId, currentLevel: number): number {
  if (currentLevel <= 0) return 0;
  const def = VOUCHERS[id];
  const clamped = Math.min(currentLevel, def.maxLevel);
  return def.levelEffects[clamped - 1];
}

/** Select 3 random upgrade vouchers for a shop visit (seeded by year+quarter) */
export function getShopVoucherSelection(year: number, quarter: number): VoucherId[] {
  // Simple deterministic selection based on year+quarter seed
  const seed = year * 10 + quarter;
  const shuffled = [...UPGRADE_VOUCHER_IDS];
  // Fisher-Yates with seeded pseudo-random
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = ((seed * (i + 1) * 7 + 13) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}
