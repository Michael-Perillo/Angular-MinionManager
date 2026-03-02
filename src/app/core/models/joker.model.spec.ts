import {
  JOKER_POOL, ALL_JOKER_IDS, MAX_JOKER_SLOTS,
  getJoker, getJokersByRarity,
  isJokerConditionMet, aggregateJokerMult, aggregateJokerFlat,
  JokerContext,
} from './joker.model';

describe('Joker Model', () => {
  describe('JOKER_POOL', () => {
    it('should define exactly 10 starter jokers', () => {
      expect(ALL_JOKER_IDS.length).toBe(10);
      expect(Object.keys(JOKER_POOL).length).toBe(10);
    });

    it('each joker has required fields', () => {
      for (const id of ALL_JOKER_IDS) {
        const j = JOKER_POOL[id];
        expect(j.id).toBe(id);
        expect(j.name).toBeTruthy();
        expect(j.description).toBeTruthy();
        expect(j.icon).toBeTruthy();
        expect(j.effectType).toBeTruthy();
        expect(j.effectValue).toBeGreaterThan(0);
        expect(j.condition).toBeTruthy();
        expect(['common', 'uncommon', 'rare', 'legendary']).toContain(j.rarity);
      }
    });

    it('MAX_JOKER_SLOTS is 5', () => {
      expect(MAX_JOKER_SLOTS).toBe(5);
    });
  });

  describe('getJoker', () => {
    it('returns joker for valid ID', () => {
      expect(getJoker('gold-rush')?.name).toBe('Gold Rush');
    });

    it('returns undefined for invalid ID', () => {
      expect(getJoker('nonexistent')).toBeUndefined();
    });
  });

  describe('getJokersByRarity', () => {
    it('returns common jokers', () => {
      const common = getJokersByRarity('common');
      expect(common.length).toBe(3);
      for (const j of common) {
        expect(j.rarity).toBe('common');
      }
    });

    it('returns uncommon jokers', () => {
      const uncommon = getJokersByRarity('uncommon');
      expect(uncommon.length).toBe(3);
    });

    it('returns rare jokers', () => {
      const rare = getJokersByRarity('rare');
      expect(rare.length).toBe(3);
    });

    it('returns legendary jokers', () => {
      const legendary = getJokersByRarity('legendary');
      expect(legendary.length).toBe(1);
    });
  });

  describe('isJokerConditionMet', () => {
    it('none condition always met', () => {
      const joker = JOKER_POOL['gold-rush'];
      expect(isJokerConditionMet(joker, {})).toBe(true);
    });

    it('department condition met when department matches', () => {
      const joker = JOKER_POOL['heist-expert'];
      expect(isJokerConditionMet(joker, { department: 'heists' })).toBe(true);
      expect(isJokerConditionMet(joker, { taskCategory: 'heists' })).toBe(true);
    });

    it('department condition not met when department differs', () => {
      const joker = JOKER_POOL['heist-expert'];
      expect(isJokerConditionMet(joker, { department: 'schemes' })).toBe(false);
    });

    it('specialty-match condition met when minion matches task', () => {
      const joker = JOKER_POOL['lucky-break'];
      expect(isJokerConditionMet(joker, { minionSpecialty: 'heists', taskCategory: 'heists' })).toBe(true);
    });

    it('specialty-match condition not met when no match', () => {
      const joker = JOKER_POOL['lucky-break'];
      expect(isJokerConditionMet(joker, { minionSpecialty: 'heists', taskCategory: 'schemes' })).toBe(false);
    });

    it('specialty-match condition not met when missing context', () => {
      const joker = JOKER_POOL['lucky-break'];
      expect(isJokerConditionMet(joker, {})).toBe(false);
      expect(isJokerConditionMet(joker, { minionSpecialty: 'heists' })).toBe(false);
    });
  });

  describe('aggregateJokerMult', () => {
    it('returns 1 when no jokers equipped', () => {
      expect(aggregateJokerMult([], 'gold-mult', {})).toBe(1);
    });

    it('returns single joker multiplier', () => {
      expect(aggregateJokerMult(['gold-rush'], 'gold-mult', {})).toBe(1.2);
    });

    it('multiplies multiple gold-mult jokers', () => {
      const result = aggregateJokerMult(['gold-rush', 'overachiever'], 'gold-mult', {
        minionSpecialty: 'heists', taskCategory: 'heists',
      });
      expect(result).toBeCloseTo(1.2 * 1.5, 5);
    });

    it('skips jokers with unmet conditions', () => {
      const result = aggregateJokerMult(['gold-rush', 'overachiever'], 'gold-mult', {
        minionSpecialty: 'heists', taskCategory: 'schemes',
      });
      // overachiever requires specialty match, which fails
      expect(result).toBeCloseTo(1.2, 5);
    });

    it('skips jokers with wrong effect type', () => {
      expect(aggregateJokerMult(['iron-fist'], 'gold-mult', {})).toBe(1);
    });
  });

  describe('aggregateJokerFlat', () => {
    it('returns 0 when no jokers equipped', () => {
      expect(aggregateJokerFlat([], 'gold-flat', {})).toBe(0);
    });

    it('returns single joker flat value', () => {
      expect(aggregateJokerFlat(['deep-pockets'], 'gold-flat', {})).toBe(3);
    });

    it('sums multiple flat values', () => {
      expect(aggregateJokerFlat(['iron-fist'], 'click-power', {})).toBe(2);
    });

    it('skips jokers with wrong effect type', () => {
      expect(aggregateJokerFlat(['gold-rush'], 'gold-flat', {})).toBe(0);
    });
  });
});
