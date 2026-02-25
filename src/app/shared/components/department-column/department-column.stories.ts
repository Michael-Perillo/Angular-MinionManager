import type { Meta, StoryObj } from '@storybook/angular';
import { DepartmentColumnComponent } from './department-column.component';
import { Task, TaskCategory, TaskTier } from '../../../core/models/task.model';
import { Minion } from '../../../core/models/minion.model';
import { Department } from '../../../core/models/department.model';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  template: { name: 'Forge Hall Passes', description: 'Create convincing hall passes.', category: 'schemes' as TaskCategory, tier: 'petty' as TaskTier },
  status: 'queued',
  tier: 'petty',
  goldReward: 5,
  timeToComplete: 8,
  timeRemaining: 8,
  clicksRequired: 10,
  clicksRemaining: 10,
  assignedMinionId: null,
  queuedAt: Date.now(),
  assignedQueue: 'schemes',
  ...overrides,
});

const makeMinion = (overrides: Partial<Minion> = {}): Minion => ({
  id: crypto.randomUUID(),
  name: 'Grim',
  appearance: { color: '#6c3483', accessory: 'goggles' },
  status: 'idle',
  assignedTaskId: null,
  stats: { speed: 1.0, efficiency: 1.1 },
  specialty: 'schemes',
  assignedDepartment: 'schemes',
  xp: 0,
  level: 1,
  ...overrides,
});

const makeDept = (overrides: Partial<Department> = {}): Department => ({
  category: 'schemes',
  xp: 0,
  level: 1,
  ...overrides,
});

const meta: Meta<DepartmentColumnComponent> = {
  title: 'Minion Manager/Organisms/DepartmentColumn',
  component: DepartmentColumnComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<DepartmentColumnComponent>;

export const Empty: Story = {
  args: {
    category: 'schemes',
    tasks: [],
    department: makeDept(),
    assignedMinions: [],
  },
};

export const SingleMinion: Story = {
  args: {
    category: 'schemes',
    tasks: [
      makeTask({ template: { name: 'Forge Hall Passes', description: 'Create convincing hall passes.', category: 'schemes', tier: 'petty' } }),
    ],
    department: makeDept({ level: 2 }),
    assignedMinions: [makeMinion({ name: 'Grim' })],
  },
};

const workingTaskId = crypto.randomUUID();
const workingMinionId = crypto.randomUUID();

export const MultipleMinions: Story = {
  args: {
    category: 'heists',
    tasks: [
      makeTask({
        id: workingTaskId,
        template: { name: 'Museum Night Raid', description: 'Break in after hours.', category: 'heists', tier: 'sinister' },
        tier: 'sinister',
        goldReward: 18,
        status: 'in-progress',
        assignedMinionId: workingMinionId,
        timeRemaining: 12,
        timeToComplete: 20,
        assignedQueue: 'heists',
      }),
      makeTask({
        template: { name: 'Pilfer the Tip Jar', description: 'Swipe a few coins.', category: 'heists', tier: 'petty' },
        goldReward: 8,
        assignedQueue: 'heists',
      }),
      makeTask({
        template: { name: 'Jewel Store Heist', description: 'Crack display cases.', category: 'heists', tier: 'sinister' },
        tier: 'sinister',
        goldReward: 16,
        assignedQueue: 'heists',
      }),
    ],
    department: makeDept({ category: 'heists', level: 3, xp: 60 }),
    assignedMinions: [
      makeMinion({
        id: workingMinionId,
        name: 'Skulk',
        appearance: { color: '#1a5276', accessory: 'helmet' },
        specialty: 'heists',
        assignedDepartment: 'heists',
        status: 'working',
        assignedTaskId: workingTaskId,
        level: 3,
      }),
      makeMinion({
        name: 'Wraith',
        appearance: { color: '#7b241c', accessory: 'cape' },
        specialty: 'heists',
        assignedDepartment: 'heists',
        level: 2,
      }),
    ],
  },
};

export const FullQueue: Story = {
  args: {
    category: 'research',
    tasks: [
      makeTask({ template: { name: 'Mix Stink Bombs', description: 'Brew a foul concoction.', category: 'research', tier: 'petty' }, goldReward: 5, assignedQueue: 'research' }),
      makeTask({ template: { name: 'Brew Sleeping Potion', description: 'A mild sedative.', category: 'research', tier: 'petty' }, goldReward: 5, assignedQueue: 'research' }),
      makeTask({ template: { name: 'Build Doomsday Device', description: 'Ultimate bargaining chip.', category: 'research', tier: 'diabolical' }, tier: 'diabolical', goldReward: 48, assignedQueue: 'research' }),
      makeTask({ template: { name: 'Clone Army Research', description: 'Mass production.', category: 'research', tier: 'legendary' }, tier: 'legendary', goldReward: 120, assignedQueue: 'research' }),
      makeTask({ template: { name: 'Weather Machine', description: 'Control the weather.', category: 'research', tier: 'sinister' }, tier: 'sinister', goldReward: 18, assignedQueue: 'research' }),
    ],
    department: makeDept({ category: 'research', level: 5, xp: 200 }),
    assignedMinions: [
      makeMinion({ name: 'Hex', appearance: { color: '#1e8449', accessory: 'horns' }, specialty: 'research', assignedDepartment: 'research', level: 4 }),
    ],
  },
};

export const WithSpecialtyBonus: Story = {
  args: {
    category: 'mayhem',
    tasks: [
      makeTask({
        template: { name: 'TP Hero\'s House', description: 'Classic TP bombardment.', category: 'mayhem', tier: 'petty' },
        goldReward: 6,
        assignedQueue: 'mayhem',
      }),
      makeTask({
        template: { name: 'Release Robot Swarm', description: 'Deploy tiny robots.', category: 'mayhem', tier: 'sinister' },
        tier: 'sinister',
        goldReward: 15,
        assignedQueue: 'mayhem',
      }),
    ],
    department: makeDept({ category: 'mayhem', level: 2, xp: 20 }),
    assignedMinions: [
      makeMinion({
        name: 'Doom',
        appearance: { color: '#b9770e', accessory: 'horns' },
        specialty: 'mayhem',
        assignedDepartment: 'mayhem',
        level: 3,
      }),
    ],
  },
};
