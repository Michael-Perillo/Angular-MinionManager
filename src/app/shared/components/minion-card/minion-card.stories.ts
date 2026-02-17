import type { Meta, StoryObj } from '@storybook/angular';
import { MinionCardComponent } from './minion-card.component';
import { Minion } from '../../../core/models';

const makeMinion = (overrides: Partial<Minion> = {}): Minion => ({
  id: 'minion-1',
  name: 'Grim',
  appearance: { color: '#6c3483', accessory: 'goggles' },
  status: 'idle',
  assignedTaskId: null,
  ...overrides,
});

const meta: Meta<MinionCardComponent> = {
  title: 'Minion Manager/Molecules/MinionCard',
  component: MinionCardComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MinionCardComponent>;

export const Idle: Story = {
  args: { minion: makeMinion() },
};

export const Working: Story = {
  args: {
    minion: makeMinion({
      status: 'working',
      assignedTaskId: 'task-1',
    }),
  },
};

export const WithHelmet: Story = {
  args: {
    minion: makeMinion({
      name: 'Skulk',
      appearance: { color: '#1a5276', accessory: 'helmet' },
    }),
  },
};

export const WithCape: Story = {
  args: {
    minion: makeMinion({
      name: 'Wraith',
      appearance: { color: '#7b241c', accessory: 'cape' },
    }),
  },
};

export const WithHorns: Story = {
  args: {
    minion: makeMinion({
      name: 'Doom',
      appearance: { color: '#1e8449', accessory: 'horns' },
    }),
  },
};
