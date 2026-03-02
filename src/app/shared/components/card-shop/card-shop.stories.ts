import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, fn, userEvent } from 'storybook/test';
import { CardShopComponent } from './card-shop.component';

const meta: Meta<CardShopComponent> = {
  title: 'Minion Manager/Molecules/CardShop',
  component: CardShopComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<CardShopComponent>;

export const CanAfford: Story = {
  args: {
    gold: 500,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show both pack types
    expect(canvas.getByTestId('pack-shop-standard')).toBeTruthy();
    expect(canvas.getByTestId('pack-shop-premium')).toBeTruthy();

    // Both buy buttons should be enabled
    const buyStandard = canvas.getByTestId('buy-pack-shop-standard');
    expect((buyStandard as HTMLButtonElement).disabled).toBe(false);
    const buyPremium = canvas.getByTestId('buy-pack-shop-premium');
    expect((buyPremium as HTMLButtonElement).disabled).toBe(false);
  },
};

export const CantAffordPremium: Story = {
  args: {
    gold: 200,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Standard should be affordable (150g)
    const buyStandard = canvas.getByTestId('buy-pack-shop-standard');
    expect((buyStandard as HTMLButtonElement).disabled).toBe(false);
    // Premium should be disabled (350g)
    const buyPremium = canvas.getByTestId('buy-pack-shop-premium');
    expect((buyPremium as HTMLButtonElement).disabled).toBe(true);
  },
};

export const Broke: Story = {
  args: {
    gold: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Both should be disabled
    const buyStandard = canvas.getByTestId('buy-pack-shop-standard');
    expect((buyStandard as HTMLButtonElement).disabled).toBe(true);
    const buyPremium = canvas.getByTestId('buy-pack-shop-premium');
    expect((buyPremium as HTMLButtonElement).disabled).toBe(true);
  },
};

export const PurchaseInteraction: Story = {
  args: {
    gold: 500,
    packPurchased: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click buy on standard pack
    const buyBtn = canvas.getByTestId('buy-pack-shop-standard');
    await userEvent.click(buyBtn);
    expect(args.packPurchased).toHaveBeenCalledWith('shop-standard');
  },
};
