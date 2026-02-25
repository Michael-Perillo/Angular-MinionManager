import type { Meta, StoryObj } from '@storybook/angular';
import { MobileBottomNavComponent } from './mobile-bottom-nav.component';

const meta: Meta<MobileBottomNavComponent> = {
  title: 'Minion Manager/Molecules/MobileBottomNav',
  component: MobileBottomNavComponent,
  tags: ['autodocs'],
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export default meta;
type Story = StoryObj<MobileBottomNavComponent>;

export const MissionsTab: Story = {
  args: {
    activeTab: 'missions',
    hasAlert: false,
  },
};

export const WorkTab: Story = {
  args: {
    activeTab: 'work',
    hasAlert: false,
  },
};

export const ClickTab: Story = {
  args: {
    activeTab: 'click',
    hasAlert: false,
  },
};

export const MoreTab: Story = {
  args: {
    activeTab: 'more',
    hasAlert: false,
  },
};

export const WithAlertBadge: Story = {
  args: {
    activeTab: 'missions',
    hasAlert: true,
  },
};
