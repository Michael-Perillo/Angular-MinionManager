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
  /** Tasks completed this quarter (scheme completions count toward budget, operations don't) */
  tasksCompleted: number;
  /** Whether the current quarter has been completed */
  isComplete: boolean;
  /** How many Q1-Q3 targets were missed this year (affects Year-End boss modifiers) */
  missedQuarters: number;
  /** History of passed/failed quarters in this run */
  quarterResults: QuarterResult[];
  /** Dismissals remaining this quarter (scheme deck mechanic) */
  dismissalsRemaining: number;
  /** Research operations completed this quarter (for breakthrough tracking) */
  researchCompleted: number;
  /** Active breakthroughs this quarter (+1 mult to all depts per breakthrough) */
  activeBreakthroughs: number;
}

/** Result of a completed quarter */
export interface QuarterResult {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  passed: boolean;
  goldEarned: number;
  target: number;
  tasksCompleted: number;
  /** Budget remaining when gold target was met (for efficiency rating) */
  budgetRemaining?: number;
  /** Efficiency rating */
  efficiencyRating?: EfficiencyRating;
}

// ─── Efficiency rating (par system) ──────

export type EfficiencyRating = 'standard' | 'standard-plus' | 'premium' | 'premium-plus';

/** Determine efficiency rating based on remaining budget percentage */
export function getEfficiencyRating(budgetRemaining: number, totalBudget: number): EfficiencyRating {
  if (totalBudget <= 0) return 'standard';
  const pct = (budgetRemaining / totalBudget) * 100;
  if (pct > 50) return 'premium-plus';
  if (pct > 25) return 'premium';
  if (pct > 10) return 'standard-plus';
  return 'standard';
}

/** Pack config for each efficiency rating */
export const EFFICIENCY_PACK_CONFIG: Record<EfficiencyRating, { totalShown: number; pickCount: number }> = {
  'standard':      { totalShown: 3, pickCount: 1 },
  'standard-plus': { totalShown: 4, pickCount: 2 },
  'premium':       { totalShown: 5, pickCount: 2 },
  'premium-plus':  { totalShown: 5, pickCount: 3 },
};

// ─── Hand-tuned targets (Y1-Y3) ───────────

/** Hand-tuned targets account for scheme→operations pipeline (~2-3× gold throughput) */
const HAND_TUNED_TARGETS: Record<number, QuarterTarget[]> = {
  1: [
    { quarter: 1, taskBudget: 25, goldTarget: 75 },
    { quarter: 2, taskBudget: 35, goldTarget: 250 },
    { quarter: 3, taskBudget: 45, goldTarget: 700 },
    { quarter: 4, taskBudget: 30, goldTarget: 0 }, // Year-End review — target set by reviewer
  ],
  2: [
    { quarter: 1, taskBudget: 35, goldTarget: 500 },
    { quarter: 2, taskBudget: 45, goldTarget: 1500 },
    { quarter: 3, taskBudget: 55, goldTarget: 3500 },
    { quarter: 4, taskBudget: 30, goldTarget: 0 },
  ],
  3: [
    { quarter: 1, taskBudget: 45, goldTarget: 1200 },
    { quarter: 2, taskBudget: 55, goldTarget: 3000 },
    { quarter: 3, taskBudget: 65, goldTarget: 8000 },
    { quarter: 4, taskBudget: 30, goldTarget: 0 },
  ],
};

// ─── Scaling constants (Y4+) ──────────────

/** Additional tasks per quarter per year (Year 4+) */
const TASK_BUDGET_INCREASE_PER_YEAR = 8;

/** Gold target multiplier per year beyond Y3 */
const GOLD_TARGET_SCALE_PER_YEAR = 2.0;

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

/** Base dismissals per quarter */
export const BASE_DISMISSALS = 5;

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
    dismissalsRemaining: BASE_DISMISSALS,
    researchCompleted: 0,
    activeBreakthroughs: 0,
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
  const budgetRemaining = Math.max(0, target.taskBudget - progress.tasksCompleted);
  const passed = progress.grossGoldEarned >= target.goldTarget;
  return {
    year: progress.year,
    quarter: progress.quarter,
    passed,
    goldEarned: progress.grossGoldEarned,
    target: target.goldTarget,
    tasksCompleted: progress.tasksCompleted,
    budgetRemaining: passed ? budgetRemaining : undefined,
    efficiencyRating: passed ? getEfficiencyRating(budgetRemaining, target.taskBudget) : undefined,
  };
}
