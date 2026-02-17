import type { Meta, StoryObj } from '@storybook/angular';
import { TaskCardComponent } from './task-card.component';
import { Task } from '../../../core/models';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  template: {
    name: 'Forge Hall Passes',
    description: 'Create convincing hall passes for sneaking around.',
    category: 'schemes',
    tier: 'petty',
  },
  status: 'queued',
  tier: 'petty',
  goldReward: 5,
  timeToComplete: 8,
  timeRemaining: 8,
  clicksRequired: 10,
  clicksRemaining: 10,
  assignedMinionId: null,
  queuedAt: Date.now(),
  ...overrides,
});

const meta: Meta<TaskCardComponent> = {
  title: 'Minion Manager/Molecules/TaskCard',
  component: TaskCardComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<TaskCardComponent>;

export const QueuedPetty: Story = {
  args: { task: makeTask() },
};

export const QueuedSinister: Story = {
  args: {
    task: makeTask({
      template: {
        name: 'Museum Night Raid',
        description: 'Break in after hours for a priceless artifact.',
        category: 'heists',
        tier: 'sinister',
      },
      tier: 'sinister',
      goldReward: 15,
      timeToComplete: 20,
      timeRemaining: 20,
      clicksRequired: 20,
      clicksRemaining: 20,
    }),
  },
};

export const QueuedDiabolical: Story = {
  args: {
    task: makeTask({
      template: {
        name: 'Build a Doomsday Device',
        description: 'The ultimate bargaining chip for world domination.',
        category: 'research',
        tier: 'diabolical',
      },
      tier: 'diabolical',
      goldReward: 40,
      timeToComplete: 45,
      timeRemaining: 45,
      clicksRequired: 35,
      clicksRemaining: 35,
    }),
  },
};

export const InProgressManual: Story = {
  args: {
    task: makeTask({
      status: 'in-progress',
      clicksRemaining: 4,
    }),
  },
};

export const InProgressMinion: Story = {
  args: {
    task: makeTask({
      status: 'in-progress',
      assignedMinionId: 'minion-1',
      timeRemaining: 5,
    }),
  },
};
