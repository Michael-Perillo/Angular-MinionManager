import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, fn, userEvent } from 'storybook/test';
import { ShopComponent } from './shop.component';
import { VoucherId, createEmptyVoucherLevels } from '../../../core/models/voucher.model';
import { Department } from '../../../core/models/department.model';
import { TaskCategory } from '../../../core/models/task.model';
import { MinionArchetype } from '../../../core/models/minion.model';

const emptyVouchers = (): Record<VoucherId, number> => createEmptyVoucherLevels();

const makeDept = (cat: TaskCategory, level = 1, workerSlots = 0, hasManager = false): Department => ({
  category: cat, level, workerSlots, hasManager,
});

const defaultDepts = (): Record<TaskCategory, Department> => ({
  schemes: makeDept('schemes', 1, 1),
  heists: makeDept('heists'),
  research: makeDept('research'),
  mayhem: makeDept('mayhem'),
});

const sampleHireOptions: MinionArchetype[] = [
  { id: 'penny-pincher', name: 'Penny Pincher', icon: '🤑', rarity: 'common', description: '+5% gold from tasks', passives: [] },
  { id: 'vault-cracker', name: 'Vault Cracker', icon: '🔓', rarity: 'uncommon', description: '+10% heist gold', passives: [] },
  { id: 'lab-rat', name: 'Lab Rat', icon: '🐀', rarity: 'common', description: '+5% research speed', passives: [] },
] as any;

const meta: Meta<ShopComponent> = {
  title: 'Minion Manager/Organisms/Shop',
  component: ShopComponent,
  tags: ['autodocs'],
  args: {
    departments: defaultDepts(),
    unlockedDepartments: ['schemes'] as TaskCategory[],
    hireOptions: sampleHireOptions,
    hireCost: 75,
    canHire: true,
    rerollCost: 25,
    minionCount: 0,
  },
};

export default meta;
type Story = StoryObj<ShopComponent>;

export const Default: Story = {
  args: {
    vouchers: emptyVouchers(),
    gold: 500,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Default tab is departments — verify dept card for schemes
    const schemesCard = canvas.getByTestId('dept-card-schemes');
    expect(schemesCard).toBeTruthy();

    // Verify unlock buttons for locked depts
    const buyHeists = canvas.getByTestId('buy-unlock-heists');
    expect(buyHeists).toBeTruthy();

    // Switch to upgrades tab
    await userEvent.click(canvas.getByTestId('shop-tab-upgrades'));
    const ironFingers = canvas.getByTestId('voucher-iron-fingers');
    expect(ironFingers).toBeTruthy();

    // Continue button should be visible
    const continueBtn = canvas.getByTestId('shop-continue');
    expect(continueBtn).toBeTruthy();
  },
};

export const Partial: Story = {
  args: {
    vouchers: {
      ...emptyVouchers(),
      'unlock-heists': 1,
      'iron-fingers': 2,
      'board-expansion': 1,
    },
    gold: 200,
    departments: {
      schemes: makeDept('schemes', 2, 2, true),
      heists: makeDept('heists', 1, 1),
      research: makeDept('research'),
      mayhem: makeDept('mayhem'),
    },
    unlockedDepartments: ['schemes', 'heists'] as TaskCategory[],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Departments tab: heists should have a dept card
    const heistsCard = canvas.getByTestId('dept-card-heists');
    expect(heistsCard).toBeTruthy();

    // Switch to upgrades tab
    await userEvent.click(canvas.getByTestId('shop-tab-upgrades'));
    const buyIron = canvas.getByTestId('buy-iron-fingers');
    expect(buyIron).toBeTruthy();
  },
};

export const MaxedOut: Story = {
  args: {
    vouchers: {
      'unlock-heists': 1, 'unlock-research': 1, 'unlock-mayhem': 1,
      'iron-fingers': 3, 'board-expansion': 3, 'operations-desk': 3,
      'hire-discount': 3, 'dismissal-expert': 3,
    },
    gold: 9999,
    departments: {
      schemes: makeDept('schemes', 8, 4, true),
      heists: makeDept('heists', 8, 4, true),
      research: makeDept('research', 8, 4, true),
      mayhem: makeDept('mayhem', 8, 4, true),
    },
    unlockedDepartments: ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Switch to upgrades tab — all should show MAX
    await userEvent.click(canvas.getByTestId('shop-tab-upgrades'));
    for (const id of ['iron-fingers', 'board-expansion', 'operations-desk', 'hire-discount', 'dismissal-expert']) {
      const card = canvas.getByTestId(`voucher-${id}`);
      expect(card.textContent).toContain('MAX');
    }
    // No buy buttons should exist on upgrades tab
    const buyButtons = canvasElement.querySelectorAll('[data-testid^="buy-"]');
    expect(buyButtons.length).toBe(0);
  },
};

export const Broke: Story = {
  args: {
    vouchers: emptyVouchers(),
    gold: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Departments tab: unlock buttons should be disabled
    const buyHeists = canvas.getByTestId('buy-unlock-heists');
    expect((buyHeists as HTMLButtonElement).disabled).toBe(true);

    // Switch to upgrades tab
    await userEvent.click(canvas.getByTestId('shop-tab-upgrades'));
    const buyButtons = canvasElement.querySelectorAll('[data-testid^="buy-"]');
    expect(buyButtons.length).toBe(5);
    buyButtons.forEach(btn => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  },
};

export const PurchaseInteraction: Story = {
  args: {
    vouchers: emptyVouchers(),
    gold: 500,
    purchase: fn(),
    continue: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Buy unlock-heists from departments tab
    const buyBtn = canvas.getByTestId('buy-unlock-heists');
    await userEvent.click(buyBtn);
    expect(args.purchase).toHaveBeenCalledWith('unlock-heists');

    // Click Continue
    const continueBtn = canvas.getByTestId('shop-continue');
    await userEvent.click(continueBtn);
    expect(args.continue).toHaveBeenCalled();
  },
};
