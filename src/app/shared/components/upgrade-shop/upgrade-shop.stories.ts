import type { Meta, StoryObj } from '@storybook/angular';
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
      if (u.id === 'minion-xp') return { ...u, currentLevel: 5 }; // maxed
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
