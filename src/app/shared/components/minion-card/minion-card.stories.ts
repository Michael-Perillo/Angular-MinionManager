import type { Meta, StoryObj } from '@storybook/angular';
import { MinionCardComponent } from './minion-card.component';
import { Minion } from '../../../core/models';

const makeMinion = (overrides: Partial<Minion> = {}): Minion => ({
  id: 'minion-1',
  archetypeId: 'penny-pincher',
  role: 'worker',
  status: 'idle',
  assignedTaskId: null,
  assignedDepartment: 'schemes',
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

export const UncommonMinion: Story = {
  args: {
    minion: makeMinion({
      archetypeId: 'vault-cracker',
      assignedDepartment: 'heists',
    }),
  },
};

export const RareMinion: Story = {
  args: {
    minion: makeMinion({
      archetypeId: 'golden-touch',
    }),
  },
};

export const Manager: Story = {
  args: {
    minion: makeMinion({
      archetypeId: 'drill-sergeant',
      role: 'manager',
      assignedDepartment: 'schemes',
    }),
  },
};

export const Unassigned: Story = {
  args: {
    minion: makeMinion({
      archetypeId: 'overdriver',
      assignedDepartment: null,
    }),
  },
};
