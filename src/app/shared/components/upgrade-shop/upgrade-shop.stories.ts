import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { UpgradeShopComponent } from './upgrade-shop.component';
import { createDefaultUpgrades } from '../../../core/models/upgrade.model';

const meta: Meta<UpgradeShopComponent> = {
  title: 'Minion Manager/Organisms/UpgradeShop',
  component: UpgradeShopComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<UpgradeShopComponent>;

export const CanAffordSome: Story = {
  args: {
    upgrades: createDefaultUpgrades(),
    gold: 100,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all 10 upgrade cards render (each has a gold cost button ending in "g")
    const upgradeCards = canvas.getAllByText(/^\d+g$/);
    expect(upgradeCards.length).toBe(10);

    // Click "Click Power" tab → should filter to 2 upgrades
    const clickPowerTab = canvas.getByText('Click Power');
    await userEvent.click(clickPowerTab);
    const filteredCards = canvas.getAllByText(/^\d+g$/);
    expect(filteredCards.length).toBe(2);

    // Click "All" tab → should show all 10 again
    const allTab = canvas.getByText('All');
    await userEvent.click(allTab);
    const allCards = canvas.getAllByText(/^\d+g$/);
    expect(allCards.length).toBe(10);
  },
};

export const CantAffordAny: Story = {
  args: {
    upgrades: createDefaultUpgrades(),
    gold: 5,
  },
};

export const SomeUpgraded: Story = {
  args: {
    upgrades: createDefaultUpgrades().map(u => {
      if (u.id === 'click-power') return { ...u, currentLevel: 3 };
      if (u.id === 'minion-speed') return { ...u, currentLevel: 5 };
      if (u.id === 'board-slots') return { ...u, currentLevel: 2 };
      if (u.id === 'minion-xp') return { ...u, currentLevel: 5 };
      return u;
    }),
    gold: 500,
  },
};

export const Wealthy: Story = {
  args: {
    upgrades: createDefaultUpgrades(),
    gold: 5000,
  },
};
