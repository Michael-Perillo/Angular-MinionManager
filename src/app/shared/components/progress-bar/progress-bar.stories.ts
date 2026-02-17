import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressBarComponent } from './progress-bar.component';

const meta: Meta<ProgressBarComponent> = {
  title: 'Minion Manager/Atoms/ProgressBar',
  component: ProgressBarComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ProgressBarComponent>;

export const Empty: Story = {
  args: { progress: 10, total: 10, tier: 'petty' },
};

export const HalfFull: Story = {
  args: { progress: 5, total: 10, tier: 'sinister' },
};

export const NearlyComplete: Story = {
  args: { progress: 1, total: 10, tier: 'diabolical' },
};

export const Complete: Story = {
  args: { progress: 0, total: 10, tier: 'petty' },
};

export const Legendary: Story = {
  args: { progress: 30, total: 50, tier: 'legendary' },
};
