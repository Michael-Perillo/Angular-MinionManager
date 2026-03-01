import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, fn, userEvent } from 'storybook/test';
import { QuarterReviewComponent } from './quarter-review.component';
import { QuarterResult } from '../../../core/models/quarter.model';

const makeResult = (overrides: Partial<QuarterResult> = {}): QuarterResult => ({
  year: 1,
  quarter: 1,
  passed: true,
  goldEarned: 120,
  target: 75,
  tasksCompleted: 30,
  ...overrides,
});

const meta: Meta<QuarterReviewComponent> = {
  title: 'Minion Manager/Molecules/QuarterReview',
  component: QuarterReviewComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<QuarterReviewComponent>;

export const Passed: Story = {
  args: {
    result: makeResult(),
    missedQuarters: 0,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement.parentElement!);

    // Heading
    expect(canvas.getByText('Q1 Year 1 Review')).toBeTruthy();

    // Pass badge
    expect(canvas.getByText('TARGET MET')).toBeTruthy();

    // Stats
    expect(canvas.getByText('120g / 75g')).toBeTruthy();
    expect(canvas.getByText('30')).toBeTruthy();

    // Continue button
    const btn = canvas.getByRole('button', { name: /Continue to Q2/i });
    expect(btn).toBeTruthy();
  },
};

export const Failed: Story = {
  args: {
    result: makeResult({ passed: false, goldEarned: 40, target: 75 }),
    missedQuarters: 0,
  },
};

export const FailedWithMissedQuarters: Story = {
  args: {
    result: makeResult({ passed: false, goldEarned: 50, target: 400, quarter: 2, tasksCompleted: 40 }),
    missedQuarters: 2,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.parentElement!);

    // Fail badge
    expect(canvas.getByText('TARGET MISSED')).toBeTruthy();

    // Missed quarters warning
    expect(canvas.getByText(/2 missed quarters this year/)).toBeTruthy();
  },
};

export const YearEnd: Story = {
  args: {
    result: makeResult({ quarter: 4, passed: true, goldEarned: 500, target: 0, tasksCompleted: 30 }),
    missedQuarters: 1,
  },
};

export const Mobile: Story = {
  args: {
    result: makeResult({ quarter: 3, passed: true, goldEarned: 1500, target: 1200, tasksCompleted: 60 }),
    missedQuarters: 0,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
