import {
  TIER_CONFIG, TIER_UNLOCK_COSTS, SCOUTING_TIER_WEIGHTS, TaskTier, TaskCategory,
  SCHEME_TIER_CONFIG, SCHEME_OP_DISTRIBUTIONS, rollOperationCount,
  ComboState, createDefaultComboState, getDeptFocusBonus, getTierEscalationBonus,
  advanceComboState, previewComboBonus, DEPT_FOCUS_CAP,
} from './task.model';

describe('Task Model', () => {

  describe('TIER_CONFIG', () => {
    it('should have configs for all 4 tiers', () => {
      expect(TIER_CONFIG.petty).toBeDefined();
      expect(TIER_CONFIG.sinister).toBeDefined();
      expect(TIER_CONFIG.diabolical).toBeDefined();
      expect(TIER_CONFIG.legendary).toBeDefined();
    });

    it('should have gold increasing across tiers', () => {
      expect(TIER_CONFIG.petty.gold).toBeLessThan(TIER_CONFIG.sinister.gold);
      expect(TIER_CONFIG.sinister.gold).toBeLessThan(TIER_CONFIG.diabolical.gold);
      expect(TIER_CONFIG.diabolical.gold).toBeLessThan(TIER_CONFIG.legendary.gold);
    });

    it('should have clicks increasing across tiers', () => {
      expect(TIER_CONFIG.petty.clicks).toBeLessThan(TIER_CONFIG.sinister.clicks);
      expect(TIER_CONFIG.sinister.clicks).toBeLessThan(TIER_CONFIG.diabolical.clicks);
      expect(TIER_CONFIG.diabolical.clicks).toBeLessThan(TIER_CONFIG.legendary.clicks);
    });

    it('should have specific petty values', () => {
      expect(TIER_CONFIG.petty).toEqual({ gold: 2, clicks: 10 });
    });

    it('should have specific sinister values', () => {
      expect(TIER_CONFIG.sinister).toEqual({ gold: 5, clicks: 18 });
    });

    it('should have specific diabolical values', () => {
      expect(TIER_CONFIG.diabolical).toEqual({ gold: 12, clicks: 30 });
    });

    it('should have specific legendary values', () => {
      expect(TIER_CONFIG.legendary).toEqual({ gold: 30, clicks: 45 });
    });
  });

  describe('TIER_UNLOCK_COSTS', () => {
    it('petty should be free', () => {
      expect(TIER_UNLOCK_COSTS.petty).toBe(0);
    });

    it('should have increasing costs for higher tiers', () => {
      expect(TIER_UNLOCK_COSTS.sinister).toBe(15);
      expect(TIER_UNLOCK_COSTS.diabolical).toBe(80);
      expect(TIER_UNLOCK_COSTS.legendary).toBe(300);
    });
  });

  describe('SCOUTING_TIER_WEIGHTS', () => {
    it('should have weights for all tiers', () => {
      expect(SCOUTING_TIER_WEIGHTS.petty).toBe(50);
      expect(SCOUTING_TIER_WEIGHTS.sinister).toBe(30);
      expect(SCOUTING_TIER_WEIGHTS.diabolical).toBe(15);
      expect(SCOUTING_TIER_WEIGHTS.legendary).toBe(5);
    });

    it('should sum to 100', () => {
      const total = Object.values(SCOUTING_TIER_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(total).toBe(100);
    });
  });

  // ─── Scheme card system ──────

  describe('SCHEME_TIER_CONFIG', () => {
    it('should have configs for all 4 tiers', () => {
      expect(SCHEME_TIER_CONFIG.petty).toBeDefined();
      expect(SCHEME_TIER_CONFIG.sinister).toBeDefined();
      expect(SCHEME_TIER_CONFIG.diabolical).toBeDefined();
      expect(SCHEME_TIER_CONFIG.legendary).toBeDefined();
    });

    it('should have increasing clicks across tiers', () => {
      expect(SCHEME_TIER_CONFIG.petty.clicks).toBeLessThan(SCHEME_TIER_CONFIG.sinister.clicks);
      expect(SCHEME_TIER_CONFIG.sinister.clicks).toBeLessThan(SCHEME_TIER_CONFIG.diabolical.clicks);
      expect(SCHEME_TIER_CONFIG.diabolical.clicks).toBeLessThan(SCHEME_TIER_CONFIG.legendary.clicks);
    });

    it('should have increasing direct gold across tiers', () => {
      expect(SCHEME_TIER_CONFIG.petty.directGold).toBeLessThan(SCHEME_TIER_CONFIG.sinister.directGold);
      expect(SCHEME_TIER_CONFIG.sinister.directGold).toBeLessThan(SCHEME_TIER_CONFIG.diabolical.directGold);
      expect(SCHEME_TIER_CONFIG.diabolical.directGold).toBeLessThan(SCHEME_TIER_CONFIG.legendary.directGold);
    });

    it('should have specific petty values', () => {
      expect(SCHEME_TIER_CONFIG.petty).toEqual({ clicks: 3, directGold: 3 });
    });
  });

  describe('SCHEME_OP_DISTRIBUTIONS', () => {
    it('petty should generate 1-2 operations', () => {
      const counts = SCHEME_OP_DISTRIBUTIONS.petty.map(d => d.count);
      expect(counts).toContain(1);
      expect(counts).toContain(2);
    });

    it('legendary should always generate 3 operations', () => {
      expect(SCHEME_OP_DISTRIBUTIONS.legendary.length).toBe(1);
      expect(SCHEME_OP_DISTRIBUTIONS.legendary[0].count).toBe(3);
    });
  });

  describe('rollOperationCount', () => {
    it('should return valid counts for petty tier', () => {
      for (let i = 0; i < 50; i++) {
        const count = rollOperationCount('petty');
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(2);
      }
    });

    it('should return valid counts for sinister tier', () => {
      for (let i = 0; i < 50; i++) {
        const count = rollOperationCount('sinister');
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(3);
      }
    });

    it('should always return 3 for legendary tier', () => {
      for (let i = 0; i < 20; i++) {
        expect(rollOperationCount('legendary')).toBe(3);
      }
    });
  });

  // ─── Combo system ──────

  describe('getDeptFocusBonus', () => {
    it('should return 0 for count 0 or 1', () => {
      expect(getDeptFocusBonus(0)).toBe(0);
      expect(getDeptFocusBonus(1)).toBe(0);
    });

    it('should return count-1 for counts 2-5', () => {
      expect(getDeptFocusBonus(2)).toBe(1);
      expect(getDeptFocusBonus(3)).toBe(2);
      expect(getDeptFocusBonus(4)).toBe(3);
      expect(getDeptFocusBonus(5)).toBe(4);
    });

    it('should cap at DEPT_FOCUS_CAP for counts above 5', () => {
      expect(getDeptFocusBonus(6)).toBe(DEPT_FOCUS_CAP);
      expect(getDeptFocusBonus(10)).toBe(DEPT_FOCUS_CAP);
    });
  });

  describe('getTierEscalationBonus', () => {
    it('should return 0 for step 0 or 1', () => {
      expect(getTierEscalationBonus(0)).toBe(0);
      expect(getTierEscalationBonus(1)).toBe(0);
    });

    it('should return correct bonuses for steps 2-4', () => {
      expect(getTierEscalationBonus(2)).toBe(2);
      expect(getTierEscalationBonus(3)).toBe(5);
      expect(getTierEscalationBonus(4)).toBe(10);
    });

    it('should cap at step 4 bonus for higher steps', () => {
      expect(getTierEscalationBonus(5)).toBe(10);
      expect(getTierEscalationBonus(10)).toBe(10);
    });
  });

  describe('advanceComboState', () => {
    it('should start focus at 1 for first scheme', () => {
      const state = createDefaultComboState();
      const result = advanceComboState(state, 'heists', 'petty');
      expect(result.newState.deptFocus.dept).toBe('heists');
      expect(result.newState.deptFocus.count).toBe(1);
      expect(result.deptFocusBonus).toBe(0);
    });

    it('should increment focus for same dept', () => {
      const state: ComboState = {
        deptFocus: { dept: 'heists', count: 2 },
        tierLadder: { lastTier: null, step: 0 },
      };
      const result = advanceComboState(state, 'heists', 'sinister');
      expect(result.newState.deptFocus.count).toBe(3);
      expect(result.deptFocusBonus).toBe(2);
    });

    it('should reset focus when dept changes', () => {
      const state: ComboState = {
        deptFocus: { dept: 'heists', count: 3 },
        tierLadder: { lastTier: null, step: 0 },
      };
      const result = advanceComboState(state, 'research', 'petty');
      expect(result.newState.deptFocus.dept).toBe('research');
      expect(result.newState.deptFocus.count).toBe(1);
      expect(result.deptFocusBonus).toBe(0);
    });

    it('should advance ladder for ascending tier', () => {
      const state: ComboState = {
        deptFocus: { dept: null, count: 0 },
        tierLadder: { lastTier: 'petty', step: 1 },
      };
      const result = advanceComboState(state, 'heists', 'sinister');
      expect(result.newState.tierLadder.step).toBe(2);
      expect(result.tierEscalationBonus).toBe(2);
    });

    it('should reset ladder when tier is equal', () => {
      const state: ComboState = {
        deptFocus: { dept: null, count: 0 },
        tierLadder: { lastTier: 'sinister', step: 2 },
      };
      const result = advanceComboState(state, 'heists', 'sinister');
      expect(result.newState.tierLadder.step).toBe(1);
      expect(result.tierEscalationBonus).toBe(0);
    });

    it('should reset ladder when tier is lower', () => {
      const state: ComboState = {
        deptFocus: { dept: null, count: 0 },
        tierLadder: { lastTier: 'diabolical', step: 3 },
      };
      const result = advanceComboState(state, 'heists', 'petty');
      expect(result.newState.tierLadder.step).toBe(1);
      expect(result.tierEscalationBonus).toBe(0);
    });

    it('should reset ladder when tier skips (petty → diabolical)', () => {
      const state: ComboState = {
        deptFocus: { dept: null, count: 0 },
        tierLadder: { lastTier: 'petty', step: 1 },
      };
      const result = advanceComboState(state, 'heists', 'diabolical');
      expect(result.newState.tierLadder.step).toBe(1);
      expect(result.tierEscalationBonus).toBe(0);
    });

    it('should stack both tracks for totalComboMult', () => {
      // Focus 3 on heists + ladder step 2 (petty → sinister)
      const state: ComboState = {
        deptFocus: { dept: 'heists', count: 2 },
        tierLadder: { lastTier: 'petty', step: 1 },
      };
      const result = advanceComboState(state, 'heists', 'sinister');
      expect(result.deptFocusBonus).toBe(2); // count 3 → bonus 2
      expect(result.tierEscalationBonus).toBe(2); // step 2
      expect(result.totalComboMult).toBe(4);
    });

    it('should build full ladder petty → sinister → diabolical → legendary', () => {
      let state = createDefaultComboState();
      let result = advanceComboState(state, 'heists', 'petty');
      state = result.newState;
      expect(result.tierEscalationBonus).toBe(0); // step 1

      result = advanceComboState(state, 'research', 'sinister');
      state = result.newState;
      expect(result.tierEscalationBonus).toBe(2); // step 2

      result = advanceComboState(state, 'mayhem', 'diabolical');
      state = result.newState;
      expect(result.tierEscalationBonus).toBe(5); // step 3

      result = advanceComboState(state, 'heists', 'legendary');
      expect(result.tierEscalationBonus).toBe(10); // step 4
    });
  });

  describe('previewComboBonus', () => {
    it('should return same values as advanceComboState', () => {
      const state: ComboState = {
        deptFocus: { dept: 'heists', count: 2 },
        tierLadder: { lastTier: 'petty', step: 1 },
      };
      const preview = previewComboBonus(state, 'heists', 'sinister');
      const advance = advanceComboState(state, 'heists', 'sinister');
      expect(preview.deptFocusBonus).toBe(advance.deptFocusBonus);
      expect(preview.tierEscalationBonus).toBe(advance.tierEscalationBonus);
      expect(preview.totalComboMult).toBe(advance.totalComboMult);
    });

    it('should not mutate the input state', () => {
      const state: ComboState = {
        deptFocus: { dept: 'heists', count: 2 },
        tierLadder: { lastTier: 'petty', step: 1 },
      };
      const stateCopy = JSON.parse(JSON.stringify(state));
      previewComboBonus(state, 'heists', 'sinister');
      expect(state).toEqual(stateCopy);
    });
  });
});
