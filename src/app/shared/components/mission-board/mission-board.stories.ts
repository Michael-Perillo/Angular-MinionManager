import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { MissionBoardComponent } from './mission-board.component';
import { Task, TaskTier, TaskCategory } from '../../../core/models';
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
  assignedQueue: null,
  ...overrides,
});

const makeBoardMissions = (): Task[] => [
  makeTask({ template: { name: 'Forge Hall Passes', description: 'Create convincing hall passes.', category: 'schemes', tier: 'petty' }, tier: 'petty', goldReward: 5 }),
  makeTask({ template: { name: 'Museum Night Raid', description: 'Break in after hours.', category: 'heists', tier: 'sinister' }, tier: 'sinister', goldReward: 18 }),
  makeTask({ template: { name: 'Build Doomsday Device', description: 'Ultimate bargaining chip.', category: 'research', tier: 'diabolical' }, tier: 'diabolical', goldReward: 48 }),
  makeTask({ template: { name: 'Steal the Moon', description: 'The ultimate heist.', category: 'heists', tier: 'legendary' }, tier: 'legendary', goldReward: 120 }),
  makeTask({ template: { name: 'TP the Hero\'s House', description: 'Classic TP bombardment.', category: 'mayhem', tier: 'petty' }, tier: 'petty', goldReward: 6 }),
  makeTask({ template: { name: 'Infiltrate Council', description: 'Plant a spy.', category: 'schemes', tier: 'sinister' }, tier: 'sinister', goldReward: 20, isSpecialOp: true, specialOpExpiry: Date.now() + 30000 }),
  makeTask({ template: { name: 'Mix Stink Bombs', description: 'Brew a foul concoction.', category: 'research', tier: 'petty' }, tier: 'petty', goldReward: 5 }),
  makeTask({ template: { name: 'Bribe the Witnesses', description: 'Pay off everyone. Reduces notoriety.', category: 'schemes', tier: 'petty' }, tier: 'petty', goldReward: 0, isCoverOp: true }),
  makeTask({ template: { name: 'Release Robot Swarm', description: 'Deploy tiny robots.', category: 'mayhem', tier: 'sinister' }, tier: 'sinister', goldReward: 15 }),
  makeTask({ template: { name: 'Volcano Activation', description: 'Trigger a dormant volcano.', category: 'mayhem', tier: 'diabolical' }, tier: 'diabolical', goldReward: 44 }),
  makeTask({ template: { name: 'Jewel Store Heist', description: 'Crack display cases.', category: 'heists', tier: 'sinister' }, tier: 'sinister', goldReward: 16 }),
  makeTask({ template: { name: 'Brew Sleeping Potion', description: 'A mild sedative.', category: 'research', tier: 'petty' }, tier: 'petty', goldReward: 5 }),
];

const meta: Meta<MissionBoardComponent> = {
  title: 'Minion Manager/Organisms/MissionBoard',
  component: MissionBoardComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MissionBoardComponent>;

const allDepts = (): Record<TaskCategory, Department> => ({
  schemes: { category: 'schemes', level: 2, xp: 20 },
  heists: { category: 'heists', level: 2, xp: 20 },
  research: { category: 'research', level: 2, xp: 20 },
  mayhem: { category: 'mayhem', level: 2, xp: 20 },
});

export const FullBoard: Story = {
  args: {
    missions: makeBoardMissions(),
    activeCount: 1,
    activeSlots: 4,
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: allDepts(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all 12 mission cards render
    const cards = canvas.getAllByText(/Send to Queue/);
    expect(cards.length).toBe(12);

    // Verify special op card has the "Special" badge
    expect(canvas.getByText('Special')).toBeTruthy();

    // Verify cover op badge
    expect(canvas.getByText('Cover')).toBeTruthy();
  },
};

export const WithSortInteraction: Story = {
  args: {
    missions: makeBoardMissions(),
    activeCount: 1,
    activeSlots: 4,
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: allDepts(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find sort button — starts at "Default"
    const sortButton = canvas.getByText(/Default/);
    expect(sortButton).toBeTruthy();

    // Click to cycle to "Tier"
    await userEvent.click(sortButton);
    expect(canvas.getByText(/Tier/)).toBeTruthy();

    // Click to cycle to "Gold"
    await userEvent.click(canvas.getByText(/Tier/));
    expect(canvas.getByText(/Gold/)).toBeTruthy();

    // Click to cycle to "Time"
    await userEvent.click(canvas.getByText(/Gold/));
    expect(canvas.getByText(/Time/)).toBeTruthy();

    // Click to cycle back to "Default"
    await userEvent.click(canvas.getByText(/Time/));
    expect(canvas.getByText(/Default/)).toBeTruthy();
  },
};

export const BoardWithFullSlots: Story = {
  args: {
    missions: makeBoardMissions(),
    activeCount: 4,
    activeSlots: 4,
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: allDepts(),
  },
};

export const EmptyBoard: Story = {
  args: {
    missions: [],
    activeCount: 0,
    activeSlots: 3,
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: allDepts(),
  },
};

export const WithLockedFilters: Story = {
  args: {
    missions: makeBoardMissions(),
    activeCount: 0,
    activeSlots: 4,
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: {
      schemes: { category: 'schemes', level: 2, xp: 20 },
      heists: { category: 'heists', level: 1, xp: 0 },
      research: { category: 'research', level: 1, xp: 0 },
      mayhem: { category: 'mayhem', level: 1, xp: 0 },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Schemes is unlocked (level 2) — its emoji filter button should be clickable
    // Use getAllByText since the emoji also appears in mission card category icons
    const schemesElements = canvas.getAllByText('🗝️');
    const schemesButton = schemesElements.find(el => el.tagName === 'BUTTON');
    expect(schemesButton).toBeTruthy();

    // 3 locked departments should show lock icons
    const lockIcons = canvas.getAllByText('🔒');
    expect(lockIcons.length).toBe(3);

    // Lock icons should be spans (not clickable buttons)
    for (const lock of lockIcons) {
      expect(lock.tagName).toBe('SPAN');
    }

    // Click the Schemes filter — it should activate
    await userEvent.click(schemesButton!);
    expect(schemesButton!.className).toContain('bg-accent/20');
  },
};
