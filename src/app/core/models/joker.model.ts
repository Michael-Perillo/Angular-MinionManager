import { TaskCategory } from './task.model';
import { CardRarity } from './card.model';

// ─── Joker types ─────────────────────────

export type JokerId = string;
export type JokerRarity = CardRarity;

export type JokerEffectType =
  | 'gold-mult' | 'gold-flat' | 'click-power' | 'xp-mult'
  | 'dept-xp-mult' | 'speed-mult' | 'click-reduction';

export interface JokerCondition {
  type: 'none' | 'department' | 'specialty-match';
  value?: TaskCategory;
}

export interface JokerDefinition {
  id: JokerId;
  name: string;
  description: string;
  icon: string;
  rarity: JokerRarity;
  effectType: JokerEffectType;
  effectValue: number;
  condition: JokerCondition;
}

export const MAX_JOKER_SLOTS = 5;

// ─── Joker pool ──────────────────────────

export const JOKER_POOL: Record<JokerId, JokerDefinition> = {
  'gold-rush': {
    id: 'gold-rush', name: 'Gold Rush', icon: '🤑', rarity: 'common',
    description: '+20% gold from all tasks',
    effectType: 'gold-mult', effectValue: 1.2, condition: { type: 'none' },
  },
  'deep-pockets': {
    id: 'deep-pockets', name: 'Deep Pockets', icon: '👛', rarity: 'common',
    description: '+3 flat gold per task',
    effectType: 'gold-flat', effectValue: 3, condition: { type: 'none' },
  },
  'iron-fist': {
    id: 'iron-fist', name: 'Iron Fist', icon: '👊', rarity: 'common',
    description: '+2 click power',
    effectType: 'click-power', effectValue: 2, condition: { type: 'none' },
  },
  'quick-study': {
    id: 'quick-study', name: 'Quick Study', icon: '📚', rarity: 'uncommon',
    description: '+30% minion XP from tasks',
    effectType: 'xp-mult', effectValue: 1.3, condition: { type: 'none' },
  },
  'heist-expert': {
    id: 'heist-expert', name: 'Heist Expert', icon: '💎', rarity: 'uncommon',
    description: '+50% gold from Heists tasks',
    effectType: 'gold-mult', effectValue: 1.5, condition: { type: 'department', value: 'heists' },
  },
  'research-grant': {
    id: 'research-grant', name: 'Research Grant', icon: '🔬', rarity: 'uncommon',
    description: '+50% department XP for Research',
    effectType: 'dept-xp-mult', effectValue: 1.5, condition: { type: 'department', value: 'research' },
  },
  'speed-demon': {
    id: 'speed-demon', name: 'Speed Demon', icon: '⚡', rarity: 'rare',
    description: '+25% minion work speed',
    effectType: 'speed-mult', effectValue: 1.25, condition: { type: 'none' },
  },
  'bargain-hunter': {
    id: 'bargain-hunter', name: 'Bargain Hunter', icon: '🏷️', rarity: 'rare',
    description: '-15% clicks required for tasks',
    effectType: 'click-reduction', effectValue: 0.15, condition: { type: 'none' },
  },
  'lucky-break': {
    id: 'lucky-break', name: 'Lucky Break', icon: '🍀', rarity: 'rare',
    description: '+35% gold when specialty matches',
    effectType: 'gold-mult', effectValue: 1.35, condition: { type: 'specialty-match' },
  },
  'overachiever': {
    id: 'overachiever', name: 'Overachiever', icon: '🏆', rarity: 'legendary',
    description: '+50% gold when specialty matches',
    effectType: 'gold-mult', effectValue: 1.5, condition: { type: 'specialty-match' },
  },
};

export const ALL_JOKER_IDS: JokerId[] = Object.keys(JOKER_POOL);

// ─── Helpers ─────────────────────────────

export function getJoker(id: JokerId): JokerDefinition | undefined {
  return JOKER_POOL[id];
}

export function getJokersByRarity(rarity: JokerRarity): JokerDefinition[] {
  return ALL_JOKER_IDS.map(id => JOKER_POOL[id]).filter(j => j.rarity === rarity);
}

/** Context for evaluating joker conditions */
export interface JokerContext {
  department?: TaskCategory;
  minionSpecialty?: TaskCategory;
  taskCategory?: TaskCategory;
}

/** Check if a joker's condition is met given a context */
export function isJokerConditionMet(joker: JokerDefinition, context: JokerContext): boolean {
  switch (joker.condition.type) {
    case 'none':
      return true;
    case 'department':
      return context.department === joker.condition.value ||
             context.taskCategory === joker.condition.value;
    case 'specialty-match':
      return context.minionSpecialty !== undefined &&
             context.taskCategory !== undefined &&
             context.minionSpecialty === context.taskCategory;
    default:
      return false;
  }
}

/** Aggregate a multiplicative joker effect across equipped jokers */
export function aggregateJokerMult(
  equippedIds: JokerId[],
  effectType: JokerEffectType,
  context: JokerContext,
): number {
  let mult = 1;
  for (const id of equippedIds) {
    const joker = JOKER_POOL[id];
    if (!joker || joker.effectType !== effectType) continue;
    if (!isJokerConditionMet(joker, context)) continue;
    mult *= joker.effectValue;
  }
  return mult;
}

/** Aggregate an additive joker effect across equipped jokers */
export function aggregateJokerFlat(
  equippedIds: JokerId[],
  effectType: JokerEffectType,
  context: JokerContext,
): number {
  let total = 0;
  for (const id of equippedIds) {
    const joker = JOKER_POOL[id];
    if (!joker || joker.effectType !== effectType) continue;
    if (!isJokerConditionMet(joker, context)) continue;
    total += joker.effectValue;
  }
  return total;
}
