export type TaskTier = 'petty' | 'sinister' | 'diabolical';
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
}

export const TIER_CONFIG: Record<TaskTier, { gold: number; time: number; clicks: number }> = {
  petty: { gold: 5, time: 8, clicks: 10 },
  sinister: { gold: 15, time: 20, clicks: 20 },
  diabolical: { gold: 40, time: 45, clicks: 35 },
};
