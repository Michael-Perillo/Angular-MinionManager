import type { Meta, StoryObj } from '@storybook/angular';
import { NotorietyBarComponent } from './notoriety-bar.component';

const meta: Meta<NotorietyBarComponent> = {
  title: 'Minion Manager/Organisms/NotorietyBar',
  component: NotorietyBarComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<NotorietyBarComponent>;

export const Unknown: Story = {
  args: {
    notoriety: 5,
    threatLevel: 'unknown',
    goldPenalty: 0,
    gold: 100,
    raidActive: false,
    raidTimer: 0,
  },
};

export const Suspicious: Story = {
  args: {
    notoriety: 25,
    threatLevel: 'suspicious',
    goldPenalty: 0,
    gold: 200,
    raidActive: false,
    raidTimer: 0,
  },
};

export const Wanted: Story = {
  args: {
    notoriety: 50,
    threatLevel: 'wanted',
    goldPenalty: 7,
    gold: 300,
    raidActive: false,
    raidTimer: 0,
  },
};

export const Hunted: Story = {
  args: {
    notoriety: 75,
    threatLevel: 'hunted',
    goldPenalty: 18,
    gold: 500,
    raidActive: false,
    raidTimer: 0,
  },
};

export const Infamous: Story = {
  args: {
    notoriety: 95,
    threatLevel: 'infamous',
    goldPenalty: 28,
    gold: 1000,
    raidActive: false,
    raidTimer: 0,
  },
};

export const RaidActive: Story = {
  args: {
    notoriety: 80,
    threatLevel: 'hunted',
    goldPenalty: 21,
    gold: 400,
    raidActive: true,
    raidTimer: 7,
  },
};

export const BrokeCantBribe: Story = {
  args: {
    notoriety: 60,
    threatLevel: 'wanted',
    goldPenalty: 12,
    gold: 10,
    raidActive: false,
    raidTimer: 0,
  },
};
