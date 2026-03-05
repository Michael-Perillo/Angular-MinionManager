import type { Meta, StoryObj } from '@storybook/angular';
import { fn, userEvent, within, expect } from 'storybook/test';
import { OptionsMenuComponent } from './options-menu.component';

const meta: Meta<OptionsMenuComponent> = {
  title: 'Minion Manager/Organisms/OptionsMenu',
  component: OptionsMenuComponent,
  tags: ['autodocs'],
  args: {
    back: fn(),
    toggleSound: fn(),
    abandonRun: fn(),
    resetAll: fn(),
  },
};

export default meta;
type Story = StoryObj<OptionsMenuComponent>;

export const WithActiveSave: Story = {
  args: {
    soundEnabled: true,
    hasActiveSave: true,
  },
};

export const WithoutSave: Story = {
  args: {
    soundEnabled: false,
    hasActiveSave: false,
  },
};

export const AbandonConfirmation: Story = {
  args: {
    soundEnabled: true,
    hasActiveSave: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const abandonBtn = canvas.getByTestId('options-abandon');
    await userEvent.click(abandonBtn);
    await expect(canvas.getByTestId('options-abandon-confirm')).toBeVisible();
  },
};

export const ResetConfirmation: Story = {
  args: {
    soundEnabled: true,
    hasActiveSave: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const resetBtn = canvas.getByTestId('options-reset-all');
    await userEvent.click(resetBtn);
    await expect(canvas.getByTestId('options-reset-confirm')).toBeVisible();
  },
};
