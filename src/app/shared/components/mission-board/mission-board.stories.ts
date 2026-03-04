import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { MissionBoardComponent } from './mission-board.component';
import { Task, TaskTier, TaskCategory, ComboState } from '../../../core/models';
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

const makeBoardMissions = (): Task[] => [
  makeTask({ template: { name: 'Forge Hall Passes', description: 'petty scheme → 1× Heists ops', category: 'schemes', tier: 'petty' }, tier: 'petty', goldReward: 1, schemeTargetDept: 'heists', schemeOperationCount: 1 }),
  makeTask({ template: { name: 'Museum Night Raid', description: 'sinister scheme → 2× Heists ops', category: 'schemes', tier: 'sinister' }, tier: 'sinister', goldReward: 2, schemeTargetDept: 'heists', schemeOperationCount: 2 }),
  makeTask({ template: { name: 'Build Doomsday Device', description: 'diabolical scheme → 3× Research ops', category: 'schemes', tier: 'diabolical' }, tier: 'diabolical', goldReward: 3, schemeTargetDept: 'research', schemeOperationCount: 3 }),
  makeTask({ template: { name: 'Steal the Moon', description: 'legendary scheme → 3× Heists ops', category: 'schemes', tier: 'legendary' }, tier: 'legendary', goldReward: 5, schemeTargetDept: 'heists', schemeOperationCount: 3 }),
  makeTask({ template: { name: 'TP the Hero\'s House', description: 'petty scheme → 2× Mayhem ops', category: 'schemes', tier: 'petty' }, tier: 'petty', goldReward: 1, schemeTargetDept: 'mayhem', schemeOperationCount: 2 }),
  makeTask({ template: { name: 'Infiltrate Council', description: 'sinister scheme → 2× Research ops', category: 'schemes', tier: 'sinister' }, tier: 'sinister', goldReward: 2, isSpecialOp: true, schemeTargetDept: 'research', schemeOperationCount: 2 }),
  makeTask({ template: { name: 'Mix Stink Bombs', description: 'petty scheme → 1× Research ops', category: 'schemes', tier: 'petty' }, tier: 'petty', goldReward: 1, schemeTargetDept: 'research', schemeOperationCount: 1 }),
  makeTask({ template: { name: 'Train the Guards', description: 'petty scheme → 2× Mayhem ops', category: 'schemes', tier: 'petty' }, tier: 'petty', goldReward: 1, schemeTargetDept: 'mayhem', schemeOperationCount: 2 }),
  makeTask({ template: { name: 'Release Robot Swarm', description: 'sinister scheme → 1× Mayhem ops', category: 'schemes', tier: 'sinister' }, tier: 'sinister', goldReward: 2, schemeTargetDept: 'mayhem', schemeOperationCount: 1 }),
  makeTask({ template: { name: 'Volcano Activation', description: 'diabolical scheme → 2× Mayhem ops', category: 'schemes', tier: 'diabolical' }, tier: 'diabolical', goldReward: 3, schemeTargetDept: 'mayhem', schemeOperationCount: 2 }),
  makeTask({ template: { name: 'Jewel Store Heist', description: 'sinister scheme → 2× Heists ops', category: 'schemes', tier: 'sinister' }, tier: 'sinister', goldReward: 2, schemeTargetDept: 'heists', schemeOperationCount: 2 }),
  makeTask({ template: { name: 'Brew Sleeping Potion', description: 'petty scheme → 1× Research ops', category: 'schemes', tier: 'petty' }, tier: 'petty', goldReward: 1, schemeTargetDept: 'research', schemeOperationCount: 1 }),
];

const defaultDeckCounts = (): Record<TaskTier, number> => ({
  petty: 12, sinister: 8, diabolical: 4, legendary: 1,
});

const meta: Meta<MissionBoardComponent> = {
  title: 'Minion Manager/Organisms/MissionBoard',
  component: MissionBoardComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MissionBoardComponent>;

const allDepts = (): Record<TaskCategory, Department> => ({
  schemes: { category: 'schemes', level: 2, workerSlots: 1, hasManager: false },
  heists: { category: 'heists', level: 2, workerSlots: 1, hasManager: false },
  research: { category: 'research', level: 2, workerSlots: 1, hasManager: false },
  mayhem: { category: 'mayhem', level: 2, workerSlots: 1, hasManager: false },
});

export const FullBoard: Story = {
  args: {
    missions: makeBoardMissions(),
    schemesQueueFull: false,
    dismissalsRemaining: 3,
    tasksCompleted: 8,
    taskBudget: 25,
    deckRemaining: 22,
    deckTotal: 30,
    deckTierCounts: defaultDeckCounts(),
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: allDepts(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all 12 execute buttons render
    const cards = canvas.getAllByText(/Execute/);
    expect(cards.length).toBe(12);

    // Verify special op card has the "Special" badge
    expect(canvas.getByText('Special')).toBeTruthy();

    // Verify budget/dismissals footer
    expect(canvas.getByText(/Budget: 8\/25/)).toBeTruthy();
    expect(canvas.getByText(/Dismissals: 3\/5/)).toBeTruthy();

    // Verify deck counter renders
    expect(canvas.getByText(/22\/30/)).toBeTruthy();
  },
};

export const WithSortInteraction: Story = {
  args: {
    missions: makeBoardMissions(),
    schemesQueueFull: false,
    dismissalsRemaining: 5,
    tasksCompleted: 0,
    taskBudget: 25,
    deckRemaining: 25,
    deckTotal: 30,
    deckTierCounts: defaultDeckCounts(),
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

    // Click to cycle to "Clicks"
    await userEvent.click(canvas.getByText(/Gold/));
    expect(canvas.getByText(/Clicks/)).toBeTruthy();

    // Click to cycle back to "Default"
    await userEvent.click(canvas.getByText(/Clicks/));
    expect(canvas.getByText(/Default/)).toBeTruthy();
  },
};

export const WithDeckBreakdown: Story = {
  args: {
    missions: [],
    schemesQueueFull: false,
    dismissalsRemaining: 5,
    tasksCompleted: 3,
    taskBudget: 25,
    deckRemaining: 22,
    deckTotal: 30,
    deckTierCounts: { petty: 10, sinister: 6, diabolical: 4, legendary: 2 },
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: allDepts(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click deck counter to expand tier breakdown
    const deckButton = canvas.getByText(/22\/30/);
    await userEvent.click(deckButton);

    // Verify tier labels appear (no mission cards so no tier badge collisions)
    expect(canvas.getByText('petty')).toBeTruthy();
    expect(canvas.getByText('sinister')).toBeTruthy();
    expect(canvas.getByText('diabolical')).toBeTruthy();
    expect(canvas.getByText('legendary')).toBeTruthy();

    // Verify counts render
    expect(canvas.getByText('10')).toBeTruthy();
    expect(canvas.getByText('6')).toBeTruthy();

    // Click again to collapse
    await userEvent.click(deckButton);

    // Tier labels should be gone
    const pettyLabels = canvas.queryAllByText('petty');
    expect(pettyLabels.length).toBe(0);
  },
};

export const EmptyDeck: Story = {
  args: {
    missions: [],
    schemesQueueFull: false,
    deckRemaining: 0,
    deckTotal: 30,
    deckTierCounts: { petty: 0, sinister: 0, diabolical: 0, legendary: 0 },
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: allDepts(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Empty deck message shows
    expect(canvas.getByText(/Deck empty/)).toBeTruthy();

    // Deck counter shows 0
    expect(canvas.getByText(/0\/30/)).toBeTruthy();
  },
};

export const BoardWithFullSlots: Story = {
  args: {
    missions: makeBoardMissions(),
    schemesQueueFull: true,
    dismissalsRemaining: 0,
    tasksCompleted: 20,
    taskBudget: 25,
    deckRemaining: 5,
    deckTotal: 30,
    deckTierCounts: { petty: 3, sinister: 1, diabolical: 1, legendary: 0 },
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: allDepts(),
  },
};

export const EmptyBoard: Story = {
  args: {
    missions: [],
    schemesQueueFull: false,
    deckRemaining: 15,
    deckTotal: 30,
    deckTierCounts: { petty: 8, sinister: 4, diabolical: 2, legendary: 1 },
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: allDepts(),
  },
};

export const WithActiveCombo: Story = {
  args: {
    missions: makeBoardMissions(),
    schemesQueueFull: false,
    dismissalsRemaining: 3,
    tasksCompleted: 8,
    taskBudget: 25,
    deckRemaining: 17,
    deckTotal: 30,
    deckTierCounts: defaultDeckCounts(),
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: allDepts(),
    comboState: {
      deptFocus: { dept: 'heists', count: 3 },
      tierLadder: { lastTier: 'petty', step: 2 },
    } as ComboState,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Combo tracker should be visible
    const tracker = canvasElement.querySelector('[data-testid="combo-tracker"]');
    expect(tracker).toBeTruthy();

    // Focus tracker shows heists focus ×3 (+2)
    expect(canvas.getByText(/Focus/)).toBeTruthy();
    expect(canvas.getByText(/×3/)).toBeTruthy();

    // Ladder tracker shows step 2 (+2)
    expect(canvas.getByText(/Ladder/)).toBeTruthy();

    // Preview badges should appear on heists-targeting schemes (right-aligned gold area)
    const previews = canvasElement.querySelectorAll('[data-testid="combo-gold-preview"]');
    expect(previews.length).toBeGreaterThan(0);
  },
};

export const WithLockedFilters: Story = {
  args: {
    missions: makeBoardMissions(),
    schemesQueueFull: false,
    dismissalsRemaining: 5,
    tasksCompleted: 0,
    taskBudget: 25,
    deckRemaining: 25,
    deckTotal: 30,
    deckTierCounts: defaultDeckCounts(),
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
    departments: {
      schemes: { category: 'schemes', level: 2, workerSlots: 1, hasManager: false },
      heists: { category: 'heists', level: 1, workerSlots: 1, hasManager: false },
      research: { category: 'research', level: 1, workerSlots: 1, hasManager: false },
      mayhem: { category: 'mayhem', level: 1, workerSlots: 1, hasManager: false },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Heists/Research/Mayhem at level 1 show lock icons (3 execution depts)
    const lockIcons = canvas.getAllByText('🔒');
    expect(lockIcons.length).toBe(3);

    // Lock icons should be spans (not clickable buttons)
    for (const lock of lockIcons) {
      expect(lock.tagName).toBe('SPAN');
    }
  },
};
