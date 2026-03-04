import { SaveData, SAVE_VERSION } from '../../app/core/models/save-data.model';
import { TaskCategory } from '../../app/core/models/task.model';
import { Department } from '../../app/core/models/department.model';

export function makeSaveData(overrides: Partial<SaveData> = {}): SaveData {
  const defaultDepts: Record<TaskCategory, Department> = {
    schemes: { category: 'schemes', level: 1, workerSlots: 1, hasManager: false },
    heists: { category: 'heists', level: 1, workerSlots: 0, hasManager: false },
    research: { category: 'research', level: 1, workerSlots: 0, hasManager: false },
    mayhem: { category: 'mayhem', level: 1, workerSlots: 0, hasManager: false },
  };

  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    gold: 0,
    completedCount: 0,
    totalGoldEarned: 0,
    minions: [],
    departments: defaultDepts,
    activeMissions: [],
    missionBoard: [],
    usedNameIndices: [],
    departmentQueues: {
      schemes: [],
      heists: [],
      research: [],
      mayhem: [],
    },
    hireOptions: ['penny-pincher', 'tip-jar', 'iron-grip'],
    ...overrides,
  };
}
