import { Minion } from './minion.model';
import { Task, TaskCategory } from './task.model';
import { Department } from './department.model';
import { QuarterProgress } from './quarter.model';

export interface SaveData {
  version: number;
  savedAt: number;
  gold: number;
  completedCount: number;
  totalGoldEarned: number;
  minions: Minion[];
  departments: Record<TaskCategory, Department>;
  upgradeLevels: { id: string; currentLevel: number }[];
  activeMissions: Task[];
  missionBoard: Task[];
  usedNameIndices: number[];
  lastBoardRefresh: number;
  departmentQueues: Record<TaskCategory, Task[]>;
  playerQueue: Task[];
  quarterProgress?: QuarterProgress;
  unlockedDepartments?: string[];
}
