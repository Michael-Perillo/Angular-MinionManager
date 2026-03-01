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

// ─── Year 1 base targets ───────────────────

const YEAR_1_TARGETS: QuarterTarget[] = [
  { quarter: 1, taskBudget: 30, goldTarget: 75 },
  { quarter: 2, taskBudget: 40, goldTarget: 400 },
  { quarter: 3, taskBudget: 60, goldTarget: 1200 },
  { quarter: 4, taskBudget: 30, goldTarget: 0 }, // Year-End review — target set by reviewer
];

// ─── Scaling constants ─────────────────────

/** Additional tasks per quarter per year (Year 2+) */
const TASK_BUDGET_INCREASE_PER_YEAR = 10;

/** Gold target multiplier per year (Year 2+) */
const GOLD_TARGET_SCALE_PER_YEAR = 1.8;

// ─── Public functions ──────────────────────

/** Get the target for a given year and quarter */
export function getQuarterTarget(year: number, quarter: 1 | 2 | 3 | 4): QuarterTarget {
  const base = YEAR_1_TARGETS[quarter - 1];
  if (year === 1) return base;

  const yearOffset = year - 1;
  return {
    quarter,
    taskBudget: base.taskBudget + TASK_BUDGET_INCREASE_PER_YEAR * yearOffset,
    goldTarget: quarter === 4
      ? 0 // Year-End review target is set by the reviewer
      : Math.round(base.goldTarget * Math.pow(GOLD_TARGET_SCALE_PER_YEAR, yearOffset)),
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
