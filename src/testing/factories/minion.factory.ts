import { Minion, CapturedMinion, MINION_NAMES } from '../../app/core/models/minion.model';
import { TaskCategory } from '../../app/core/models/task.model';

let _minionCounter = 0;

export function makeMinion(overrides: Partial<Minion> = {}): Minion {
  _minionCounter++;
  return {
    id: `minion-${_minionCounter}`,
    name: MINION_NAMES[(_minionCounter - 1) % MINION_NAMES.length],
    appearance: { color: '#6c3483', accessory: 'goggles' },
    status: 'idle',
    assignedTaskId: null,
    stats: { speed: 1.0, efficiency: 1.0 },
    specialty: 'schemes' as TaskCategory,
    assignedDepartment: 'schemes' as TaskCategory,
    xp: 0,
    level: 1,
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

export function makeCapturedMinion(overrides: Partial<CapturedMinion> = {}): CapturedMinion {
  const minion = makeMinion(overrides.minion ? overrides.minion : {});
  const now = Date.now();
  return {
    minion,
    capturedAt: now,
    expiresAt: now + 300_000,
    rescueDifficulty: minion.level,
    ...overrides,
  };
}

/** Reset factory counter (call in afterEach if needed) */
export function resetMinionFactory(): void {
  _minionCounter = 0;
}
