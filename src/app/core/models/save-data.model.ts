import { Minion } from './minion.model';
import { Task, TaskCategory } from './task.model';
import { Department } from './department.model';
import { QuarterProgress } from './quarter.model';
import { Reviewer, Modifier } from './reviewer.model';
import { Rule } from './rule.model';

/** Single source of truth for the save format version. Bump this when changing SaveData. */
export const SAVE_VERSION = 11;

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
  /** v10+: Voucher levels */
  ownedVouchers?: Record<string, number>;
  /** v11+: Card/joker/rule system */
  ownedCards?: string[];
  ownedJokers?: string[];
  equippedJokers?: string[];
  rules?: Rule[];
}
