import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
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
  clicksRequired: 10,
  clicksRemaining: 10,
  assignedMinionId: null,
  queuedAt: Date.now(),
  assignedQueue: 'schemes',
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

const makeDept = (overrides: Partial<Department> = {}): Department => ({
  category: 'schemes',
  level: 1,
  workerSlots: 1,
  hasManager: false,
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
    assignedMinions: [makeMinion({ archetypeId: 'penny-pincher' })],
    deptEffectiveMult: 2,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify minion archetype name renders
    expect(canvas.getByText('Penny Pincher')).toBeTruthy();

    // Verify queue section renders with task
    expect(canvas.getByText('Forge Hall Passes')).toBeTruthy();

    // Verify payout block shows mult breakdown (multiple ×2 elements: header + task)
    const multElements = canvas.getAllByText(/×2/);
    expect(multElements.length).toBeGreaterThanOrEqual(2);
    expect(canvas.getByText(/~10g/)).toBeTruthy();
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
    department: makeDept({ category: 'heists', level: 3 }),
    deptEffectiveMult: 3,
    assignedMinions: [
      makeMinion({
        id: workingMinionId,
        archetypeId: 'vault-cracker',
        assignedDepartment: 'heists',
        status: 'working',
        assignedTaskId: workingTaskId,
      }),
      makeMinion({
        archetypeId: 'safe-hands',
        assignedDepartment: 'heists',
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
    department: makeDept({ category: 'research', level: 5 }),
    deptEffectiveMult: 5,
    assignedMinions: [
      makeMinion({ archetypeId: 'lab-rat', assignedDepartment: 'research' }),
    ],
  },
};

export const WithManager: Story = {
  args: {
    category: 'mayhem',
    tasks: [
      makeTask({
        template: { name: "TP Hero's House", description: 'Classic TP bombardment.', category: 'mayhem', tier: 'petty' },
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
    department: makeDept({ category: 'mayhem', level: 2 }),
    deptEffectiveMult: 2,
    assignedMinions: [
      makeMinion({
        archetypeId: 'demolitions-expert',
        role: 'manager',
        assignedDepartment: 'mayhem',
      }),
      makeMinion({
        archetypeId: 'taskmaster',
        assignedDepartment: 'mayhem',
      }),
    ],
  },
};

export const WithOperations: Story = {
  args: {
    category: 'heists',
    tasks: [
      makeTask({
        template: { name: 'Case the Museum', description: 'Scout the layout.', category: 'heists', tier: 'petty' },
        goldReward: 5,
        assignedQueue: 'heists',
      }),
      makeTask({
        template: { name: 'Bypass Alarm System', description: 'Disable security grid.', category: 'heists', tier: 'sinister' },
        tier: 'sinister',
        goldReward: 12,
        assignedQueue: 'heists',
        isOperation: true,
      }),
      makeTask({
        template: { name: 'Crack the Vault', description: 'Open the main vault.', category: 'heists', tier: 'diabolical' },
        tier: 'diabolical',
        goldReward: 30,
        assignedQueue: 'heists',
        isOperation: true,
        isSpecialOp: true,
      }),
      makeTask({
        template: { name: 'Steal the Diamond', description: 'Grab the prize.', category: 'heists', tier: 'sinister' },
        tier: 'sinister',
        goldReward: 16,
        assignedQueue: 'heists',
        isOperation: true,
      }),
    ],
    department: makeDept({ category: 'heists', level: 3 }),
    deptEffectiveMult: 3,
    assignedMinions: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Regular task (no OP badge)
    expect(canvas.getByText('Case the Museum')).toBeTruthy();

    // Operations should show OP badges
    const opBadges = canvas.getAllByText('OP');
    expect(opBadges.length).toBe(3); // 3 operations in queue

    // Special op task should render
    expect(canvas.getByText('Crack the Vault')).toBeTruthy();
  },
};

export const WithHighMult: Story = {
  args: {
    category: 'heists',
    tasks: [
      makeTask({
        template: { name: 'Vault Heist', description: 'Crack the vault.', category: 'heists', tier: 'sinister' },
        tier: 'sinister',
        goldReward: 8,
        assignedQueue: 'heists',
        isSpecialOp: true,
        comboMult: 2,
      }),
      makeTask({
        template: { name: 'Quick Grab', description: 'Grab and go.', category: 'heists', tier: 'petty' },
        goldReward: 3,
        assignedQueue: 'heists',
      }),
    ],
    department: makeDept({ category: 'heists', level: 5 }),
    deptEffectiveMult: 6,
    activeBreakthroughs: 1,
    assignedMinions: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // High-mult story: special op task (8g) with effectiveMult=6 + specialOp+1 + combo+2 = 9
    // Should show base, multiplier, and expected gold
    expect(canvas.getByText(/Vault Heist/)).toBeTruthy();
    expect(canvas.getByText(/~72g/)).toBeTruthy(); // 8 × 9

    // Non-special task (3g) with effectiveMult=6 → ~18g
    expect(canvas.getByText(/Quick Grab/)).toBeTruthy();
    expect(canvas.getByText(/~18g/)).toBeTruthy(); // 3 × 6
  },
};
