import type { Meta, StoryObj } from '@storybook/angular';
import { NotificationToastComponent } from './notification-toast.component';

const meta: Meta<NotificationToastComponent> = {
  title: 'Minion Manager/Molecules/NotificationToast',
  component: NotificationToastComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<NotificationToastComponent>;

export const GoldEarned: Story = {
  args: {
    notification: {
      id: '1',
      message: '+5g from "Forge Hall Passes"',
      type: 'gold',
      timestamp: Date.now(),
    },
  },
};

export const MinionHired: Story = {
  args: {
    notification: {
      id: '2',
      message: 'Grim has joined your evil crew!',
      type: 'minion',
      timestamp: Date.now(),
    },
  },
};

export const TaskComplete: Story = {
  args: {
    notification: {
      id: '3',
      message: 'Task completed!',
      type: 'task',
      timestamp: Date.now(),
    },
  },
};
