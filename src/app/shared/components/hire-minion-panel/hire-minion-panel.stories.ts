import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { HireMinionPanelComponent } from './hire-minion-panel.component';
import { TaskCategory } from '../../../core/models/task.model';

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
    unlockedDepartments: new Set(['schemes', 'heists'] as TaskCategory[]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify "Scout Recruits" button is present and enabled
    const recruitButton = canvas.getByText(/Scout Recruits/);
    expect(recruitButton).toBeTruthy();

    // Click the recruit button — this emits the recruit output
    await userEvent.click(recruitButton);
  },
};

export const CannotAfford: Story = {
  args: {
    gold: 30,
    cost: 50,
    minionCount: 0,
    canHire: false,
    unlockedDepartments: new Set(['schemes', 'heists'] as TaskCategory[]),
  },
};

export const SecondMinion: Story = {
  args: {
    gold: 80,
    cost: 75,
    minionCount: 1,
    canHire: true,
    unlockedDepartments: new Set(['schemes', 'heists'] as TaskCategory[]),
  },
};

export const ExpensiveMinion: Story = {
  args: {
    gold: 100,
    cost: 253,
    minionCount: 4,
    canHire: false,
    unlockedDepartments: new Set(['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[]),
  },
};
