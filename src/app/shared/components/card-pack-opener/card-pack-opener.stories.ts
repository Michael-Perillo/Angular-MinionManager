import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, fn, userEvent } from 'storybook/test';
import { CardPackOpenerComponent } from './card-pack-opener.component';
import { PackItem } from '../../../core/models/card-pack.model';
import { CARD_POOL } from '../../../core/models/card.model';
import { JOKER_POOL } from '../../../core/models/joker.model';

const makeSamplePack = (): PackItem[] => [
  { ...CARD_POOL['when-idle'], _itemType: 'card' as const },
  { ...CARD_POOL['specialty-match'], _itemType: 'card' as const },
  { ...JOKER_POOL['gold-rush'], _itemType: 'joker' as const },
  { ...CARD_POOL['assign-highest-tier'], _itemType: 'card' as const },
];

const meta: Meta<CardPackOpenerComponent> = {
  title: 'Minion Manager/Organisms/CardPackOpener',
  component: CardPackOpenerComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<CardPackOpenerComponent>;

export const PickOne: Story = {
  args: {
    cards: makeSamplePack(),
    pickCount: 1,
    packName: 'Quarterly Bonus',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show pack name and pick instructions
    expect(canvas.getByText('Quarterly Bonus')).toBeTruthy();
    expect(canvasElement.textContent).toContain('Pick 1 card');

    // Should show 4 cards
    expect(canvas.getByTestId('pack-card-when-idle')).toBeTruthy();
    expect(canvas.getByTestId('pack-card-specialty-match')).toBeTruthy();
    expect(canvas.getByTestId('pack-card-gold-rush')).toBeTruthy();
    expect(canvas.getByTestId('pack-card-assign-highest-tier')).toBeTruthy();

    // Confirm button should be disabled initially
    const confirmBtn = canvas.getByTestId('pack-confirm-btn');
    expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);
  },
};

export const PickTwo: Story = {
  args: {
    cards: [
      ...makeSamplePack(),
      { ...CARD_POOL['hold'], _itemType: 'card' as const },
    ],
    pickCount: 2,
    packName: 'Premium Pack',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvasElement.textContent).toContain('Pick 2 cards');
  },
};

export const SelectionInteraction: Story = {
  args: {
    cards: makeSamplePack(),
    pickCount: 1,
    packName: 'Quarterly Bonus',
    cardsPicked: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Select a card
    await userEvent.click(canvas.getByTestId('pack-card-gold-rush'));

    // Confirm button should now be enabled
    const confirmBtn = canvas.getByTestId('pack-confirm-btn');
    expect((confirmBtn as HTMLButtonElement).disabled).toBe(false);

    // Click confirm
    await userEvent.click(confirmBtn);
    expect(args.cardsPicked).toHaveBeenCalledWith(['gold-rush']);
  },
};
