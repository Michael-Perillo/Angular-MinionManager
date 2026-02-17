import type { Meta, StoryObj } from '@storybook/angular';
import { TaskQueueComponent } from './task-queue.component';
import { Task } from '../../../core/models';

const makeTasks = (): Task[] => [
  {
    id: '1',
    template: { name: 'Forge Hall Passes', description: 'Create convincing hall passes.', category: 'schemes', tier: 'petty' },
    status: 'queued', tier: 'petty', goldReward: 5,
    timeToComplete: 8, timeRemaining: 8, clicksRequired: 10, clicksRemaining: 10,
    assignedMinionId: null, queuedAt: Date.now(),
  },
  {
    id: '2',
    template: { name: 'Museum Night Raid', description: 'Break in after hours for a priceless artifact.', category: 'heists', tier: 'sinister' },
    status: 'in-progress', tier: 'sinister', goldReward: 15,
    timeToComplete: 20, timeRemaining: 12, clicksRequired: 20, clicksRemaining: 8,
    assignedMinionId: null, queuedAt: Date.now(),
  },
  {
    id: '3',
    template: { name: 'Build a Doomsday Device', description: 'The ultimate bargaining chip.', category: 'research', tier: 'diabolical' },
    status: 'in-progress', tier: 'diabolical', goldReward: 40,
    timeToComplete: 45, timeRemaining: 30, clicksRequired: 35, clicksRemaining: 35,
    assignedMinionId: 'minion-1', queuedAt: Date.now(),
  },
];

const meta: Meta<TaskQueueComponent> = {
  title: 'Minion Manager/Organisms/ActiveMissions',
  component: TaskQueueComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<TaskQueueComponent>;

export const WithActiveMissions: Story = {
  args: { tasks: makeTasks(), capacity: 5 },
};

export const Empty: Story = {
  args: { tasks: [], capacity: 3 },
};

export const AtCapacity: Story = {
  args: { tasks: makeTasks(), capacity: 3 },
};
