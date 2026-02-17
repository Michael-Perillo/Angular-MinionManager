import type { Meta, StoryObj } from '@storybook/angular';
import { MinionRosterComponent } from './minion-roster.component';
import { Minion } from '../../../core/models';

const makeMinions = (): Minion[] => [
  { id: '1', name: 'Grim', appearance: { color: '#6c3483', accessory: 'goggles' }, status: 'idle', assignedTaskId: null },
  { id: '2', name: 'Skulk', appearance: { color: '#1a5276', accessory: 'helmet' }, status: 'working', assignedTaskId: 'task-1' },
  { id: '3', name: 'Wraith', appearance: { color: '#7b241c', accessory: 'cape' }, status: 'idle', assignedTaskId: null },
];

const meta: Meta<MinionRosterComponent> = {
  title: 'Minion Manager/Organisms/MinionRoster',
  component: MinionRosterComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MinionRosterComponent>;

export const WithMinions: Story = {
  args: { minions: makeMinions() },
};

export const Empty: Story = {
  args: { minions: [] },
};
