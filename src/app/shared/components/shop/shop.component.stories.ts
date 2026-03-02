import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, fn, userEvent } from 'storybook/test';
import { ShopComponent } from './shop.component';
import { VoucherId } from '../../../core/models/voucher.model';

const emptyVouchers = (): Record<VoucherId, number> => ({
  'iron-fingers': 0, 'board-expansion': 0, 'operations-desk': 0,
  'rapid-intel': 0, 'hire-discount': 0, 'dept-funding': 0, 'rule-mastery': 0,
});

const meta: Meta<ShopComponent> = {
  title: 'Minion Manager/Organisms/Shop',
  component: ShopComponent,
  tags: ['autodocs'],
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
    // Should render all 6 voucher cards
    const ironFingers = canvas.getByTestId('voucher-iron-fingers');
    expect(ironFingers).toBeTruthy();
    const boardExpansion = canvas.getByTestId('voucher-board-expansion');
    expect(boardExpansion).toBeTruthy();
    const operationsDesk = canvas.getByTestId('voucher-operations-desk');
    expect(operationsDesk).toBeTruthy();
    const rapidIntel = canvas.getByTestId('voucher-rapid-intel');
    expect(rapidIntel).toBeTruthy();
    const hireDiscount = canvas.getByTestId('voucher-hire-discount');
    expect(hireDiscount).toBeTruthy();
    const deptFunding = canvas.getByTestId('voucher-dept-funding');
    expect(deptFunding).toBeTruthy();
    const ruleMastery = canvas.getByTestId('voucher-rule-mastery');
    expect(ruleMastery).toBeTruthy();

    // Continue button should be visible
    const continueBtn = canvas.getByTestId('shop-continue');
    expect(continueBtn).toBeTruthy();
  },
};

export const Partial: Story = {
  args: {
    vouchers: {
      ...emptyVouchers(),
      'iron-fingers': 2,
      'board-expansion': 1,
      'rapid-intel': 3,
    },
    gold: 200,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Rapid Intel should show MAX badge (level 3)
    const rapidIntel = canvas.getByTestId('voucher-rapid-intel');
    expect(rapidIntel.textContent).toContain('MAX');

    // Iron Fingers should show a buy button (not maxed)
    const buyIron = canvas.getByTestId('buy-iron-fingers');
    expect(buyIron).toBeTruthy();
  },
};

export const MaxedOut: Story = {
  args: {
    vouchers: {
      'iron-fingers': 3, 'board-expansion': 3, 'operations-desk': 3,
      'rapid-intel': 3, 'hire-discount': 3, 'dept-funding': 3, 'rule-mastery': 3,
    },
    gold: 9999,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // All should show MAX
    for (const id of ['iron-fingers', 'board-expansion', 'operations-desk', 'rapid-intel', 'hire-discount', 'dept-funding']) {
      const card = canvas.getByTestId(`voucher-${id}`);
      expect(card.textContent).toContain('MAX');
    }
    // No buy buttons should exist
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
    // All buy buttons should be disabled (7 vouchers)
    const buyButtons = canvasElement.querySelectorAll('[data-testid^="buy-"]');
    expect(buyButtons.length).toBe(7);
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

    // Click buy on Iron Fingers
    const buyBtn = canvas.getByTestId('buy-iron-fingers');
    await userEvent.click(buyBtn);
    expect(args.purchase).toHaveBeenCalledWith('iron-fingers');

    // Click Continue
    const continueBtn = canvas.getByTestId('shop-continue');
    await userEvent.click(continueBtn);
    expect(args.continue).toHaveBeenCalled();
  },
};
