import {
  calculateInfamy, getInfamyBreakdown, buildRunSummary,
  createEmptyCompendium, createDefaultMetaSave, META_SAVE_VERSION,
} from './meta.model';
import { QuarterResult } from './quarter.model';

describe('Meta Model', () => {
  describe('calculateInfamy', () => {
    it('returns 0 for a zero-stat run', () => {
      expect(calculateInfamy({
        yearsSurvived: 0, quartersPassed: 0, quartersPlayed: 0,
        totalGoldEarned: 0, totalTasksCompleted: 0, bossesBeaten: 0,
      })).toBe(0);
    });

    it('calculates year bonus at 20 per year', () => {
      expect(calculateInfamy({
        yearsSurvived: 3, quartersPassed: 0, quartersPlayed: 0,
        totalGoldEarned: 0, totalTasksCompleted: 0, bossesBeaten: 0,
      })).toBe(60);
    });

    it('calculates quarter bonus at 5 per quarter passed', () => {
      expect(calculateInfamy({
        yearsSurvived: 0, quartersPassed: 6, quartersPlayed: 8,
        totalGoldEarned: 0, totalTasksCompleted: 0, bossesBeaten: 0,
      })).toBe(30);
    });

    it('calculates gold bonus as floor(totalGold / 100)', () => {
      expect(calculateInfamy({
        yearsSurvived: 0, quartersPassed: 0, quartersPlayed: 0,
        totalGoldEarned: 4599, totalTasksCompleted: 0, bossesBeaten: 0,
      })).toBe(45);
    });

    it('calculates boss bonus at 50 per boss beaten', () => {
      expect(calculateInfamy({
        yearsSurvived: 0, quartersPassed: 0, quartersPlayed: 0,
        totalGoldEarned: 0, totalTasksCompleted: 0, bossesBeaten: 2,
      })).toBe(100);
    });

    it('awards perfect bonus of 25 when all quarters passed', () => {
      expect(calculateInfamy({
        yearsSurvived: 1, quartersPassed: 3, quartersPlayed: 3,
        totalGoldEarned: 0, totalTasksCompleted: 0, bossesBeaten: 0,
      })).toBe(20 + 15 + 25); // year + quarter + perfect
    });

    it('does not award perfect bonus when any quarter missed', () => {
      expect(calculateInfamy({
        yearsSurvived: 1, quartersPassed: 2, quartersPlayed: 3,
        totalGoldEarned: 0, totalTasksCompleted: 0, bossesBeaten: 0,
      })).toBe(20 + 10); // year + quarter, no perfect
    });

    it('does not award perfect bonus when quartersPlayed is 0', () => {
      expect(calculateInfamy({
        yearsSurvived: 0, quartersPassed: 0, quartersPlayed: 0,
        totalGoldEarned: 0, totalTasksCompleted: 0, bossesBeaten: 0,
      })).toBe(0);
    });

    it('matches the plan example: Y2, 6/7 Q, 4500g, 1 boss', () => {
      expect(calculateInfamy({
        yearsSurvived: 2, quartersPassed: 6, quartersPlayed: 7,
        totalGoldEarned: 4500, totalTasksCompleted: 200, bossesBeaten: 1,
      })).toBe(40 + 30 + 45 + 50); // 165
    });
  });

  describe('getInfamyBreakdown', () => {
    it('returns detailed breakdown matching calculateInfamy total', () => {
      const summary = {
        yearsSurvived: 2, quartersPassed: 6, quartersPlayed: 7,
        totalGoldEarned: 4500, totalTasksCompleted: 200, bossesBeaten: 1,
      };
      const breakdown = getInfamyBreakdown(summary);
      expect(breakdown.yearBonus).toBe(40);
      expect(breakdown.quarterBonus).toBe(30);
      expect(breakdown.goldBonus).toBe(45);
      expect(breakdown.bossBonus).toBe(50);
      expect(breakdown.perfectBonus).toBe(0);
      expect(breakdown.total).toBe(165);
      expect(breakdown.total).toBe(calculateInfamy(summary));
    });
  });

  describe('buildRunSummary', () => {
    it('builds summary from quarter results', () => {
      const results: QuarterResult[] = [
        { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 25 },
        { year: 1, quarter: 2, passed: true, goldEarned: 300, target: 250, tasksCompleted: 35 },
        { year: 1, quarter: 3, passed: false, goldEarned: 500, target: 700, tasksCompleted: 45 },
        { year: 1, quarter: 4, passed: false, goldEarned: 100, target: 200, tasksCompleted: 30 },
      ];
      const summary = buildRunSummary(results, 1000, 135);

      expect(summary.yearsSurvived).toBe(1);
      expect(summary.quartersPassed).toBe(2); // 2 of Q1-Q3 passed + Q4 failed
      expect(summary.quartersPlayed).toBe(3); // 3 non-Q4 quarters
      expect(summary.bossesBeaten).toBe(0);
      expect(summary.totalGoldEarned).toBe(1000);
      expect(summary.totalTasksCompleted).toBe(135);
      expect(summary.infamyEarned).toBe(calculateInfamy(summary));
      expect(summary.endedAt).toBeGreaterThan(0);
    });

    it('handles empty quarter results', () => {
      const summary = buildRunSummary([], 0, 0);
      expect(summary.yearsSurvived).toBe(0);
      expect(summary.quartersPassed).toBe(0);
      expect(summary.bossesBeaten).toBe(0);
      expect(summary.infamyEarned).toBe(0);
    });

    it('counts bosses beaten from Q4 passes', () => {
      const results: QuarterResult[] = [
        { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 25 },
        { year: 1, quarter: 2, passed: true, goldEarned: 300, target: 250, tasksCompleted: 35 },
        { year: 1, quarter: 3, passed: true, goldEarned: 800, target: 700, tasksCompleted: 45 },
        { year: 1, quarter: 4, passed: true, goldEarned: 300, target: 200, tasksCompleted: 30 },
        { year: 2, quarter: 1, passed: true, goldEarned: 600, target: 500, tasksCompleted: 35 },
        { year: 2, quarter: 2, passed: false, goldEarned: 1000, target: 1500, tasksCompleted: 45 },
        { year: 2, quarter: 3, passed: true, goldEarned: 4000, target: 3500, tasksCompleted: 55 },
        { year: 2, quarter: 4, passed: false, goldEarned: 200, target: 330, tasksCompleted: 30 },
      ];
      const summary = buildRunSummary(results, 7300, 300);
      expect(summary.bossesBeaten).toBe(1); // only Y1 Q4 passed
      expect(summary.yearsSurvived).toBe(2);
    });
  });

  describe('createEmptyCompendium', () => {
    it('returns empty arrays for all categories', () => {
      const c = createEmptyCompendium();
      expect(c.seenArchetypes).toEqual([]);
      expect(c.seenTasks).toEqual([]);
      expect(c.seenReviewers).toEqual([]);
      expect(c.seenModifiers).toEqual([]);
    });
  });

  describe('createDefaultMetaSave', () => {
    it('returns default meta save with correct version', () => {
      const meta = createDefaultMetaSave();
      expect(meta.version).toBe(META_SAVE_VERSION);
      expect(meta.totalInfamy).toBe(0);
      expect(meta.hallOfFame).toEqual([]);
      expect(meta.soundEnabled).toBe(true);
    });
  });
});
