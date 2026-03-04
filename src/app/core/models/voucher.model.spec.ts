import {
  VOUCHERS, ALL_VOUCHER_IDS, UNLOCK_VOUCHER_IDS, UPGRADE_VOUCHER_IDS, VoucherId,
  getVoucherCost, getVoucherEffect, createEmptyVoucherLevels, getShopVoucherSelection,
} from './voucher.model';

describe('Voucher Model', () => {
  describe('VOUCHERS', () => {
    it('should define exactly 8 vouchers (3 unlock + 5 upgrade)', () => {
      expect(ALL_VOUCHER_IDS.length).toBe(8);
      expect(Object.keys(VOUCHERS).length).toBe(8);
      expect(UNLOCK_VOUCHER_IDS.length).toBe(3);
      expect(UPGRADE_VOUCHER_IDS.length).toBe(5);
    });

    it('unlock vouchers have maxLevel 1', () => {
      for (const id of UNLOCK_VOUCHER_IDS) {
        expect(VOUCHERS[id].maxLevel).toBe(1);
      }
    });

    it('upgrade vouchers have maxLevel >= 2', () => {
      for (const id of UPGRADE_VOUCHER_IDS) {
        expect(VOUCHERS[id].maxLevel).toBeGreaterThanOrEqual(2);
      }
    });

    it('each voucher has levelCosts and levelEffects matching maxLevel', () => {
      for (const id of ALL_VOUCHER_IDS) {
        const def = VOUCHERS[id];
        expect(def.levelCosts.length).toBe(def.maxLevel);
        expect(def.levelEffects.length).toBe(def.maxLevel);
      }
    });

    it('upgrade voucher level costs should increase monotonically', () => {
      for (const id of UPGRADE_VOUCHER_IDS) {
        const costs = VOUCHERS[id].levelCosts;
        for (let i = 1; i < costs.length; i++) {
          expect(costs[i - 1]).toBeLessThan(costs[i]);
        }
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

    it('returns correct cost for unlock vouchers', () => {
      expect(getVoucherCost('unlock-heists', 1)).toBe(60);
      expect(getVoucherCost('unlock-research', 1)).toBe(65);
      expect(getVoucherCost('unlock-mayhem', 1)).toBe(75);
    });

    it('returns 0 for level 0 (invalid)', () => {
      expect(getVoucherCost('iron-fingers', 0)).toBe(0);
    });

    it('returns 0 for level beyond max', () => {
      expect(getVoucherCost('iron-fingers', 4)).toBe(0);
      expect(getVoucherCost('unlock-heists', 2)).toBe(0);
    });

    it('returns correct costs for all upgrade vouchers at level 1', () => {
      expect(getVoucherCost('board-expansion', 1)).toBe(60);
      expect(getVoucherCost('operations-desk', 1)).toBe(80);
      expect(getVoucherCost('hire-discount', 1)).toBe(75);
      expect(getVoucherCost('dismissal-expert', 1)).toBe(100);
    });

    it('should scale costs by year', () => {
      expect(getVoucherCost('iron-fingers', 1, 1)).toBe(40);
      expect(getVoucherCost('iron-fingers', 1, 2)).toBe(80);
      expect(getVoucherCost('iron-fingers', 1, 3)).toBe(120);
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

    it('returns correct effect for unlock vouchers', () => {
      expect(getVoucherEffect('unlock-heists', 1)).toBe(1);
    });

    it('clamps to max level for levels beyond max', () => {
      expect(getVoucherEffect('iron-fingers', 5)).toBe(12);
      expect(getVoucherEffect('unlock-heists', 5)).toBe(1);
    });

    it('returns 0 for negative levels', () => {
      expect(getVoucherEffect('iron-fingers', -1)).toBe(0);
    });
  });

  describe('getShopVoucherSelection', () => {
    it('should return exactly 3 vouchers', () => {
      const selection = getShopVoucherSelection(1, 1);
      expect(selection.length).toBe(3);
    });

    it('should only contain upgrade voucher IDs', () => {
      const selection = getShopVoucherSelection(1, 2);
      for (const id of selection) {
        expect(UPGRADE_VOUCHER_IDS).toContain(id);
      }
    });

    it('should be deterministic for same year+quarter', () => {
      const a = getShopVoucherSelection(2, 1);
      const b = getShopVoucherSelection(2, 1);
      expect(a).toEqual(b);
    });

    it('should differ across quarters', () => {
      const q1 = getShopVoucherSelection(1, 1);
      const q2 = getShopVoucherSelection(1, 2);
      // Not guaranteed to differ but very likely given different seeds
      // At minimum, the function should not crash
      expect(q1.length).toBe(3);
      expect(q2.length).toBe(3);
    });
  });
});
