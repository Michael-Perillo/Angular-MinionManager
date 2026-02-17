import type { Meta, StoryObj } from '@storybook/angular';
import { HeaderComponent } from './header.component';

const meta: Meta<HeaderComponent> = {
  title: 'Minion Manager/Organisms/Header',
  component: HeaderComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<HeaderComponent>;

export const EarlyGame: Story = {
  args: {
    gold: 15,
    completedCount: 3,
    minionCount: 0,
  },
};

export const MidGame: Story = {
  args: {
    gold: 120,
    completedCount: 25,
    minionCount: 2,
  },
};

export const LateGame: Story = {
  args: {
    gold: 1250,
    completedCount: 150,
    minionCount: 5,
  },
};
