import { xpForLevel, levelFromXp, MINION_NAMES, MINION_COLORS, MINION_ACCESSORIES, SPECIALTY_CATEGORIES, SPECIALTY_BONUS, PRISON_DURATION_MS, getMinionRank, getMinionStars, getMinionRankColor } from './minion.model';

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

  describe('getMinionRank', () => {
    it('should return Lackey for levels 1-2', () => {
      expect(getMinionRank(1)).toBe('Lackey');
      expect(getMinionRank(2)).toBe('Lackey');
    });

    it('should return Grunt for levels 3-4', () => {
      expect(getMinionRank(3)).toBe('Grunt');
      expect(getMinionRank(4)).toBe('Grunt');
    });

    it('should return Agent for levels 5-6', () => {
      expect(getMinionRank(5)).toBe('Agent');
      expect(getMinionRank(6)).toBe('Agent');
    });

    it('should return Operative for levels 7-8', () => {
      expect(getMinionRank(7)).toBe('Operative');
      expect(getMinionRank(8)).toBe('Operative');
    });

    it('should return Elite for levels 9-10', () => {
      expect(getMinionRank(9)).toBe('Elite');
      expect(getMinionRank(10)).toBe('Elite');
    });

    it('should return Mastermind for levels 11+', () => {
      expect(getMinionRank(11)).toBe('Mastermind');
      expect(getMinionRank(20)).toBe('Mastermind');
    });
  });

  describe('getMinionStars', () => {
    it('should return 1 star for levels 1-2', () => {
      expect(getMinionStars(1)).toBe(1);
      expect(getMinionStars(2)).toBe(1);
    });

    it('should return 5 stars for level 11+', () => {
      expect(getMinionStars(11)).toBe(5);
    });

    it('should increase with level', () => {
      expect(getMinionStars(3)).toBeGreaterThan(getMinionStars(1));
      expect(getMinionStars(7)).toBeGreaterThan(getMinionStars(5));
    });
  });

  describe('getMinionRankColor', () => {
    it('should return different colors for different level ranges', () => {
      const color1 = getMinionRankColor(1);
      const color5 = getMinionRankColor(5);
      const color9 = getMinionRankColor(9);
      expect(color1).not.toBe(color5);
      expect(color5).not.toBe(color9);
    });
  });
});
