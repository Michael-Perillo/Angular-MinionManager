import { Minion } from './minion.model';
import { Task, TaskCategory } from './task.model';
import { Department } from './department.model';

export interface SaveData {
  version: number;
  savedAt: number;
  gold: number;
  completedCount: number;
  totalGoldEarned: number;
  notoriety: number;
  minions: Minion[];
  departments: Record<TaskCategory, Department>;
  upgradeLevels: { id: string; currentLevel: number }[];
  activeMissions: Task[];
  missionBoard: Task[];
  raidActive: boolean;
  raidTimer: number;
  usedNameIndices: number[];
  lastBoardRefresh: number;
  capturedMinions: CapturedMinion[];
}

// Re-export for convenience — CapturedMinion is defined in minion.model
import type { CapturedMinion } from './minion.model';
export type { CapturedMinion };
