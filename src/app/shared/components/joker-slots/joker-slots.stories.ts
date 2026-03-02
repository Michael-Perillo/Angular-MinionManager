import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, fn, userEvent } from 'storybook/test';
import { JokerSlotsComponent } from './joker-slots.component';
import { JokerId } from '../../../core/models/joker.model';

const meta: Meta<JokerSlotsComponent> = {
  title: 'Minion Manager/Molecules/JokerSlots',
  component: JokerSlotsComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<JokerSlotsComponent>;

export const Empty: Story = {
  args: {
    equippedJokers: [],
    ownedJokers: new Set<JokerId>(['gold-rush', 'iron-fist', 'quick-study']),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show 5 empty slots
    const emptySlots = canvasElement.querySelectorAll('[data-testid="joker-empty-slot"]');
    expect(emptySlots.length).toBe(5);
  },
};

export const PartiallyEquipped: Story = {
  args: {
    equippedJokers: ['gold-rush', 'iron-fist'] as JokerId[],
    ownedJokers: new Set<JokerId>(['gold-rush', 'iron-fist', 'quick-study', 'speed-demon']),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show 2 equipped + 3 empty slots
    expect(canvas.getByTestId('equipped-gold-rush')).toBeTruthy();
    expect(canvas.getByTestId('equipped-iron-fist')).toBeTruthy();
    const emptySlots = canvasElement.querySelectorAll('[data-testid="joker-empty-slot"]');
    expect(emptySlots.length).toBe(3);
  },
};

export const FullyEquipped: Story = {
  args: {
    equippedJokers: ['gold-rush', 'iron-fist', 'quick-study', 'speed-demon', 'overachiever'] as JokerId[],
    ownedJokers: new Set<JokerId>(['gold-rush', 'iron-fist', 'quick-study', 'speed-demon', 'overachiever']),
  },
  play: async ({ canvasElement }) => {
    // No empty slots when all 5 are equipped
    const emptySlots = canvasElement.querySelectorAll('[data-testid="joker-empty-slot"]');
    expect(emptySlots.length).toBe(0);
  },
};

export const PickerInteraction: Story = {
  args: {
    equippedJokers: ['gold-rush'] as JokerId[],
    ownedJokers: new Set<JokerId>(['gold-rush', 'iron-fist', 'quick-study']),
    jokerEquipped: fn(),
    jokerUnequipped: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click empty slot to open picker
    const emptySlot = canvas.getAllByTestId('joker-empty-slot')[0];
    await userEvent.click(emptySlot);

    // Picker should show available (unequipped) jokers
    expect(canvas.getByText('Choose a Joker')).toBeTruthy();
    const pickIronFist = canvas.getByTestId('pick-iron-fist');
    expect(pickIronFist).toBeTruthy();

    // Pick a joker
    await userEvent.click(pickIronFist);
    expect(args.jokerEquipped).toHaveBeenCalledWith('iron-fist');
  },
};
