import { deptXpForLevel, deptLevelFromXp, availableTiersForDeptLevel, DEPT_TIER_XP, DEPARTMENT_LABELS } from './department.model';

describe('Department Model', () => {

  describe('deptXpForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(deptXpForLevel(1)).toBe(0);
    });

    it('should return 0 for level 0 (edge case)', () => {
      expect(deptXpForLevel(0)).toBe(0);
    });

    it('should return 20 for level 2', () => {
      expect(deptXpForLevel(2)).toBe(20);
    });

    it('should return increasing values for higher levels', () => {
      let prev = 0;
      for (let lvl = 2; lvl <= 10; lvl++) {
        const xp = deptXpForLevel(lvl);
        expect(xp).toBeGreaterThan(prev);
        prev = xp;
      }
    });

    it('should return integers (floored)', () => {
      for (let lvl = 1; lvl <= 10; lvl++) {
        expect(deptXpForLevel(lvl)).toBe(Math.floor(deptXpForLevel(lvl)));
      }
    });
  });

  describe('deptLevelFromXp', () => {
    it('should return 1 for 0 XP', () => {
      expect(deptLevelFromXp(0)).toBe(1);
    });

    it('should return 1 for XP just below level 2', () => {
      expect(deptLevelFromXp(19)).toBe(1);
    });

    it('should return 2 for exactly 20 XP', () => {
      expect(deptLevelFromXp(20)).toBe(2);
    });

    it('should round-trip: deptLevelFromXp(deptXpForLevel(n)) === n', () => {
      for (let lvl = 1; lvl <= 15; lvl++) {
        expect(deptLevelFromXp(deptXpForLevel(lvl))).toBe(lvl);
      }
    });

    it('should handle large XP values', () => {
      const level = deptLevelFromXp(50_000);
      expect(level).toBeGreaterThan(5);
    });
  });

  describe('availableTiersForDeptLevel', () => {
    it('should return only petty at level 1', () => {
      expect(availableTiersForDeptLevel(1)).toEqual(['petty']);
    });

    it('should return only petty at level 2', () => {
      expect(availableTiersForDeptLevel(2)).toEqual(['petty']);
    });

    it('should unlock sinister at level 3', () => {
      const tiers = availableTiersForDeptLevel(3);
      expect(tiers).toEqual(['petty', 'sinister']);
    });

    it('should still have sinister at level 4', () => {
      const tiers = availableTiersForDeptLevel(4);
      expect(tiers).toEqual(['petty', 'sinister']);
    });

    it('should unlock diabolical at level 5', () => {
      const tiers = availableTiersForDeptLevel(5);
      expect(tiers).toEqual(['petty', 'sinister', 'diabolical']);
    });

    it('should unlock legendary at level 8', () => {
      const tiers = availableTiersForDeptLevel(8);
      expect(tiers).toEqual(['petty', 'sinister', 'diabolical', 'legendary']);
    });

    it('should still have all tiers at level 10+', () => {
      const tiers = availableTiersForDeptLevel(10);
      expect(tiers).toEqual(['petty', 'sinister', 'diabolical', 'legendary']);
    });
  });

  describe('DEPT_TIER_XP', () => {
    it('should award more XP for higher tiers', () => {
      expect(DEPT_TIER_XP.petty).toBeLessThan(DEPT_TIER_XP.sinister);
      expect(DEPT_TIER_XP.sinister).toBeLessThan(DEPT_TIER_XP.diabolical);
      expect(DEPT_TIER_XP.diabolical).toBeLessThan(DEPT_TIER_XP.legendary);
    });

    it('should have specific values', () => {
      expect(DEPT_TIER_XP.petty).toBe(5);
      expect(DEPT_TIER_XP.sinister).toBe(12);
      expect(DEPT_TIER_XP.diabolical).toBe(25);
      expect(DEPT_TIER_XP.legendary).toBe(50);
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
});
