import {
  VOUCHERS, ALL_VOUCHER_IDS, VoucherId,
  getVoucherCost, getVoucherEffect, createEmptyVoucherLevels,
} from './voucher.model';

describe('Voucher Model', () => {
  describe('VOUCHERS', () => {
    it('should define exactly 7 vouchers', () => {
      expect(ALL_VOUCHER_IDS.length).toBe(7);
      expect(Object.keys(VOUCHERS).length).toBe(7);
    });

    it('each voucher has maxLevel 3', () => {
      for (const id of ALL_VOUCHER_IDS) {
        expect(VOUCHERS[id].maxLevel).toBe(3);
      }
    });

    it('each voucher has 3 level costs and 3 level effects', () => {
      for (const id of ALL_VOUCHER_IDS) {
        const def = VOUCHERS[id];
        expect(def.levelCosts.length).toBe(3);
        expect(def.levelEffects.length).toBe(3);
      }
    });

    it('level costs should increase monotonically', () => {
      for (const id of ALL_VOUCHER_IDS) {
        const costs = VOUCHERS[id].levelCosts;
        expect(costs[0]).toBeLessThan(costs[1]);
        expect(costs[1]).toBeLessThan(costs[2]);
      }
    });

    it('each voucher has required fields', () => {
      for (const id of ALL_VOUCHER_IDS) {
        const def = VOUCHERS[id];
        expect(def.id).toBe(id);
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(def.icon).toBeTruthy();
        expect(def.effectLabel).toBeTruthy();
      }
    });
  });

  describe('createEmptyVoucherLevels', () => {
    it('should return all vouchers at level 0', () => {
      const levels = createEmptyVoucherLevels();
      for (const id of ALL_VOUCHER_IDS) {
        expect(levels[id]).toBe(0);
      }
    });
  });

  describe('getVoucherCost', () => {
    it('returns correct cost for each level', () => {
      expect(getVoucherCost('iron-fingers', 1)).toBe(40);
      expect(getVoucherCost('iron-fingers', 2)).toBe(200);
      expect(getVoucherCost('iron-fingers', 3)).toBe(600);
    });

    it('returns 0 for level 0 (invalid)', () => {
      expect(getVoucherCost('iron-fingers', 0)).toBe(0);
    });

    it('returns 0 for level beyond max', () => {
      expect(getVoucherCost('iron-fingers', 4)).toBe(0);
    });

    it('returns correct costs for all vouchers at level 1', () => {
      expect(getVoucherCost('board-expansion', 1)).toBe(60);
      expect(getVoucherCost('operations-desk', 1)).toBe(80);
      expect(getVoucherCost('rapid-intel', 1)).toBe(60);
      expect(getVoucherCost('hire-discount', 1)).toBe(75);
      expect(getVoucherCost('dept-funding', 1)).toBe(75);
      expect(getVoucherCost('rule-mastery', 1)).toBe(100);
    });
  });

  describe('getVoucherEffect', () => {
    it('returns 0 for level 0', () => {
      for (const id of ALL_VOUCHER_IDS) {
        expect(getVoucherEffect(id, 0)).toBe(0);
      }
    });

    it('returns correct effect for iron-fingers at each level', () => {
      expect(getVoucherEffect('iron-fingers', 1)).toBe(2);
      expect(getVoucherEffect('iron-fingers', 2)).toBe(5);
      expect(getVoucherEffect('iron-fingers', 3)).toBe(12);
    });

    it('returns correct effect for rapid-intel (fractional values)', () => {
      expect(getVoucherEffect('rapid-intel', 1)).toBe(0.65);
      expect(getVoucherEffect('rapid-intel', 2)).toBe(0.40);
      expect(getVoucherEffect('rapid-intel', 3)).toBe(0.20);
    });

    it('clamps to max level for levels beyond max', () => {
      expect(getVoucherEffect('iron-fingers', 5)).toBe(12);
    });

    it('returns 0 for negative levels', () => {
      expect(getVoucherEffect('iron-fingers', -1)).toBe(0);
    });
  });
});
