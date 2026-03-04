import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { HeaderComponent } from './header.component';
import { createInitialProgress, QuarterProgress } from '../../../core/models/quarter.model';

const meta: Meta<HeaderComponent> = {
  title: 'Minion Manager/Organisms/Header',
  component: HeaderComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<HeaderComponent>;

const earlyProgress: QuarterProgress = {
  ...createInitialProgress(),
  tasksCompleted: 8,
  grossGoldEarned: 35,
};

const midProgress: QuarterProgress = {
  ...createInitialProgress(),
  quarter: 2,
  tasksCompleted: 22,
  grossGoldEarned: 520,
};

const lateProgress: QuarterProgress = {
  year: 2,
  quarter: 3,
  tasksCompleted: 45,
  grossGoldEarned: 3200,
  isComplete: false,
  missedQuarters: 1,
  quarterResults: [],
  dismissalsRemaining: 5,
  researchCompleted: 0,
  activeBreakthroughs: 0,
};

export const EarlyGame: Story = {
  args: {
    gold: 15,
    completedCount: 3,
    minionCount: 0,
    quarterProgress: earlyProgress,
    quarterGold: 35,
    taskBudget: 30,
    goldTarget: 75,
    dismissalsRemaining: 5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify key stat values render
    expect(canvas.getByText(/15/)).toBeTruthy();
    expect(canvas.getByText(/Evil Empire/)).toBeTruthy();
    // Verify quarter indicator renders
    expect(canvas.getByText(/Y1Q1/)).toBeTruthy();
  },
};

export const MidGame: Story = {
  args: {
    gold: 120,
    completedCount: 25,
    minionCount: 2,
    quarterProgress: midProgress,
    quarterGold: 520,
    taskBudget: 40,
    goldTarget: 400,
  },
};

export const LateGame: Story = {
  args: {
    gold: 1250,
    completedCount: 150,
    minionCount: 5,
    quarterProgress: lateProgress,
    quarterGold: 3200,
    taskBudget: 70,
    goldTarget: 3888,
  },
};

export const JustSaved: Story = {
  args: {
    gold: 500,
    completedCount: 50,
    minionCount: 3,
    quarterProgress: earlyProgress,
    quarterGold: 35,
    taskBudget: 30,
    goldTarget: 75,
    lastSaved: Date.now(),
  },
};
