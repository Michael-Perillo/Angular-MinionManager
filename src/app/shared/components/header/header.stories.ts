import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
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
    villainLevel: 1,
    villainTitle: 'Petty Troublemaker',
    notoriety: 5,
    supplies: 0,
    intel: 0,
    raidActive: false,
    capturedCount: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify key stat values render
    expect(canvas.getByText(/15/)).toBeTruthy();
    expect(canvas.getByText(/Petty Troublemaker/)).toBeTruthy();
    expect(canvas.getByText(/Lv\. ?1/)).toBeTruthy();
  },
};

export const MidGame: Story = {
  args: {
    gold: 120,
    completedCount: 25,
    minionCount: 2,
    villainLevel: 4,
    villainTitle: 'Aspiring Villain',
    notoriety: 35,
    supplies: 8,
    intel: 5,
    raidActive: false,
    capturedCount: 0,
  },
};

export const LateGame: Story = {
  args: {
    gold: 1250,
    completedCount: 150,
    minionCount: 5,
    villainLevel: 8,
    villainTitle: 'Criminal Mastermind',
    notoriety: 72,
    supplies: 42,
    intel: 28,
    raidActive: false,
    capturedCount: 1,
  },
};

export const RaidActive: Story = {
  args: {
    gold: 800,
    completedCount: 80,
    minionCount: 4,
    villainLevel: 6,
    villainTitle: 'Notorious Scoundrel',
    notoriety: 85,
    supplies: 20,
    intel: 12,
    raidActive: true,
    capturedCount: 0,
  },
};

export const JustSaved: Story = {
  args: {
    gold: 500,
    completedCount: 50,
    minionCount: 3,
    villainLevel: 5,
    villainTitle: 'Notorious Scoundrel',
    notoriety: 47,
    supplies: 15,
    intel: 8,
    lastSaved: Date.now(),
    raidActive: false,
    capturedCount: 0,
  },
};
