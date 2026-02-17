import type { Meta, StoryObj } from '@storybook/angular';
import { HireMinionPanelComponent } from './hire-minion-panel.component';

const meta: Meta<HireMinionPanelComponent> = {
  title: 'Minion Manager/Molecules/HireMinionPanel',
  component: HireMinionPanelComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<HireMinionPanelComponent>;

export const CanAfford: Story = {
  args: {
    gold: 100,
    cost: 50,
    minionCount: 0,
    canHire: true,
  },
};

export const CannotAfford: Story = {
  args: {
    gold: 30,
    cost: 50,
    minionCount: 0,
    canHire: false,
  },
};

export const SecondMinion: Story = {
  args: {
    gold: 80,
    cost: 75,
    minionCount: 1,
    canHire: true,
  },
};

export const ExpensiveMinion: Story = {
  args: {
    gold: 100,
    cost: 253,
    minionCount: 4,
    canHire: false,
  },
};
