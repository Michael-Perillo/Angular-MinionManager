import type { Meta, StoryObj } from '@storybook/angular';
import { RunOverComponent } from './run-over.component';
import { QuarterResult } from '../../../core/models/quarter.model';

const meta: Meta<RunOverComponent> = {
  title: 'Minion Manager/Organisms/RunOver',
  component: RunOverComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<RunOverComponent>;

const year1Results: QuarterResult[] = [
  { year: 1, quarter: 1, passed: true, goldEarned: 120, target: 75, tasksCompleted: 30 },
  { year: 1, quarter: 2, passed: true, goldEarned: 500, target: 400, tasksCompleted: 40 },
  { year: 1, quarter: 3, passed: false, goldEarned: 900, target: 1200, tasksCompleted: 60 },
  { year: 1, quarter: 4, passed: false, goldEarned: 80, target: 200, tasksCompleted: 30 },
];

const year2Results: QuarterResult[] = [
  ...year1Results.slice(0, 3),
  { year: 1, quarter: 4, passed: true, goldEarned: 300, target: 200, tasksCompleted: 30 },
  { year: 2, quarter: 1, passed: true, goldEarned: 250, target: 135, tasksCompleted: 40 },
  { year: 2, quarter: 2, passed: false, goldEarned: 500, target: 720, tasksCompleted: 50 },
  { year: 2, quarter: 3, passed: true, goldEarned: 2500, target: 2160, tasksCompleted: 70 },
  { year: 2, quarter: 4, passed: false, goldEarned: 200, target: 540, tasksCompleted: 40 },
];

export const Year1Failure: Story = {
  args: {
    quarterResults: year1Results,
    totalGold: 1600,
    totalTasks: 160,
  },
};

export const Year2Failure: Story = {
  args: {
    quarterResults: year2Results,
    totalGold: 5350,
    totalTasks: 420,
  },
};
