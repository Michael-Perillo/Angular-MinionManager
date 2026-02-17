import type { Meta, StoryObj } from '@storybook/angular';
import { MinionRosterComponent } from './minion-roster.component';
import { Minion } from '../../../core/models';

const makeMinions = (): Minion[] => [
  { id: '1', name: 'Grim', appearance: { color: '#6c3483', accessory: 'goggles' }, status: 'idle', assignedTaskId: null, stats: { speed: 1.1, efficiency: 0.9 }, specialty: 'schemes', xp: 5, level: 1 },
  { id: '2', name: 'Skulk', appearance: { color: '#1a5276', accessory: 'helmet' }, status: 'working', assignedTaskId: 'task-1', stats: { speed: 0.8, efficiency: 1.2 }, specialty: 'heists', xp: 18, level: 2 },
  { id: '3', name: 'Wraith', appearance: { color: '#7b241c', accessory: 'cape' }, status: 'idle', assignedTaskId: null, stats: { speed: 1.3, efficiency: 1.0 }, specialty: 'mayhem', xp: 0, level: 1 },
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
