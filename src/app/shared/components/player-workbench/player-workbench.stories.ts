import type { Meta, StoryObj } from '@storybook/angular';
import { PlayerWorkbenchComponent } from './player-workbench.component';
import { Task, TaskCategory, TaskTier } from '../../../core/models/task.model';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  template: { name: 'Steal Lunch Money', description: 'Shake down the nerds.', category: 'schemes' as TaskCategory, tier: 'petty' as TaskTier },
  status: 'queued',
  tier: 'petty',
  goldReward: 5,
  timeToComplete: 8,
  timeRemaining: 8,
  clicksRequired: 10,
  clicksRemaining: 10,
  assignedMinionId: null,
  queuedAt: Date.now(),
  assignedQueue: 'player',
  ...overrides,
});

const meta: Meta<PlayerWorkbenchComponent> = {
  title: 'Minion Manager/Organisms/PlayerWorkbench',
  component: PlayerWorkbenchComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PlayerWorkbenchComponent>;

export const Empty: Story = {
  args: {
    tasks: [],
    clickPower: 1,
  },
};

export const WithTasks: Story = {
  args: {
    tasks: [
      makeTask({
        template: { name: 'Steal Lunch Money', description: 'Shake down the nerds.', category: 'schemes', tier: 'petty' },
        status: 'in-progress',
        clicksRemaining: 7,
      }),
      makeTask({
        template: { name: 'TP Hero\'s House', description: 'Classic TP bombardment.', category: 'mayhem', tier: 'petty' },
        goldReward: 6,
      }),
      makeTask({
        template: { name: 'Forge Hall Passes', description: 'Create convincing hall passes.', category: 'schemes', tier: 'petty' },
      }),
    ],
    clickPower: 1,
  },
};

export const ActiveClicking: Story = {
  args: {
    tasks: [
      makeTask({
        template: { name: 'Museum Night Raid', description: 'Break in after hours.', category: 'heists', tier: 'sinister' },
        tier: 'sinister',
        goldReward: 18,
        status: 'in-progress',
        clicksRequired: 20,
        clicksRemaining: 3,
      }),
    ],
    clickPower: 3,
  },
};

export const HighClickPower: Story = {
  args: {
    tasks: [
      makeTask({
        template: { name: 'Build Doomsday Device', description: 'Ultimate bargaining chip.', category: 'research', tier: 'diabolical' },
        tier: 'diabolical',
        goldReward: 48,
        status: 'in-progress',
        clicksRequired: 35,
        clicksRemaining: 20,
      }),
      makeTask({
        template: { name: 'Volcano Activation', description: 'Trigger a dormant volcano.', category: 'mayhem', tier: 'diabolical' },
        tier: 'diabolical',
        goldReward: 44,
      }),
    ],
    clickPower: 5,
  },
};
