import { SaveData } from '../../app/core/models/save-data.model';
import { TaskCategory } from '../../app/core/models/task.model';
import { Department } from '../../app/core/models/department.model';

export function makeSaveData(overrides: Partial<SaveData> = {}): SaveData {
  const defaultDepts: Record<TaskCategory, Department> = {
    schemes: { category: 'schemes', xp: 0, level: 1 },
    heists: { category: 'heists', xp: 0, level: 1 },
    research: { category: 'research', xp: 0, level: 1 },
    mayhem: { category: 'mayhem', xp: 0, level: 1 },
  };

  return {
    version: 2,
    savedAt: Date.now(),
    gold: 0,
    completedCount: 0,
    totalGoldEarned: 0,
    notoriety: 0,
    minions: [],
    departments: defaultDepts,
    upgradeLevels: [],
    activeMissions: [],
    missionBoard: [],
    raidActive: false,
    raidTimer: 0,
    usedNameIndices: [],
    lastBoardRefresh: 0,
    capturedMinions: [],
    ...overrides,
  };
}
