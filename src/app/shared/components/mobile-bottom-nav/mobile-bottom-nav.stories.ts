import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent, fn } from 'storybook/test';
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
    tabSelected: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click each tab and verify output fires
    await userEvent.click(canvas.getByText('Work'));
    expect(args.tabSelected).toHaveBeenCalledWith('work');

    await userEvent.click(canvas.getByText('Click'));
    expect(args.tabSelected).toHaveBeenCalledWith('click');

    await userEvent.click(canvas.getByText('More'));
    expect(args.tabSelected).toHaveBeenCalledWith('more');

    await userEvent.click(canvas.getByText('Missions'));
    expect(args.tabSelected).toHaveBeenCalledWith('missions');
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
