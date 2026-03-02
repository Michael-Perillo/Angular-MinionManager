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
  clicksRequired: number;
  clicksRemaining: number;
  assignedMinionId: string | null;
  queuedAt: number;
  isSpecialOp?: boolean;
  specialOpExpiry?: number;
  assignedQueue: QueueTarget | null;
}

export const TIER_CONFIG: Record<TaskTier, { gold: number; clicks: number }> = {
  petty: { gold: 5, clicks: 12 },
  sinister: { gold: 15, clicks: 25 },
  diabolical: { gold: 40, clicks: 40 },
  legendary: { gold: 100, clicks: 55 },
};

/** How much gold scales per villain level (linear) */
export const VILLAIN_SCALE_PER_LEVEL = 0.05; // +5% per villain level
