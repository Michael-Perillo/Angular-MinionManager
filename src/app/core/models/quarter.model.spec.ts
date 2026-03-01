import {
  getQuarterTarget, createInitialProgress, isQuarterBudgetExhausted,
  evaluateQuarter, QuarterProgress,
} from './quarter.model';

describe('QuarterModel', () => {
  describe('getQuarterTarget', () => {
    it('should return Year 1 Q1 targets', () => {
      const target = getQuarterTarget(1, 1);
      expect(target.quarter).toBe(1);
      expect(target.taskBudget).toBe(30);
      expect(target.goldTarget).toBe(75);
    });

    it('should return Year 1 Q2 targets', () => {
      const target = getQuarterTarget(1, 2);
      expect(target.taskBudget).toBe(40);
      expect(target.goldTarget).toBe(400);
    });

    it('should return Year 1 Q3 targets', () => {
      const target = getQuarterTarget(1, 3);
      expect(target.taskBudget).toBe(60);
      expect(target.goldTarget).toBe(1200);
    });

    it('should return Year 1 Q4 with 0 gold target (set by reviewer)', () => {
      const target = getQuarterTarget(1, 4);
      expect(target.taskBudget).toBe(30);
      expect(target.goldTarget).toBe(0);
    });

    it('should scale task budget for Year 2', () => {
      const target = getQuarterTarget(2, 1);
      expect(target.taskBudget).toBe(40); // 30 + 10
    });

    it('should scale gold target for Year 2', () => {
      const target = getQuarterTarget(2, 1);
      expect(target.goldTarget).toBe(Math.round(75 * 1.8));
    });

    it('should scale task budget for Year 3', () => {
      const target = getQuarterTarget(3, 2);
      expect(target.taskBudget).toBe(60); // 40 + 20
    });

    it('should keep Q4 gold target at 0 regardless of year', () => {
      const target = getQuarterTarget(3, 4);
      expect(target.goldTarget).toBe(0);
    });
  });

  describe('createInitialProgress', () => {
    it('should start at Year 1 Q1 with all zeros', () => {
      const progress = createInitialProgress();
      expect(progress.year).toBe(1);
      expect(progress.quarter).toBe(1);
      expect(progress.grossGoldEarned).toBe(0);
      expect(progress.tasksCompleted).toBe(0);
      expect(progress.isComplete).toBe(false);
      expect(progress.missedQuarters).toBe(0);
      expect(progress.quarterResults).toEqual([]);
    });
  });

  describe('isQuarterBudgetExhausted', () => {
    it('should return false when tasks remain', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        tasksCompleted: 15,
      };
      expect(isQuarterBudgetExhausted(progress)).toBe(false);
    });

    it('should return true when task budget is met', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        tasksCompleted: 30,
      };
      expect(isQuarterBudgetExhausted(progress)).toBe(true);
    });

    it('should return true when task budget is exceeded', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        tasksCompleted: 35,
      };
      expect(isQuarterBudgetExhausted(progress)).toBe(true);
    });
  });

  describe('evaluateQuarter', () => {
    it('should pass when gross gold meets target', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        grossGoldEarned: 200,
        tasksCompleted: 30,
      };
      const result = evaluateQuarter(progress);
      expect(result.passed).toBe(true);
      expect(result.goldEarned).toBe(200);
      expect(result.target).toBe(75);
    });

    it('should fail when gross gold is below target', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        grossGoldEarned: 50,
        tasksCompleted: 30,
      };
      const result = evaluateQuarter(progress);
      expect(result.passed).toBe(false);
      expect(result.goldEarned).toBe(50);
      expect(result.target).toBe(75);
    });

    it('should pass exactly at target', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        grossGoldEarned: 75,
        tasksCompleted: 30,
      };
      const result = evaluateQuarter(progress);
      expect(result.passed).toBe(true);
    });

    it('should include year and quarter in result', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        year: 2,
        quarter: 3,
        grossGoldEarned: 5000,
        tasksCompleted: 80,
      };
      const result = evaluateQuarter(progress);
      expect(result.year).toBe(2);
      expect(result.quarter).toBe(3);
    });
  });
});
