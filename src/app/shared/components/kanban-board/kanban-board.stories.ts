import type { Meta, StoryObj } from '@storybook/angular';
import { KanbanBoardComponent } from './kanban-board.component';
import { Task, TaskCategory, TaskTier } from '../../../core/models/task.model';
import { Minion } from '../../../core/models/minion.model';
import { Department } from '../../../core/models/department.model';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  template: { name: 'Forge Hall Passes', description: 'Create convincing hall passes.', category: 'schemes' as TaskCategory, tier: 'petty' as TaskTier },
  status: 'queued',
  tier: 'petty',
  goldReward: 5,
  clicksRequired: 10,
  clicksRemaining: 10,
  assignedMinionId: null,
  queuedAt: Date.now(),
  assignedQueue: null,
  ...overrides,
});

const makeMinion = (overrides: Partial<Minion> = {}): Minion => ({
  id: crypto.randomUUID(),
  archetypeId: 'penny-pincher',
  role: 'worker',
  status: 'idle',
  assignedTaskId: null,
  assignedDepartment: 'schemes',
  ...overrides,
});

const makeDept = (cat: TaskCategory, level = 1): Department => ({
  category: cat,
  level,
  workerSlots: 1,
  hasManager: false,
});

const emptyQueues = (): Record<TaskCategory, Task[]> => ({
  schemes: [],
  heists: [],
  research: [],
  mayhem: [],
});

const defaultDepts = (): Record<TaskCategory, Department> => ({
  schemes: makeDept('schemes'),
  heists: makeDept('heists'),
  research: makeDept('research'),
  mayhem: makeDept('mayhem'),
});

const meta: Meta<KanbanBoardComponent> = {
  title: 'Minion Manager/Organisms/KanbanBoard',
  component: KanbanBoardComponent,
  tags: ['autodocs'],
  args: {
    deptEffectiveMults: { schemes: 1, heists: 1, research: 1, mayhem: 1 },
    bossPenalty: 0,
  },
  decorators: [
    (story) => ({
      ...story,
      styles: ['::ng-deep app-kanban-board { display: block; height: 600px; }'],
    }),
  ],
};

export default meta;
type Story = StoryObj<KanbanBoardComponent>;

export const EarlyGame: Story = {
  args: {
    departmentQueues: {
      ...emptyQueues(),
      schemes: [
        makeTask({ template: { name: 'Spread Rumors', description: 'Whisper campaigns.', category: 'schemes', tier: 'petty' }, assignedQueue: 'schemes' }),
      ],
    },
    departments: defaultDepts(),
    minions: [
      makeMinion({ archetypeId: 'penny-pincher', assignedDepartment: 'schemes' }),
    ],
    unlockedDepartments: ['schemes'] as TaskCategory[],
    clickPower: 1,
  },
};

const midTaskId = crypto.randomUUID();
const midMinionId = crypto.randomUUID();

export const MidGame: Story = {
  args: {
    departmentQueues: {
      schemes: [
        makeTask({ id: midTaskId, template: { name: 'Blackmail the Mayor', description: 'Leverage dirty secrets.', category: 'schemes', tier: 'sinister' }, tier: 'sinister', goldReward: 20, status: 'in-progress', assignedMinionId: midMinionId, assignedQueue: 'schemes' }),
        makeTask({ template: { name: 'Spread Rumors', description: 'Whisper campaigns.', category: 'schemes', tier: 'petty' }, assignedQueue: 'schemes' }),
      ],
      heists: [
        makeTask({ template: { name: 'Pilfer the Tip Jar', description: 'Swipe a few coins.', category: 'heists', tier: 'petty' }, goldReward: 8, assignedQueue: 'heists' }),
      ],
      research: [
        makeTask({ template: { name: 'Mix Stink Bombs', description: 'Brew a foul concoction.', category: 'research', tier: 'petty' }, assignedQueue: 'research' }),
      ],
      mayhem: [],
    },
    departments: {
      schemes: makeDept('schemes', 3),
      heists: makeDept('heists', 2),
      research: makeDept('research', 2),
      mayhem: makeDept('mayhem', 1),
    },
    minions: [
      makeMinion({ id: midMinionId, archetypeId: 'scheme-architect', assignedDepartment: 'schemes', status: 'working', assignedTaskId: midTaskId }),
      makeMinion({ archetypeId: 'vault-cracker', assignedDepartment: 'heists' }),
      makeMinion({ archetypeId: 'lab-rat', assignedDepartment: 'research' }),
      makeMinion({ archetypeId: 'corner-cutter', assignedDepartment: 'schemes' }),
    ],
    unlockedDepartments: ['schemes', 'heists', 'research'] as TaskCategory[],
    clickPower: 2,
    deptEffectiveMults: { schemes: 3, heists: 2, research: 2, mayhem: 1 },
  },
};

const lateIds = {
  t1: crypto.randomUUID(), t2: crypto.randomUUID(), t3: crypto.randomUUID(),
  m1: crypto.randomUUID(), m2: crypto.randomUUID(), m3: crypto.randomUUID(),
  m4: crypto.randomUUID(), m5: crypto.randomUUID(),
};

export const LateGame: Story = {
  args: {
    departmentQueues: {
      schemes: [
        makeTask({ id: lateIds.t1, template: { name: 'Infiltrate Council', description: 'Plant a spy.', category: 'schemes', tier: 'sinister' }, tier: 'sinister', goldReward: 20, status: 'in-progress', assignedMinionId: lateIds.m1, assignedQueue: 'schemes' }),
        makeTask({ template: { name: 'Rig the Lottery', description: 'Fix the numbers.', category: 'schemes', tier: 'diabolical' }, tier: 'diabolical', goldReward: 40, assignedQueue: 'schemes' }),
      ],
      heists: [
        makeTask({ id: lateIds.t2, template: { name: 'Museum Night Raid', description: 'Break in after hours.', category: 'heists', tier: 'sinister' }, tier: 'sinister', goldReward: 18, status: 'in-progress', assignedMinionId: lateIds.m3, assignedQueue: 'heists' }),
        makeTask({ template: { name: 'Steal the Moon', description: 'The ultimate heist.', category: 'heists', tier: 'legendary' }, tier: 'legendary', goldReward: 120, assignedQueue: 'heists' }),
      ],
      research: [
        makeTask({ id: lateIds.t3, template: { name: 'Build Doomsday Device', description: 'Ultimate bargaining chip.', category: 'research', tier: 'diabolical' }, tier: 'diabolical', goldReward: 48, status: 'in-progress', assignedMinionId: lateIds.m5, assignedQueue: 'research' }),
        makeTask({ template: { name: 'Clone Army Research', description: 'Mass production.', category: 'research', tier: 'legendary' }, tier: 'legendary', goldReward: 120, assignedQueue: 'research' }),
        makeTask({ template: { name: 'Weather Machine', description: 'Control the weather.', category: 'research', tier: 'sinister' }, tier: 'sinister', goldReward: 18, assignedQueue: 'research' }),
      ],
      mayhem: [
        makeTask({ template: { name: 'Volcano Activation', description: 'Trigger a dormant volcano.', category: 'mayhem', tier: 'diabolical' }, tier: 'diabolical', goldReward: 44, assignedQueue: 'mayhem' }),
        makeTask({ template: { name: 'Release Robot Swarm', description: 'Deploy tiny robots.', category: 'mayhem', tier: 'sinister' }, tier: 'sinister', goldReward: 15, assignedQueue: 'mayhem' }),
      ],
    },
    departments: {
      schemes: makeDept('schemes', 5),
      heists: makeDept('heists', 4),
      research: makeDept('research', 6),
      mayhem: makeDept('mayhem', 3),
    },
    minions: [
      makeMinion({ id: lateIds.m1, archetypeId: 'scheme-architect', assignedDepartment: 'schemes', status: 'working', assignedTaskId: lateIds.t1 }),
      makeMinion({ id: lateIds.m2, archetypeId: 'corner-cutter', assignedDepartment: 'schemes' }),
      makeMinion({ id: lateIds.m3, archetypeId: 'vault-cracker', assignedDepartment: 'heists', status: 'working', assignedTaskId: lateIds.t2 }),
      makeMinion({ id: lateIds.m4, archetypeId: 'demolitions-expert', assignedDepartment: 'mayhem' }),
      makeMinion({ id: lateIds.m5, archetypeId: 'eureka-catalyst', assignedDepartment: 'research', status: 'working', assignedTaskId: lateIds.t3 }),
    ],
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    clickPower: 5,
    deptEffectiveMults: { schemes: 5, heists: 4, research: 6, mayhem: 3 },
  },
};
