import { Minion } from './minion.model';
import { Task, TaskCategory, SchemeCard, ComboState } from './task.model';
import { Department } from './department.model';
import { QuarterProgress } from './quarter.model';
import { Reviewer, Modifier } from './reviewer.model';

/** Single source of truth for the save format version. Bump this when changing SaveData. */
export const SAVE_VERSION = 20;

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
  departmentQueues: Record<TaskCategory, Task[]>;
  quarterProgress?: QuarterProgress;
  unlockedDepartments?: string[];
  /** v8+: Year-End review state */
  currentReviewer?: Reviewer | null;
  activeModifiers?: Modifier[];
  isRunOver?: boolean;
  /** v10+: Voucher levels */
  ownedVouchers?: Record<string, number>;
  /** v14+: Per-department tier unlocks */
  deptTierUnlocks?: Record<string, string[]>;
  /** v15+: Scheme deck system */
  schemeDeck?: SchemeCard[];
  /** v17+: Hire draft options */
  hireOptions?: string[];
  /** v18+: Combo state (dept focus + tier ladder) */
  comboState?: ComboState;
}
