export type TaskTier = 'petty' | 'sinister' | 'diabolical' | 'legendary';
export type TaskCategory = 'schemes' | 'heists' | 'research' | 'mayhem';
export type TaskStatus = 'queued' | 'in-progress' | 'complete';

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
  isSpecialOp?: boolean;
  specialOpExpiry?: number;
  isCoverOp?: boolean;
}

export const TIER_CONFIG: Record<TaskTier, { gold: number; time: number; clicks: number }> = {
  petty: { gold: 5, time: 8, clicks: 10 },
  sinister: { gold: 15, time: 20, clicks: 20 },
  diabolical: { gold: 40, time: 45, clicks: 35 },
  legendary: { gold: 100, time: 75, clicks: 50 },
};

/** How much gold reward scales per villain level (compounding) */
export const GOLD_SCALE_PER_LEVEL = 0.10; // +10% per villain level
