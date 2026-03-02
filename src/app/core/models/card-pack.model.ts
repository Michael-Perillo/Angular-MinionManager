import { CardRarity, CardId, ALL_CARD_IDS, CARD_POOL, AnyCard } from './card.model';
import { JokerId, ALL_JOKER_IDS, JOKER_POOL, JokerDefinition } from './joker.model';

// ─── Pack types ──────────────────────────

export type PackType = 'quarterly-reward' | 'shop-standard' | 'shop-premium';

export interface PackDefinition {
  id: PackType;
  name: string;
  icon: string;
  goldCost: number;
  totalShown: number;
  pickCount: number;
  rarityWeights: Record<CardRarity, number>;
}

export const PACK_DEFINITIONS: Record<PackType, PackDefinition> = {
  'quarterly-reward': {
    id: 'quarterly-reward', name: 'Quarterly Bonus', icon: '🎁',
    goldCost: 0, totalShown: 4, pickCount: 1,
    rarityWeights: { common: 50, uncommon: 35, rare: 12, legendary: 3 },
  },
  'shop-standard': {
    id: 'shop-standard', name: 'Standard Pack', icon: '📦',
    goldCost: 150, totalShown: 3, pickCount: 1,
    rarityWeights: { common: 55, uncommon: 30, rare: 12, legendary: 3 },
  },
  'shop-premium': {
    id: 'shop-premium', name: 'Premium Pack', icon: '💫',
    goldCost: 350, totalShown: 5, pickCount: 2,
    rarityWeights: { common: 40, uncommon: 35, rare: 18, legendary: 7 },
  },
};

/** Quarter-specific overrides for quarterly reward packs */
export const QUARTERLY_PACK_CONFIG: Record<1 | 2 | 3 | 4, { totalShown: number; pickCount: number }> = {
  1: { totalShown: 3, pickCount: 1 },
  2: { totalShown: 4, pickCount: 1 },
  3: { totalShown: 5, pickCount: 2 },
  4: { totalShown: 5, pickCount: 2 },
};

// ─── Pack generation ─────────────────────

export type PackItem = (AnyCard | JokerDefinition) & { _itemType: 'card' | 'joker' };

/**
 * Generate pack contents: draws from mixed card + joker pool weighted by rarity.
 * Prefers unowned items. Returns items tagged with _itemType for identification.
 */
export function generatePackContents(
  packType: PackType,
  ownedCardIds: Set<CardId>,
  ownedJokerIds: Set<JokerId>,
  quarter?: 1 | 2 | 3 | 4,
  rng?: () => number,
): PackItem[] {
  const def = PACK_DEFINITIONS[packType];
  let totalShown = def.totalShown;
  let pickCount = def.pickCount;

  // Apply quarterly overrides for reward packs
  if (packType === 'quarterly-reward' && quarter) {
    const config = QUARTERLY_PACK_CONFIG[quarter];
    totalShown = config.totalShown;
    pickCount = config.pickCount;
  }

  const random = rng ?? Math.random;

  // Build the combined pool of cards + jokers
  const allItems: { item: PackItem; rarity: CardRarity; owned: boolean }[] = [];

  for (const id of ALL_CARD_IDS) {
    const card = CARD_POOL[id];
    allItems.push({
      item: { ...card, _itemType: 'card' as const },
      rarity: card.rarity,
      owned: ownedCardIds.has(id),
    });
  }

  for (const id of ALL_JOKER_IDS) {
    const joker = JOKER_POOL[id];
    allItems.push({
      item: { ...joker, _itemType: 'joker' as const },
      rarity: joker.rarity,
      owned: ownedJokerIds.has(id),
    });
  }

  // Prefer unowned items (3x weight bonus)
  const weights = def.rarityWeights;
  const weighted = allItems.map(entry => ({
    ...entry,
    weight: weights[entry.rarity] * (entry.owned ? 1 : 3),
  }));

  const selected: PackItem[] = [];
  const selectedIds = new Set<string>();

  for (let i = 0; i < totalShown; i++) {
    // Filter out already-selected items
    const available = weighted.filter(e => !selectedIds.has(e.item.id));
    if (available.length === 0) break;

    const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
    let roll = random() * totalWeight;

    for (const entry of available) {
      roll -= entry.weight;
      if (roll <= 0) {
        selected.push(entry.item);
        selectedIds.add(entry.item.id);
        break;
      }
    }

    // Edge case: if roll didn't hit (floating point), pick last available
    if (!selectedIds.has([...available].pop()?.item.id ?? '') && selected.length === i) {
      const last = available[available.length - 1];
      selected.push(last.item);
      selectedIds.add(last.item.id);
    }
  }

  return selected;
}

/** Get the pick count for a pack (accounting for quarterly overrides) */
export function getPackPickCount(
  packType: PackType,
  quarter?: 1 | 2 | 3 | 4,
): number {
  if (packType === 'quarterly-reward' && quarter) {
    return QUARTERLY_PACK_CONFIG[quarter].pickCount;
  }
  return PACK_DEFINITIONS[packType].pickCount;
}
