import {
  getQuarterTarget, createInitialProgress, isQuarterBudgetExhausted,
  evaluateQuarter, QuarterProgress, getEfficiencyRating, BASE_DISMISSALS,
} from './quarter.model';

describe('QuarterModel', () => {
  describe('getQuarterTarget', () => {
    it('should return Year 1 Q1 targets', () => {
      const target = getQuarterTarget(1, 1);
      expect(target.quarter).toBe(1);
      expect(target.taskBudget).toBe(25);
      expect(target.goldTarget).toBe(75);
    });

    it('should return Year 1 Q2 targets', () => {
      const target = getQuarterTarget(1, 2);
      expect(target.taskBudget).toBe(35);
      expect(target.goldTarget).toBe(250);
    });

    it('should return Year 1 Q3 targets', () => {
      const target = getQuarterTarget(1, 3);
      expect(target.taskBudget).toBe(45);
      expect(target.goldTarget).toBe(700);
    });

    it('should return Year 1 Q4 with 0 gold target (set by reviewer)', () => {
      const target = getQuarterTarget(1, 4);
      expect(target.taskBudget).toBe(30);
      expect(target.goldTarget).toBe(0);
    });

    it('should return hand-tuned Year 2 Q1 targets', () => {
      const target = getQuarterTarget(2, 1);
      expect(target.taskBudget).toBe(35);
      expect(target.goldTarget).toBe(500);
    });

    it('should return hand-tuned Year 3 Q2 targets', () => {
      const target = getQuarterTarget(3, 2);
      expect(target.taskBudget).toBe(55);
      expect(target.goldTarget).toBe(3000);
    });

    it('should scale from Y3 base for Year 4', () => {
      const y3q1 = getQuarterTarget(3, 1);
      const y4q1 = getQuarterTarget(4, 1);
      expect(y4q1.taskBudget).toBe(y3q1.taskBudget + 8);
      expect(y4q1.goldTarget).toBe(Math.round(y3q1.goldTarget * 2.0));
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
      expect(progress.dismissalsRemaining).toBe(BASE_DISMISSALS);
      expect(progress.researchCompleted).toBe(0);
      expect(progress.activeBreakthroughs).toBe(0);
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
        tasksCompleted: 25, // Y1Q1 budget = 25
      };
      expect(isQuarterBudgetExhausted(progress)).toBe(true);
    });

    it('should return true when task budget is exceeded', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        tasksCompleted: 30,
      };
      expect(isQuarterBudgetExhausted(progress)).toBe(true);
    });
  });

  describe('evaluateQuarter', () => {
    it('should pass when gross gold meets target', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        grossGoldEarned: 200,
        tasksCompleted: 25,
      };
      const result = evaluateQuarter(progress);
      expect(result.passed).toBe(true);
      expect(result.goldEarned).toBe(200);
      expect(result.target).toBe(75); // Y1Q1 target
    });

    it('should fail when gross gold is below target', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        grossGoldEarned: 20,
        tasksCompleted: 25,
      };
      const result = evaluateQuarter(progress);
      expect(result.passed).toBe(false);
      expect(result.goldEarned).toBe(20);
      expect(result.target).toBe(75); // Y1Q1 target
    });

    it('should pass exactly at target', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        grossGoldEarned: 75, // Y1Q1 target
        tasksCompleted: 25,
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

    it('should include efficiency rating when passed', () => {
      const progress: QuarterProgress = {
        ...createInitialProgress(),
        grossGoldEarned: 200,
        tasksCompleted: 5, // Only used 5 of 25 budget → 80% remaining
      };
      const result = evaluateQuarter(progress);
      expect(result.passed).toBe(true);
      expect(result.efficiencyRating).toBe('premium-plus');
      expect(result.budgetRemaining).toBe(20);
    });
  });

  describe('getEfficiencyRating', () => {
    it('should return standard for <= 10% budget remaining', () => {
      expect(getEfficiencyRating(2, 25)).toBe('standard');
    });

    it('should return standard-plus for 11-25%', () => {
      expect(getEfficiencyRating(5, 25)).toBe('standard-plus'); // 20%
    });

    it('should return premium for 26-50%', () => {
      expect(getEfficiencyRating(10, 25)).toBe('premium'); // 40%
    });

    it('should return premium-plus for > 50%', () => {
      expect(getEfficiencyRating(15, 25)).toBe('premium-plus'); // 60%
    });
  });
});
