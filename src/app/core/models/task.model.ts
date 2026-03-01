export type TaskTier = 'petty' | 'sinister' | 'diabolical' | 'legendary';
export type TaskCategory = 'schemes' | 'heists' | 'research' | 'mayhem';
export type TaskStatus = 'queued' | 'in-progress' | 'complete';
export type QueueTarget = TaskCategory | 'player';

export interface TaskTemplate {
  name: string;
  description: string;
  category: TaskCategory;
  tier: TaskTier;
}

export interface Task {
  id: string;
  template: TaskTemplate;
  status: TaskStatus;
  tier: TaskTier;
  goldReward: number;
  timeToComplete: number;
  timeRemaining: number;
  clicksRequired: number;
  clicksRemaining: number;
  assignedMinionId: string | null;
  queuedAt: number;
  assignedAt?: number | null;
  completesAt?: number | null;
  isSpecialOp?: boolean;
  specialOpExpiry?: number;
  assignedQueue: QueueTarget | null;
}

export const TIER_CONFIG: Record<TaskTier, { gold: number; time: number; clicks: number }> = {
  petty: { gold: 5, time: 10, clicks: 12 },
  sinister: { gold: 15, time: 25, clicks: 25 },
  diabolical: { gold: 40, time: 55, clicks: 40 },
  legendary: { gold: 100, time: 90, clicks: 55 },
};

/** How much gold/time/clicks scale per villain level (compounding) */
export const VILLAIN_SCALE_PER_LEVEL = 0.07; // +7% per villain level

/** @deprecated Use VILLAIN_SCALE_PER_LEVEL instead */
export const GOLD_SCALE_PER_LEVEL = VILLAIN_SCALE_PER_LEVEL;
