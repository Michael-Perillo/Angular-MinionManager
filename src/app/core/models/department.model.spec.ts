import {
  DEPARTMENT_LABELS,
  getDeptMult, createDefaultTierUnlocks, getUnlockedTiers, getTierUnlockCost,
  getHeistFloorMult, rollHeistGold, getBreakthroughThreshold,
  getMayhemClicks, getMayhemGold, MAYHEM_COMBO_THRESHOLD, MAYHEM_COMBO_TIMEOUT_MS,
  RESEARCH_DECK_GROWTH_INTERVAL,
  estimateTaskPayout,
  DEPT_LEVEL_COSTS, WORKER_SLOT_COSTS, MANAGER_SLOT_COST,
  getDeptLevelCost, getWorkerSlotCost,
  getDeptQueueCapacity,
} from './department.model';

describe('Department Model', () => {

  // ─── Queue capacity ──────

  describe('getDeptQueueCapacity', () => {
    it('should return 1 with 0 worker slots and 0 bonus', () => {
      expect(getDeptQueueCapacity(0, 0)).toBe(1);
    });

    it('should return 1 + workerSlots with 0 bonus', () => {
      expect(getDeptQueueCapacity(2, 0)).toBe(3);
      expect(getDeptQueueCapacity(4, 0)).toBe(5);
    });

    it('should include operationsDesk bonus', () => {
      expect(getDeptQueueCapacity(1, 2)).toBe(4);
      expect(getDeptQueueCapacity(0, 7)).toBe(8);
    });

    it('should combine workerSlots and bonus', () => {
      expect(getDeptQueueCapacity(3, 4)).toBe(8);
    });
  });

  // ─── Gold-gated progression costs ──────

  describe('DEPT_LEVEL_COSTS', () => {
    it('should have 7 entries (levels 1→2 through 7→8)', () => {
      expect(DEPT_LEVEL_COSTS.length).toBe(7);
    });

    it('should increase monotonically', () => {
      for (let i = 1; i < DEPT_LEVEL_COSTS.length; i++) {
        expect(DEPT_LEVEL_COSTS[i]).toBeGreaterThan(DEPT_LEVEL_COSTS[i - 1]);
      }
    });

    it('should have specific values', () => {
      expect(DEPT_LEVEL_COSTS).toEqual([30, 80, 200, 500, 1200, 2500, 5000]);
    });
  });

  describe('getDeptLevelCost', () => {
    it('should return 30 for level 1→2', () => {
      expect(getDeptLevelCost(1)).toBe(30);
    });

    it('should return 80 for level 2→3', () => {
      expect(getDeptLevelCost(2)).toBe(80);
    });

    it('should return 5000 for level 7→8', () => {
      expect(getDeptLevelCost(7)).toBe(5000);
    });

    it('should return 0 for max level (8)', () => {
      expect(getDeptLevelCost(8)).toBe(0);
    });

    it('should return 0 for invalid levels', () => {
      expect(getDeptLevelCost(0)).toBe(0);
      expect(getDeptLevelCost(-1)).toBe(0);
      expect(getDeptLevelCost(9)).toBe(0);
    });
  });

  describe('WORKER_SLOT_COSTS', () => {
    it('should have 4 entries (slots 1 through 4)', () => {
      expect(WORKER_SLOT_COSTS.length).toBe(4);
    });

    it('should have specific values', () => {
      expect(WORKER_SLOT_COSTS).toEqual([20, 60, 150, 400]);
    });
  });

  describe('getWorkerSlotCost', () => {
    it('should return 20 for first slot (0 current)', () => {
      expect(getWorkerSlotCost(0)).toBe(20);
    });

    it('should return 400 for fourth slot (3 current)', () => {
      expect(getWorkerSlotCost(3)).toBe(400);
    });

    it('should return 0 when at max (4 current)', () => {
      expect(getWorkerSlotCost(4)).toBe(0);
    });
  });

  describe('MANAGER_SLOT_COST', () => {
    it('should be 50', () => {
      expect(MANAGER_SLOT_COST).toBe(50);
    });
  });

  describe('getDeptMult', () => {
    it('should return 0 at level 1', () => {
      expect(getDeptMult(1)).toBe(0);
    });

    it('should return 0 at level 0 (edge case)', () => {
      expect(getDeptMult(0)).toBe(0);
    });

    it('should return 1 at level 2', () => {
      expect(getDeptMult(2)).toBe(1);
    });

    it('should return 4 at level 5', () => {
      expect(getDeptMult(5)).toBe(4);
    });

    it('should return 7 at level 8', () => {
      expect(getDeptMult(8)).toBe(7);
    });

    it('should increase linearly by 1 per level above 1', () => {
      for (let lvl = 2; lvl <= 10; lvl++) {
        expect(getDeptMult(lvl)).toBe(lvl - 1);
      }
    });
  });

  describe('DEPARTMENT_LABELS', () => {
    it('should have labels for all 4 categories', () => {
      expect(DEPARTMENT_LABELS.schemes.label).toBe('Schemes');
      expect(DEPARTMENT_LABELS.heists.label).toBe('Heists');
      expect(DEPARTMENT_LABELS.research.label).toBe('Research');
      expect(DEPARTMENT_LABELS.mayhem.label).toBe('Mayhem');
    });
  });

  describe('createDefaultTierUnlocks', () => {
    it('should create unlocks with only petty tier for each dept', () => {
      const unlocks = createDefaultTierUnlocks();
      for (const cat of ['schemes', 'heists', 'research', 'mayhem'] as const) {
        expect(unlocks[cat].has('petty')).toBe(true);
        expect(unlocks[cat].has('sinister')).toBe(false);
        expect(unlocks[cat].has('diabolical')).toBe(false);
        expect(unlocks[cat].has('legendary')).toBe(false);
      }
    });
  });

  describe('getUnlockedTiers', () => {
    it('should return only petty for default unlocks', () => {
      const unlocks = new Set<'petty' | 'sinister' | 'diabolical' | 'legendary'>(['petty'] as const);
      expect(getUnlockedTiers(unlocks)).toEqual(['petty']);
    });

    it('should return ordered tiers when multiple are unlocked', () => {
      const unlocks = new Set<'petty' | 'sinister' | 'diabolical' | 'legendary'>(['petty', 'diabolical', 'sinister'] as const);
      expect(getUnlockedTiers(unlocks)).toEqual(['petty', 'sinister', 'diabolical']);
    });
  });

  describe('getTierUnlockCost', () => {
    it('petty should be free', () => {
      expect(getTierUnlockCost('petty')).toBe(0);
    });

    it('sinister should cost 15', () => {
      expect(getTierUnlockCost('sinister')).toBe(15);
    });

    it('diabolical should cost 80', () => {
      expect(getTierUnlockCost('diabolical')).toBe(80);
    });

    it('legendary should cost 300', () => {
      expect(getTierUnlockCost('legendary')).toBe(300);
    });
  });

  // ─── Department mechanic helpers ──────

  describe('getHeistFloorMult', () => {
    it('should return 0.5 at level 1', () => {
      expect(getHeistFloorMult(1)).toBe(0.5);
    });

    it('should return 0.75 at level 3', () => {
      expect(getHeistFloorMult(3)).toBe(0.75);
    });

    it('should cap at 1.0 at level 5', () => {
      expect(getHeistFloorMult(5)).toBe(1.0);
    });

    it('should not exceed 1.0 at higher levels', () => {
      expect(getHeistFloorMult(8)).toBe(1.0);
    });
  });

  describe('rollHeistGold', () => {
    it('should return a value within valid bounds at level 1', () => {
      for (let i = 0; i < 50; i++) {
        const gold = rollHeistGold(10, 1);
        expect(gold).toBeGreaterThanOrEqual(5);  // floor(10 * 0.5)
        expect(gold).toBeLessThanOrEqual(25);     // floor(10 * 2.5)
      }
    });

    it('should narrow floor at higher levels', () => {
      for (let i = 0; i < 50; i++) {
        const gold = rollHeistGold(10, 5);
        expect(gold).toBeGreaterThanOrEqual(10); // floor(10 * 1.0)
        expect(gold).toBeLessThanOrEqual(25);     // floor(10 * 2.5)
      }
    });
  });

  describe('getBreakthroughThreshold', () => {
    it('should return 6 at level 1', () => {
      expect(getBreakthroughThreshold(1)).toBe(6); // max(3, 6 - floor(1/2)) = 6
    });

    it('should return 5 at level 3', () => {
      expect(getBreakthroughThreshold(3)).toBe(5); // 6 - floor(3/2) = 6 - 1 = 5
    });

    it('should return 4 at level 4', () => {
      expect(getBreakthroughThreshold(4)).toBe(4); // 6 - floor(4/2) = 6 - 2 = 4
    });

    it('should return 3 at level 6+', () => {
      expect(getBreakthroughThreshold(6)).toBe(3); // 6 - floor(6/2) = 6 - 3 = 3
    });

    it('should never go below 3', () => {
      expect(getBreakthroughThreshold(10)).toBe(3);
      expect(getBreakthroughThreshold(20)).toBe(3);
    });
  });

  describe('getMayhemClicks', () => {
    it('should apply 40% reduction (rounded up)', () => {
      expect(getMayhemClicks(10)).toBe(6);  // ceil(10 * 0.6) = 6
      expect(getMayhemClicks(18)).toBe(11); // ceil(18 * 0.6) = 11
      expect(getMayhemClicks(30)).toBe(18); // ceil(30 * 0.6) = 18
    });

    it('should have a minimum of 3 clicks', () => {
      expect(getMayhemClicks(1)).toBe(3);
      expect(getMayhemClicks(2)).toBe(3);
    });
  });

  describe('getMayhemGold', () => {
    it('should apply 30% reduction (rounded down)', () => {
      expect(getMayhemGold(10)).toBe(7);  // floor(10 * 0.7) = 7
      expect(getMayhemGold(5)).toBe(3);   // floor(5 * 0.7) = 3
      expect(getMayhemGold(30)).toBe(21); // floor(30 * 0.7) = 21
    });

    it('should have a minimum of 1 gold', () => {
      expect(getMayhemGold(1)).toBe(1);
    });
  });

  describe('MAYHEM_COMBO_THRESHOLD', () => {
    it('should be 3', () => {
      expect(MAYHEM_COMBO_THRESHOLD).toBe(3);
    });
  });

  describe('MAYHEM_COMBO_TIMEOUT_MS', () => {
    it('should be 8000ms', () => {
      expect(MAYHEM_COMBO_TIMEOUT_MS).toBe(8000);
    });
  });

  describe('RESEARCH_DECK_GROWTH_INTERVAL', () => {
    it('should be 3', () => {
      expect(RESEARCH_DECK_GROWTH_INTERVAL).toBe(3);
    });
  });

  // ─── Payout estimation ──────

  describe('estimateTaskPayout', () => {
    it('should return mult 1 and base gold at level 1 with no bonuses', () => {
      const result = estimateTaskPayout(10, 1, 0, 0, 0, false, 0, 0);
      expect(result.mult).toBe(1);
      expect(result.expectedGold).toBe(10);
      expect(result.baseGold).toBe(10);
    });

    it('should include dept level mult (+1 per level above 1)', () => {
      const result = estimateTaskPayout(10, 3, 0, 0, 0, false, 0, 0);
      // 1 + getDeptMult(3)=2 = 3
      expect(result.mult).toBe(3);
      expect(result.expectedGold).toBe(30);
    });

    it('should include breakthroughs', () => {
      const result = estimateTaskPayout(10, 1, 2, 0, 0, false, 0, 0);
      // 1 + 0 + 2 = 3
      expect(result.mult).toBe(3);
      expect(result.expectedGold).toBe(30);
    });

    it('should include manager gold mult', () => {
      const result = estimateTaskPayout(10, 1, 0, 1, 0, false, 0, 0);
      // 1 + 0 + 0 + 1 = 2
      expect(result.mult).toBe(2);
      expect(result.expectedGold).toBe(20);
    });

    it('should include worker gold mult', () => {
      const result = estimateTaskPayout(10, 1, 0, 0, 1, false, 0, 0);
      expect(result.mult).toBe(2);
      expect(result.expectedGold).toBe(20);
    });

    it('should add +1 for special ops', () => {
      const result = estimateTaskPayout(10, 1, 0, 0, 0, true, 0, 0);
      expect(result.mult).toBe(2);
      expect(result.expectedGold).toBe(20);
    });

    it('should include combo mult', () => {
      const result = estimateTaskPayout(10, 1, 0, 0, 0, false, 3, 0);
      expect(result.mult).toBe(4);
      expect(result.expectedGold).toBe(40);
    });

    it('should apply boss penalty (negative)', () => {
      const result = estimateTaskPayout(10, 3, 0, 0, 0, false, 0, -1);
      // 1 + 2 + 0 + 0 + 0 + 0 + 0 + (-1) = 2
      expect(result.mult).toBe(2);
      expect(result.expectedGold).toBe(20);
    });

    it('should floor mult at 1 even with heavy penalties', () => {
      const result = estimateTaskPayout(10, 1, 0, 0, 0, false, 0, -5);
      expect(result.mult).toBe(1);
      expect(result.expectedGold).toBe(10);
    });

    it('should combine all bonuses correctly', () => {
      // level 4 (+3), 1 breakthrough, manager +1, special op, combo +2, boss -1
      const result = estimateTaskPayout(5, 4, 1, 1, 0, true, 2, -1);
      // 1 + 3 + 1 + 1 + 0 + 1 + 2 + (-1) = 8
      expect(result.mult).toBe(8);
      expect(result.expectedGold).toBe(40);
    });
  });
});
