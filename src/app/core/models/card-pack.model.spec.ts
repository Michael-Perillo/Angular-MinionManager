import {
  PACK_DEFINITIONS, QUARTERLY_PACK_CONFIG, PackType,
  generatePackContents, getPackPickCount, PackItem,
} from './card-pack.model';
import { ALL_CARD_IDS } from './card.model';
import { ALL_JOKER_IDS } from './joker.model';

describe('Card Pack Model', () => {
  describe('PACK_DEFINITIONS', () => {
    it('defines 3 pack types', () => {
      expect(Object.keys(PACK_DEFINITIONS).length).toBe(3);
    });

    it('quarterly-reward costs 0 gold', () => {
      expect(PACK_DEFINITIONS['quarterly-reward'].goldCost).toBe(0);
    });

    it('shop-standard costs 150 gold', () => {
      expect(PACK_DEFINITIONS['shop-standard'].goldCost).toBe(150);
    });

    it('shop-premium costs 350 gold', () => {
      expect(PACK_DEFINITIONS['shop-premium'].goldCost).toBe(350);
    });

    it('each pack has rarity weights that sum to 100', () => {
      for (const type of Object.keys(PACK_DEFINITIONS) as PackType[]) {
        const weights = PACK_DEFINITIONS[type].rarityWeights;
        const total = weights.common + weights.uncommon + weights.rare + weights.legendary;
        expect(total).toBe(100);
      }
    });
  });

  describe('QUARTERLY_PACK_CONFIG', () => {
    it('Q1 shows 3 cards, pick 1', () => {
      expect(QUARTERLY_PACK_CONFIG[1]).toEqual({ totalShown: 3, pickCount: 1 });
    });

    it('Q3 shows 5 cards, pick 2', () => {
      expect(QUARTERLY_PACK_CONFIG[3]).toEqual({ totalShown: 5, pickCount: 2 });
    });
  });

  describe('generatePackContents', () => {
    const emptyOwned = new Set<string>();
    let callCount: number;
    const seededRng = () => {
      callCount++;
      // Deterministic sequence: 0.1, 0.3, 0.5, 0.7, 0.9, ...
      return ((callCount * 2 - 1) % 10) / 10;
    };

    beforeEach(() => {
      callCount = 0;
    });

    it('returns correct number of items for standard pack', () => {
      const items = generatePackContents('shop-standard', emptyOwned, emptyOwned, undefined, seededRng);
      expect(items.length).toBe(3);
    });

    it('returns correct number of items for premium pack', () => {
      const items = generatePackContents('shop-premium', emptyOwned, emptyOwned, undefined, seededRng);
      expect(items.length).toBe(5);
    });

    it('applies quarterly overrides for reward packs', () => {
      const q1Items = generatePackContents('quarterly-reward', emptyOwned, emptyOwned, 1, seededRng);
      expect(q1Items.length).toBe(3);

      callCount = 0;
      const q3Items = generatePackContents('quarterly-reward', emptyOwned, emptyOwned, 3, seededRng);
      expect(q3Items.length).toBe(5);
    });

    it('returns items with _itemType tag', () => {
      const items = generatePackContents('shop-standard', emptyOwned, emptyOwned, undefined, seededRng);
      for (const item of items) {
        expect(['card', 'joker']).toContain(item._itemType);
      }
    });

    it('does not duplicate items in a single pack', () => {
      const items = generatePackContents('shop-premium', emptyOwned, emptyOwned, undefined, seededRng);
      const ids = items.map(i => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('items come from the card or joker pools', () => {
      const allIds = new Set([...ALL_CARD_IDS, ...ALL_JOKER_IDS]);
      const items = generatePackContents('shop-premium', emptyOwned, emptyOwned, undefined, seededRng);
      for (const item of items) {
        expect(allIds.has(item.id)).toBe(true);
      }
    });
  });

  describe('getPackPickCount', () => {
    it('returns base pick count for shop packs', () => {
      expect(getPackPickCount('shop-standard')).toBe(1);
      expect(getPackPickCount('shop-premium')).toBe(2);
    });

    it('returns quarterly override for reward packs', () => {
      expect(getPackPickCount('quarterly-reward', 1)).toBe(1);
      expect(getPackPickCount('quarterly-reward', 3)).toBe(2);
    });

    it('returns base pick count if no quarter specified', () => {
      expect(getPackPickCount('quarterly-reward')).toBe(1);
    });
  });
});
