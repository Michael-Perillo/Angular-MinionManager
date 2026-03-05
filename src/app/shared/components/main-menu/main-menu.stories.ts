import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { MainMenuComponent } from './main-menu.component';

const meta: Meta<MainMenuComponent> = {
  title: 'Minion Manager/Organisms/MainMenu',
  component: MainMenuComponent,
  tags: ['autodocs'],
  args: {
    continueGame: fn(),
    newRun: fn(),
    compendium: fn(),
    options: fn(),
  },
};

export default meta;
type Story = StoryObj<MainMenuComponent>;

export const Fresh: Story = {
  args: {
    hasSave: false,
    hasDiscoveries: false,
    totalInfamy: 0,
  },
};

export const WithSave: Story = {
  args: {
    hasSave: true,
    hasDiscoveries: true,
    totalInfamy: 165,
  },
};

export const WithInfamy: Story = {
  args: {
    hasSave: false,
    hasDiscoveries: true,
    totalInfamy: 450,
  },
};
