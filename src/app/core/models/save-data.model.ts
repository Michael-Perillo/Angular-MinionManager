import { Minion } from './minion.model';
import { Task, TaskCategory } from './task.model';
import { Department } from './department.model';
import { QuarterProgress } from './quarter.model';
import { Reviewer, Modifier } from './reviewer.model';

export interface SaveData {
  version: number;
  savedAt: number;
  gold: number;
  completedCount: number;
  totalGoldEarned: number;
  minions: Minion[];
  departments: Record<TaskCategory, Department>;
  activeMissions: Task[];
  missionBoard: Task[];
  usedNameIndices: number[];
  lastBoardRefresh: number;
  departmentQueues: Record<TaskCategory, Task[]>;
  playerQueue: Task[];
  quarterProgress?: QuarterProgress;
  unlockedDepartments?: string[];
  /** v8+: Year-End review state */
  currentReviewer?: Reviewer | null;
  activeModifiers?: Modifier[];
  isRunOver?: boolean;
}
