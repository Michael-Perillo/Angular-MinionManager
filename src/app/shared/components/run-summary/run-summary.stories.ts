import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { RunSummaryComponent } from './run-summary.component';
import { RunSummary } from '../../../core/models/meta.model';

function makeSummary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    endedAt: Date.now(),
    yearsSurvived: 1,
    quartersPassed: 3,
    quartersPlayed: 3,
    totalGoldEarned: 800,
    totalTasksCompleted: 120,
    bossesBeaten: 0,
    infamyEarned: 63,
    ...overrides,
  };
}

const meta: Meta<RunSummaryComponent> = {
  title: 'Minion Manager/Organisms/RunSummary',
  component: RunSummaryComponent,
  tags: ['autodocs'],
  args: {
    returnToMenu: fn(),
  },
};

export default meta;
type Story = StoryObj<RunSummaryComponent>;

export const Year1Failure: Story = {
  args: {
    summary: makeSummary(),
    newDiscoveries: { archetypes: 3, tasks: 8, reviewers: 1, modifiers: 2 },
  },
};

export const Year3Success: Story = {
  args: {
    summary: makeSummary({
      yearsSurvived: 3,
      quartersPassed: 9,
      quartersPlayed: 9,
      totalGoldEarned: 15000,
      totalTasksCompleted: 450,
      bossesBeaten: 2,
      infamyEarned: 310,
    }),
    newDiscoveries: { archetypes: 0, tasks: 2, reviewers: 0, modifiers: 1 },
  },
};

export const NoDiscoveries: Story = {
  args: {
    summary: makeSummary(),
    newDiscoveries: { archetypes: 0, tasks: 0, reviewers: 0, modifiers: 0 },
  },
};
