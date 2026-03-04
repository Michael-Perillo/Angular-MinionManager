import { Minion, MinionRole, ALL_ARCHETYPE_IDS } from '../../app/core/models/minion.model';
import { TaskCategory } from '../../app/core/models/task.model';

let _minionCounter = 0;

export function makeMinion(overrides: Partial<Minion> = {}): Minion {
  _minionCounter++;
  return {
    id: `minion-${_minionCounter}`,
    archetypeId: ALL_ARCHETYPE_IDS[(_minionCounter - 1) % ALL_ARCHETYPE_IDS.length],
    role: 'worker' as MinionRole,
    status: 'idle',
    assignedTaskId: null,
    assignedDepartment: null,
    ...overrides,
  };
}

export function makeWorkingMinion(taskId: string, overrides: Partial<Minion> = {}): Minion {
  return makeMinion({
    status: 'working',
    assignedTaskId: taskId,
    ...overrides,
  });
}

/** Reset factory counter (call in afterEach if needed) */
export function resetMinionFactory(): void {
  _minionCounter = 0;
}
