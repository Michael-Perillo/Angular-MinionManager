import { xpForLevel, levelFromXp, MINION_NAMES, MINION_COLORS, MINION_ACCESSORIES, SPECIALTY_CATEGORIES, SPECIALTY_BONUS, PRISON_DURATION_MS } from './minion.model';

describe('Minion Model', () => {

  describe('xpForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(xpForLevel(1)).toBe(0);
    });

    it('should return 0 for level 0 (edge case)', () => {
      expect(xpForLevel(0)).toBe(0);
    });

    it('should return 0 for negative level (edge case)', () => {
      expect(xpForLevel(-1)).toBe(0);
    });

    it('should return 10 for level 2', () => {
      expect(xpForLevel(2)).toBe(10);
    });

    it('should return increasing values for higher levels', () => {
      let prev = 0;
      for (let lvl = 2; lvl <= 10; lvl++) {
        const xp = xpForLevel(lvl);
        expect(xp).toBeGreaterThan(prev);
        prev = xp;
      }
    });

    it('should grow super-linearly (exponent 1.6)', () => {
      const lvl5 = xpForLevel(5);
      const lvl10 = xpForLevel(10);
      // With exponent 1.6, lvl10 should be much more than 2x lvl5
      expect(lvl10 / lvl5).toBeGreaterThan(2);
    });

    it('should return integers (floored)', () => {
      for (let lvl = 1; lvl <= 15; lvl++) {
        expect(xpForLevel(lvl)).toBe(Math.floor(xpForLevel(lvl)));
      }
    });
  });

  describe('levelFromXp', () => {
    it('should return 1 for 0 XP', () => {
      expect(levelFromXp(0)).toBe(1);
    });

    it('should return 1 for XP just below level 2 threshold', () => {
      expect(levelFromXp(9)).toBe(1);
    });

    it('should return 2 for exactly level 2 XP', () => {
      expect(levelFromXp(10)).toBe(2);
    });

    it('should return 2 for XP between level 2 and 3', () => {
      const lvl3Xp = xpForLevel(3);
      expect(levelFromXp(lvl3Xp - 1)).toBe(2);
    });

    it('should handle large XP values without error', () => {
      const level = levelFromXp(100_000);
      expect(level).toBeGreaterThan(10);
    });

    it('should round-trip: levelFromXp(xpForLevel(n)) === n', () => {
      for (let lvl = 1; lvl <= 20; lvl++) {
        expect(levelFromXp(xpForLevel(lvl))).toBe(lvl);
      }
    });

    it('should return 1 for negative XP (edge case)', () => {
      expect(levelFromXp(-5)).toBe(1);
    });
  });

  describe('constants', () => {
    it('MINION_NAMES should have 25 unique names', () => {
      expect(MINION_NAMES.length).toBe(25);
      expect(new Set(MINION_NAMES).size).toBe(25);
    });

    it('MINION_COLORS should have 15 entries', () => {
      expect(MINION_COLORS.length).toBe(15);
    });

    it('MINION_ACCESSORIES should have 5 options', () => {
      expect(MINION_ACCESSORIES.length).toBe(5);
    });

    it('SPECIALTY_CATEGORIES should contain all 4 categories', () => {
      expect(SPECIALTY_CATEGORIES).toContain('schemes');
      expect(SPECIALTY_CATEGORIES).toContain('heists');
      expect(SPECIALTY_CATEGORIES).toContain('research');
      expect(SPECIALTY_CATEGORIES).toContain('mayhem');
    });

    it('SPECIALTY_BONUS should be 0.25', () => {
      expect(SPECIALTY_BONUS).toBe(0.25);
    });

    it('PRISON_DURATION_MS should be 5 minutes', () => {
      expect(PRISON_DURATION_MS).toBe(300_000);
    });
  });
});
