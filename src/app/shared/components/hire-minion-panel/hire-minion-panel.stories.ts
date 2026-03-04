import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent, fn } from 'storybook/test';
import { HireMinionPanelComponent } from './hire-minion-panel.component';
import { MinionArchetype, MINION_ARCHETYPES } from '../../../core/models/minion.model';

const sampleOptions: MinionArchetype[] = [
  MINION_ARCHETYPES['penny-pincher'],
  MINION_ARCHETYPES['vault-cracker'],
  MINION_ARCHETYPES['golden-touch'],
];

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
    hireOptions: sampleOptions,
    rerollCost: 25,
    hire: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Verify 3 draft cards are shown
    expect(canvas.getByText('Penny Pincher')).toBeTruthy();
    expect(canvas.getByText('Vault Cracker')).toBeTruthy();
    expect(canvas.getByText('Golden Touch')).toBeTruthy();

    // Click to hire the first option
    await userEvent.click(canvas.getByText('Penny Pincher'));
    expect(args.hire).toHaveBeenCalledWith('penny-pincher');
  },
};

export const CannotAfford: Story = {
  args: {
    gold: 30,
    cost: 50,
    minionCount: 0,
    canHire: false,
    hireOptions: sampleOptions,
    rerollCost: 25,
  },
};

export const HiringFrozen: Story = {
  args: {
    gold: 200,
    cost: 50,
    minionCount: 2,
    canHire: true,
    hiringDisabled: true,
    hireOptions: sampleOptions,
    rerollCost: 25,
  },
};

export const WithReroll: Story = {
  args: {
    gold: 200,
    cost: 75,
    minionCount: 1,
    canHire: true,
    hireOptions: [
      MINION_ARCHETYPES['corner-cutter'],
      MINION_ARCHETYPES['lab-rat'],
      MINION_ARCHETYPES['overdriver'],
    ],
    rerollCost: 37,
    reroll: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click reroll button
    const rerollBtn = canvas.getByText(/Reroll/);
    await userEvent.click(rerollBtn);
    expect(args.reroll).toHaveBeenCalled();
  },
};
