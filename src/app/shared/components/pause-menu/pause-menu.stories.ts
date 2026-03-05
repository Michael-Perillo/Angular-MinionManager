import type { Meta, StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PauseMenuComponent } from './pause-menu.component';

const meta: Meta<PauseMenuComponent> = {
  title: 'Minion Manager/Organisms/PauseMenu',
  component: PauseMenuComponent,
  tags: ['autodocs'],
  args: {
    resume: fn(),
    toggleSound: fn(),
    abandonRun: fn(),
  },
};

export default meta;
type Story = StoryObj<PauseMenuComponent>;

export const Default: Story = {
  args: {
    soundEnabled: true,
  },
};

export const SoundOff: Story = {
  args: {
    soundEnabled: false,
  },
};

export const ResumeClick: Story = {
  args: {
    soundEnabled: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const resumeBtn = canvas.getByTestId('pause-resume');
    expect(resumeBtn).toBeTruthy();
    await userEvent.click(resumeBtn);
    expect(args.resume).toHaveBeenCalled();
  },
};

export const AbandonConfirmation: Story = {
  args: {
    soundEnabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click abandon
    const abandonBtn = canvas.getByTestId('pause-abandon');
    await userEvent.click(abandonBtn);

    // Confirm should be visible
    const confirmBtn = canvas.getByTestId('pause-abandon-confirm');
    expect(confirmBtn).toBeTruthy();
    expect(canvas.getByText(/Are you sure/)).toBeTruthy();
  },
};
