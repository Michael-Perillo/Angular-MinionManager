import { TaskCategory } from './task.model';

// ─── Archetype types ──────────────────────

export type MinionRole = 'worker' | 'manager';
export type MinionRarity = 'common' | 'uncommon' | 'rare';

export type PassiveEffectType =
  | 'gold-mult' | 'gold-flat' | 'click-power' | 'speed-mult'
  | 'dept-xp-mult' | 'click-reduction' | 'combo-threshold' | 'breakthrough-bonus'
  | 'heist-floor' | 'dismiss-bonus' | 'op-count-bonus';

export type PassiveScope = 'any' | TaskCategory;

export interface PassiveEffect {
  effectType: PassiveEffectType;
  effectValue: number;
  scope: PassiveScope;
}

export interface MinionArchetype {
  id: string;
  name: string;
  icon: string;
  color: string;
  rarity: MinionRarity;
  passive: PassiveEffect;
  description: string;
}

// ─── Minion interface (simplified) ──────────

export interface Minion {
  id: string;
  archetypeId: string;
  role: MinionRole;
  status: 'idle' | 'working';
  assignedTaskId: string | null;
  assignedDepartment: TaskCategory | null;
}

// ─── Archetype pool (18 archetypes) ──────────

export const MINION_ARCHETYPES: Record<string, MinionArchetype> = {
  // Common (8) — any department
  'penny-pincher': {
    id: 'penny-pincher', name: 'Penny Pincher', icon: '🤑', color: '#2e7d32',
    rarity: 'common',
    passive: { effectType: 'gold-mult', effectValue: 1, scope: 'any' },
    description: '+1 mult',
  },
  'tip-jar': {
    id: 'tip-jar', name: 'Tip Jar', icon: '🪙', color: '#b9770e',
    rarity: 'common',
    passive: { effectType: 'gold-flat', effectValue: 1, scope: 'any' },
    description: '+1 flat gold/task',
  },
  'iron-grip': {
    id: 'iron-grip', name: 'Iron Grip', icon: '👊', color: '#5d4037',
    rarity: 'common',
    passive: { effectType: 'click-power', effectValue: 2, scope: 'any' },
    description: '+2 click power',
  },
  'drill-sergeant': {
    id: 'drill-sergeant', name: 'Drill Sergeant', icon: '📚', color: '#1565c0',
    rarity: 'common',
    passive: { effectType: 'dept-xp-mult', effectValue: 1.3, scope: 'any' },
    description: '1.3× dept XP',
  },
  'taskmaster': {
    id: 'taskmaster', name: 'Taskmaster', icon: '⚡', color: '#f9a825',
    rarity: 'common',
    passive: { effectType: 'speed-mult', effectValue: 1.2, scope: 'any' },
    description: '1.2× worker speed',
  },
  'corner-cutter': {
    id: 'corner-cutter', name: 'Corner Cutter', icon: '✂️', color: '#6a1b9a',
    rarity: 'common',
    passive: { effectType: 'click-reduction', effectValue: 2, scope: 'any' },
    description: '-2 clicks on tasks',
  },
  'dept-mentor': {
    id: 'dept-mentor', name: 'Dept Mentor', icon: '🎓', color: '#00695c',
    rarity: 'common',
    passive: { effectType: 'dept-xp-mult', effectValue: 1.4, scope: 'any' },
    description: '1.4× dept XP',
  },
  'double-dipper': {
    id: 'double-dipper', name: 'Double Dipper', icon: '💰', color: '#e65100',
    rarity: 'common',
    passive: { effectType: 'gold-flat', effectValue: 2, scope: 'any' },
    description: '+2 flat gold/task',
  },

  // Uncommon (6) — department-specific
  'vault-cracker': {
    id: 'vault-cracker', name: 'Vault Cracker', icon: '💎', color: '#1a5276',
    rarity: 'uncommon',
    passive: { effectType: 'gold-mult', effectValue: 2, scope: 'heists' },
    description: '+2 mult (Heists)',
  },
  'lab-rat': {
    id: 'lab-rat', name: 'Lab Rat', icon: '🧪', color: '#4a148c',
    rarity: 'uncommon',
    passive: { effectType: 'dept-xp-mult', effectValue: 1.8, scope: 'research' },
    description: '1.8× Research XP',
  },
  'demolitions-expert': {
    id: 'demolitions-expert', name: 'Demolitions Expert', icon: '💥', color: '#b71c1c',
    rarity: 'uncommon',
    passive: { effectType: 'combo-threshold', effectValue: -1, scope: 'mayhem' },
    description: 'Combo needs 2 not 3',
  },
  'scheme-architect': {
    id: 'scheme-architect', name: 'Scheme Architect', icon: '🗝️', color: '#37474f',
    rarity: 'uncommon',
    passive: { effectType: 'click-reduction', effectValue: 3, scope: 'schemes' },
    description: '-3 clicks (Schemes)',
  },
  'safe-hands': {
    id: 'safe-hands', name: 'Safe Hands', icon: '🎲', color: '#0d47a1',
    rarity: 'uncommon',
    passive: { effectType: 'heist-floor', effectValue: 25, scope: 'heists' },
    description: '+25% heist gold floor',
  },
  'eureka-catalyst': {
    id: 'eureka-catalyst', name: 'Eureka Catalyst', icon: '⚗️', color: '#7b1fa2',
    rarity: 'uncommon',
    passive: { effectType: 'breakthrough-bonus', effectValue: 1, scope: 'research' },
    description: '+1 mult/breakthrough',
  },

  // Rare (4) — any department, powerful
  'golden-touch': {
    id: 'golden-touch', name: 'Golden Touch', icon: '🏆', color: '#ff8f00',
    rarity: 'rare',
    passive: { effectType: 'gold-mult', effectValue: 2, scope: 'any' },
    description: '+2 mult (all depts)',
  },
  'overdriver': {
    id: 'overdriver', name: 'Overdriver', icon: '🔥', color: '#d32f2f',
    rarity: 'rare',
    passive: { effectType: 'speed-mult', effectValue: 1.4, scope: 'any' },
    description: '1.4× worker speed',
  },
  'ops-coordinator': {
    id: 'ops-coordinator', name: 'Ops Coordinator', icon: '📋', color: '#1b5e20',
    rarity: 'rare',
    passive: { effectType: 'op-count-bonus', effectValue: 0.3, scope: 'any' },
    description: '30% chance extra op',
  },
  'paper-shredder': {
    id: 'paper-shredder', name: 'Paper Shredder', icon: '📄', color: '#424242',
    rarity: 'rare',
    passive: { effectType: 'dismiss-bonus', effectValue: 2, scope: 'any' },
    description: '+2 dismissals/quarter',
  },
};

export const ALL_ARCHETYPE_IDS = Object.keys(MINION_ARCHETYPES);

/** Get an archetype definition by ID */
export function getArchetype(id: string): MinionArchetype | undefined {
  return MINION_ARCHETYPES[id];
}

/** Get the display name/icon/color for a minion (convenience) */
export function getMinionDisplay(minion: Minion): MinionArchetype {
  return MINION_ARCHETYPES[minion.archetypeId] ?? MINION_ARCHETYPES['penny-pincher'];
}

// ─── Hire draft system ──────────────────────

const RARITY_WEIGHTS: Record<MinionRarity, number> = {
  common: 55,
  uncommon: 32,
  rare: 13,
};

/** Roll N random archetype IDs weighted by rarity */
export function rollHireOptions(count: number, rng?: () => number): string[] {
  const random = rng ?? Math.random;
  const byRarity: Record<MinionRarity, string[]> = { common: [], uncommon: [], rare: [] };
  for (const [id, arch] of Object.entries(MINION_ARCHETYPES)) {
    byRarity[arch.rarity].push(id);
  }

  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    // Pick rarity
    const totalWeight = RARITY_WEIGHTS.common + RARITY_WEIGHTS.uncommon + RARITY_WEIGHTS.rare;
    let roll = random() * totalWeight;
    let rarity: MinionRarity = 'common';
    if (roll < RARITY_WEIGHTS.common) {
      rarity = 'common';
    } else if (roll < RARITY_WEIGHTS.common + RARITY_WEIGHTS.uncommon) {
      rarity = 'uncommon';
    } else {
      rarity = 'rare';
    }

    // Pick random archetype of that rarity
    const pool = byRarity[rarity];
    const idx = Math.floor(random() * pool.length);
    results.push(pool[idx]);
  }
  return results;
}

// ─── Passive aggregation ──────────────────────

export interface ActivePassiveContext {
  department: TaskCategory;
  minionId?: string;  // For worker-only passives (only their own tasks)
}

/**
 * Get active passives for a department from all minions.
 * Manager passives apply to all tasks in the dept.
 * Worker passives only apply to their own tasks (filter by minionId).
 */
export function getActivePassives(
  minions: Minion[],
  department: TaskCategory,
  minionId?: string,
): MinionArchetype[] {
  const archetypes: MinionArchetype[] = [];

  for (const m of minions) {
    if (m.assignedDepartment !== department) continue;

    const arch = MINION_ARCHETYPES[m.archetypeId];
    if (!arch) continue;

    // Check scope match
    if (arch.passive.scope !== 'any' && arch.passive.scope !== department) continue;

    if (m.role === 'manager') {
      // Manager passive applies to all tasks in dept
      archetypes.push(arch);
    } else if (m.role === 'worker' && minionId && m.id === minionId) {
      // Worker passive only applies to tasks they complete
      archetypes.push(arch);
    }
  }

  return archetypes;
}

/** Sum additive passives of a given type */
export function aggregatePassiveFlat(archetypes: MinionArchetype[], effectType: PassiveEffectType): number {
  let total = 0;
  for (const arch of archetypes) {
    if (arch.passive.effectType === effectType) {
      total += arch.passive.effectValue;
    }
  }
  return total;
}

/** Multiply multiplicative passives of a given type */
export function aggregatePassiveMult(archetypes: MinionArchetype[], effectType: PassiveEffectType): number {
  let mult = 1;
  for (const arch of archetypes) {
    if (arch.passive.effectType === effectType) {
      mult *= arch.passive.effectValue;
    }
  }
  return mult;
}

/** Get rarity display color class */
export function getRarityColor(rarity: MinionRarity): string {
  switch (rarity) {
    case 'common': return 'text-green-400';
    case 'uncommon': return 'text-purple-400';
    case 'rare': return 'text-gold';
  }
}

/** Get rarity border color class */
export function getRarityBorderColor(rarity: MinionRarity): string {
  switch (rarity) {
    case 'common': return 'border-green-500/40';
    case 'uncommon': return 'border-purple-500/40';
    case 'rare': return 'border-gold/40';
  }
}
