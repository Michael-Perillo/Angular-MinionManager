import type { Meta, StoryObj } from '@storybook/angular';
import { TierBadgeComponent } from './tier-badge.component';

const meta: Meta<TierBadgeComponent> = {
  title: 'Minion Manager/Atoms/TierBadge',
  component: TierBadgeComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<TierBadgeComponent>;

export const Petty: Story = {
  args: { tier: 'petty' },
};

export const Sinister: Story = {
  args: { tier: 'sinister' },
};

export const Diabolical: Story = {
  args: { tier: 'diabolical' },
};

export const Legendary: Story = {
  args: { tier: 'legendary' },
};
