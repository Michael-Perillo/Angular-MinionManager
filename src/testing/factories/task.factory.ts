import { Task, TaskTier, TaskCategory, TIER_CONFIG } from '../../app/core/models/task.model';

let _factoryCounter = 0;

export function makeTask(overrides: Partial<Task> = {}): Task {
  _factoryCounter++;
  const tier: TaskTier = overrides.tier ?? 'petty';
  const config = TIER_CONFIG[tier];
  const category: TaskCategory = overrides.template?.category ?? 'schemes';

  return {
    id: `task-${_factoryCounter}`,
    template: {
      name: `Test Task ${_factoryCounter}`,
      description: 'A test task.',
      category,
      tier,
    },
    status: 'queued',
    tier,
    goldReward: config.gold,
    clicksRequired: config.clicks,
    clicksRemaining: config.clicks,
    assignedMinionId: null,
    queuedAt: Date.now(),
    assignedQueue: null,
    ...overrides,
  };
}

export function makeSpecialOpTask(overrides: Partial<Task> = {}): Task {
  return makeTask({
    isSpecialOp: true,
    specialOpExpiry: Date.now() + 30_000,
    goldReward: Math.round(TIER_CONFIG['sinister'].gold * 1.5),
    tier: 'sinister',
    template: {
      name: 'Special Op',
      description: 'A limited-time special operation.',
      category: 'heists',
      tier: 'sinister',
    },
    ...overrides,
  });
}

/** Reset factory counter (call in afterEach if needed) */
export function resetTaskFactory(): void {
  _factoryCounter = 0;
}
