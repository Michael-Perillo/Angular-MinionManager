/** Quarterly target configuration */
export interface QuarterTarget {
  /** Which quarter (1-3 for normal, 4 for Year-End review) */
  quarter: 1 | 2 | 3 | 4;
  /** Number of task completions before the quarter ends */
  taskBudget: number;
  /** Gold earned target for the quarter */
  goldTarget: number;
}

/** Quarterly progress tracking */
export interface QuarterProgress {
  /** Current year (1-based) */
  year: number;
  /** Current quarter (1-4) */
  quarter: 1 | 2 | 3 | 4;
  /** Gross gold earned this quarter */
  grossGoldEarned: number;
  /** Tasks completed this quarter */
  tasksCompleted: number;
  /** Whether the current quarter has been completed */
  isComplete: boolean;
  /** How many Q1-Q3 targets were missed this year (affects Year-End boss modifiers) */
  missedQuarters: number;
  /** History of passed/failed quarters in this run */
  quarterResults: QuarterResult[];
}

/** Result of a completed quarter */
export interface QuarterResult {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  passed: boolean;
  goldEarned: number;
  target: number;
  tasksCompleted: number;
}

// ─── Hand-tuned targets (Y1-Y3) ───────────

const HAND_TUNED_TARGETS: Record<number, QuarterTarget[]> = {
  1: [
    { quarter: 1, taskBudget: 30, goldTarget: 75 },
    { quarter: 2, taskBudget: 40, goldTarget: 300 },
    { quarter: 3, taskBudget: 60, goldTarget: 900 },
    { quarter: 4, taskBudget: 30, goldTarget: 0 }, // Year-End review — target set by reviewer
  ],
  2: [
    { quarter: 1, taskBudget: 40, goldTarget: 400 },
    { quarter: 2, taskBudget: 50, goldTarget: 1000 },
    { quarter: 3, taskBudget: 70, goldTarget: 2500 },
    { quarter: 4, taskBudget: 30, goldTarget: 0 },
  ],
  3: [
    { quarter: 1, taskBudget: 50, goldTarget: 800 },
    { quarter: 2, taskBudget: 60, goldTarget: 2500 },
    { quarter: 3, taskBudget: 80, goldTarget: 6000 },
    { quarter: 4, taskBudget: 30, goldTarget: 0 },
  ],
};

// ─── Scaling constants (Y4+) ──────────────

/** Additional tasks per quarter per year (Year 2+) */
const TASK_BUDGET_INCREASE_PER_YEAR = 10;

/** Gold target multiplier per year beyond Y3 */
const GOLD_TARGET_SCALE_PER_YEAR = 2.2;

// ─── Public functions ──────────────────────

/** Get the target for a given year and quarter */
export function getQuarterTarget(year: number, quarter: 1 | 2 | 3 | 4): QuarterTarget {
  // Hand-tuned targets for Y1-Y3
  if (year <= 3) {
    return HAND_TUNED_TARGETS[year][quarter - 1];
  }

  // Y4+: scale from Y3 base
  const y3 = HAND_TUNED_TARGETS[3][quarter - 1];
  const yearsAbove3 = year - 3;
  return {
    quarter,
    taskBudget: y3.taskBudget + TASK_BUDGET_INCREASE_PER_YEAR * yearsAbove3,
    goldTarget: quarter === 4
      ? 0 // Year-End review target is set by the reviewer
      : Math.round(y3.goldTarget * Math.pow(GOLD_TARGET_SCALE_PER_YEAR, yearsAbove3)),
  };
}

/** Create initial quarterly progress for a new run */
export function createInitialProgress(): QuarterProgress {
  return {
    year: 1,
    quarter: 1,
    grossGoldEarned: 0,
    tasksCompleted: 0,
    isComplete: false,
    missedQuarters: 0,
    quarterResults: [],
  };
}

/** Check if the quarter's task budget has been exhausted */
export function isQuarterBudgetExhausted(progress: QuarterProgress): boolean {
  const target = getQuarterTarget(progress.year, progress.quarter);
  return progress.tasksCompleted >= target.taskBudget;
}

/** Evaluate whether the quarter target was met */
export function evaluateQuarter(progress: QuarterProgress): QuarterResult {
  const target = getQuarterTarget(progress.year, progress.quarter);
  return {
    year: progress.year,
    quarter: progress.quarter,
    passed: progress.grossGoldEarned >= target.goldTarget,
    goldEarned: progress.grossGoldEarned,
    target: target.goldTarget,
    tasksCompleted: progress.tasksCompleted,
  };
}
