import type { Meta, StoryObj } from '@storybook/angular';
import { MissionRouterComponent } from './mission-router.component';
import { Task, TaskCategory, TaskTier } from '../../../core/models/task.model';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'mission-1',
  template: { name: 'Blackmail the Mayor', description: 'Leverage dirty secrets.', category: 'schemes' as TaskCategory, tier: 'sinister' as TaskTier },
  status: 'queued',
  tier: 'sinister',
  goldReward: 20,
  timeToComplete: 20,
  timeRemaining: 20,
  clicksRequired: 20,
  clicksRemaining: 20,
  assignedMinionId: null,
  queuedAt: Date.now(),
  assignedQueue: null,
  ...overrides,
});

const meta: Meta<MissionRouterComponent> = {
  title: 'Minion Manager/Molecules/MissionRouter',
  component: MissionRouterComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MissionRouterComponent>;

export const AllQueuesAvailable: Story = {
  args: {
    initiallyOpen: true,
    mission: makeTask(),
    deptQueueCounts: { schemes: 1, heists: 0, research: 2, mayhem: 0 },
    playerQueueCount: 1,
    isMobile: false,
  },
};

export const SomeQueuesFull: Story = {
  args: {
    initiallyOpen: true,
    mission: makeTask(),
    deptQueueCounts: { schemes: 5, heists: 4, research: 0, mayhem: 3 },
    playerQueueCount: 2,
    isMobile: false,
  },
};

export const MobileView: Story = {
  args: {
    initiallyOpen: true,
    mission: makeTask(),
    deptQueueCounts: { schemes: 2, heists: 1, research: 0, mayhem: 0 },
    playerQueueCount: 0,
    isMobile: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const EmptyQueues: Story = {
  args: {
    initiallyOpen: true,
    mission: makeTask(),
    deptQueueCounts: { schemes: 0, heists: 0, research: 0, mayhem: 0 },
    playerQueueCount: 0,
    isMobile: false,
  },
};
