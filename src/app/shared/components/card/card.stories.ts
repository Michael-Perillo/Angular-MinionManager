import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { CardComponent } from './card.component';
import { CARD_POOL } from '../../../core/models/card.model';
import { JOKER_POOL } from '../../../core/models/joker.model';

const meta: Meta<CardComponent> = {
  title: 'Minion Manager/Atoms/Card',
  component: CardComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<CardComponent>;

export const CommonCard: Story = {
  args: {
    card: CARD_POOL['when-idle'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('When Idle')).toBeTruthy();
    expect(canvas.getByText('💤')).toBeTruthy();
    expect(canvas.getByText('common')).toBeTruthy();
  },
};

export const UncommonCard: Story = {
  args: {
    card: CARD_POOL['on-completion'],
  },
};

export const RareJoker: Story = {
  args: {
    card: JOKER_POOL['speed-demon'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('Speed Demon')).toBeTruthy();
    expect(canvas.getByText('rare')).toBeTruthy();
  },
};

export const LegendaryJoker: Story = {
  args: {
    card: JOKER_POOL['overachiever'],
  },
};

export const Selected: Story = {
  args: {
    card: CARD_POOL['assign-to-work'],
    selected: true,
  },
  play: async ({ canvasElement }) => {
    // Should have a selected overlay (border-accent)
    const card = canvasElement.querySelector('[data-testid="card-assign-to-work"]');
    expect(card).toBeTruthy();
    const overlay = card?.querySelector('.border-accent');
    expect(overlay).toBeTruthy();
  },
};

export const Disabled: Story = {
  args: {
    card: CARD_POOL['specialty-match'],
    disabled: true,
  },
};

export const InUse: Story = {
  args: {
    card: CARD_POOL['when-idle'],
    inUse: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent).toContain('In Use');
  },
};
