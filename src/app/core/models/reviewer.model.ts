import { TaskCategory, TaskTier } from './task.model';

// ─── Modifier system ───────────────────────

export type ModifierCategory = 'task-constraint' | 'operational-constraint' | 'economic-penalty';

export interface Modifier {
  id: string;
  name: string;
  description: string;
  category: ModifierCategory;
}

// ─── All modifiers ─────────────────────────

export const ALL_MODIFIERS: Modifier[] = [
  // Task constraints
  { id: 'sinister-only', name: 'High Standards', description: 'Only Sinister+ tasks count toward gold target', category: 'task-constraint' },
  { id: 'petty-only', name: 'Micromanagement', description: 'Only Petty tasks appear on the mission board', category: 'task-constraint' },
  { id: 'lock-schemes', name: 'Schemes Locked', description: 'Schemes department is locked during review', category: 'task-constraint' },
  { id: 'lock-heists', name: 'Heists Locked', description: 'Heists department is locked during review', category: 'task-constraint' },
  { id: 'lock-research', name: 'Research Locked', description: 'Research department is locked during review', category: 'task-constraint' },
  { id: 'lock-mayhem', name: 'Mayhem Locked', description: 'Mayhem department is locked during review', category: 'task-constraint' },
  // Operational constraints
  { id: 'no-hiring', name: 'Hiring Freeze', description: 'No new hires during review', category: 'operational-constraint' },
  { id: 'board-frozen', name: 'Board Frozen', description: 'Mission board does not refresh', category: 'operational-constraint' },
  { id: 'upgrades-disabled', name: 'Budget Cuts', description: 'Upgrades are disabled during review', category: 'operational-constraint' },
  { id: 'board-limited', name: 'Slim Pickings', description: 'Board shows only 2 missions at a time', category: 'operational-constraint' },
  // Economic penalties
  { id: 'gold-drain', name: 'Overhead Tax', description: '5g deducted per completed task', category: 'economic-penalty' },
  { id: 'gold-halved', name: 'Revenue Split', description: 'All gold rewards reduced by 50%', category: 'economic-penalty' },
  { id: 'gold-reduced-30', name: 'Profit Sharing', description: 'All gold rewards reduced by 30%', category: 'economic-penalty' },
  { id: 'starting-gold-zero', name: 'Clean Slate', description: 'Gold set to 0 at start of review', category: 'economic-penalty' },
];

/** Look up a modifier by ID */
export function getModifier(id: string): Modifier | undefined {
  return ALL_MODIFIERS.find(m => m.id === id);
}

// ─── Reviewer system ───────────────────────

export type ReviewerPersonality = 'strict' | 'harsh' | 'punishing' | 'mixed';

export interface Reviewer {
  id: string;
  name: string;
  title: string;
  personality: ReviewerPersonality;
  /** Base modifier always active during this reviewer's review */
  baseModifier: string; // modifier ID
  /** Pool of additional modifiers drawn from when quarters are missed */
  modifierPool: string[]; // modifier IDs
  /** Earliest year this reviewer can appear */
  yearMinimum: number;
  /** Gold target for Q4 under this reviewer */
  goldTarget: number;
}

// ─── Reviewer roster ───────────────────────

export const REVIEWERS: Reviewer[] = [
  {
    id: 'thornton',
    name: 'Margaret Thornton',
    title: 'VP of Compliance',
    personality: 'strict',
    baseModifier: 'sinister-only',
    modifierPool: ['no-hiring', 'gold-reduced-30', 'lock-research'],
    yearMinimum: 1,
    goldTarget: 200,
  },
  {
    id: 'grimes',
    name: 'Viktor Grimes',
    title: 'Head of Internal Affairs',
    personality: 'mixed',
    baseModifier: 'no-hiring',
    modifierPool: ['board-frozen', 'gold-drain', 'lock-heists'],
    yearMinimum: 1,
    goldTarget: 150,
  },
  {
    id: 'hale',
    name: 'Patricia Hale',
    title: 'SVP Strategic Oversight',
    personality: 'strict',
    baseModifier: 'board-frozen',
    modifierPool: ['upgrades-disabled', 'gold-reduced-30', 'lock-schemes'],
    yearMinimum: 1,
    goldTarget: 250,
  },
  {
    id: 'auditor',
    name: 'The Auditor',
    title: '???',
    personality: 'punishing',
    baseModifier: 'gold-drain',
    modifierPool: ['starting-gold-zero', 'board-limited', 'gold-halved', 'lock-mayhem'],
    yearMinimum: 2,
    goldTarget: 300,
  },
  {
    id: 'chen',
    name: 'Director Chen',
    title: 'CFO',
    personality: 'harsh',
    baseModifier: 'gold-reduced-30',
    modifierPool: ['no-hiring', 'upgrades-disabled', 'board-frozen', 'gold-drain'],
    yearMinimum: 2,
    goldTarget: 350,
  },
];

// ─── Year-scaling for reviewer gold targets ──

/** Gold target scale per year (same as quarter model) */
const REVIEWER_GOLD_SCALE_PER_YEAR = 1.8;

// ─── Pure functions ────────────────────────

/** Get all reviewers available for a given year */
export function getAvailableReviewers(year: number): Reviewer[] {
  return REVIEWERS.filter(r => r.yearMinimum <= year);
}

/** Select a random reviewer for a given year */
export function selectReviewer(year: number, rng?: () => number): Reviewer {
  const available = getAvailableReviewers(year);
  const roll = rng ? rng() : Math.random();
  return available[Math.floor(roll * available.length)];
}

/**
 * Draw extra modifiers based on how many quarters were missed.
 * Draws from the reviewer's modifier pool (without duplicates of the base modifier).
 * Returns 0-3 modifiers (capped at missedCount and pool size).
 */
export function drawModifiers(reviewer: Reviewer, missedCount: number, rng?: () => number): Modifier[] {
  if (missedCount <= 0) return [];

  const pool = reviewer.modifierPool
    .filter(id => id !== reviewer.baseModifier)
    .map(id => getModifier(id))
    .filter((m): m is Modifier => m !== undefined);

  if (pool.length === 0) return [];

  const count = Math.min(missedCount, pool.length);
  const shuffled = [...pool];

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const roll = rng ? rng() : Math.random();
    const j = Math.floor(roll * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/** Get the scaled gold target for a reviewer in a given year */
export function getReviewerGoldTarget(reviewer: Reviewer, year: number): number {
  if (year === 1) return reviewer.goldTarget;
  return Math.round(reviewer.goldTarget * Math.pow(REVIEWER_GOLD_SCALE_PER_YEAR, year - 1));
}

/** Collect all active modifiers for a review (base + drawn extras) */
export function getReviewModifiers(reviewer: Reviewer, missedCount: number, rng?: () => number): Modifier[] {
  const base = getModifier(reviewer.baseModifier);
  const extras = drawModifiers(reviewer, missedCount, rng);
  return base ? [base, ...extras] : extras;
}
