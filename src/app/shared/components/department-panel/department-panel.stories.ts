import type { Meta, StoryObj } from '@storybook/angular';
import { DepartmentPanelComponent } from './department-panel.component';

const meta: Meta<DepartmentPanelComponent> = {
  title: 'Minion Manager/Organisms/DepartmentPanel',
  component: DepartmentPanelComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<DepartmentPanelComponent>;

export const EarlyGame: Story = {
  args: {
    departments: {
      schemes: { category: 'schemes', xp: 8, level: 1 },
      heists: { category: 'heists', xp: 0, level: 1 },
      research: { category: 'research', xp: 3, level: 1 },
      mayhem: { category: 'mayhem', xp: 12, level: 1 },
    },
  },
};

export const MidGame: Story = {
  args: {
    departments: {
      schemes: { category: 'schemes', xp: 85, level: 4 },
      heists: { category: 'heists', xp: 45, level: 3 },
      research: { category: 'research', xp: 120, level: 5 },
      mayhem: { category: 'mayhem', xp: 30, level: 2 },
    },
  },
};

export const LateGame: Story = {
  args: {
    departments: {
      schemes: { category: 'schemes', xp: 500, level: 8 },
      heists: { category: 'heists', xp: 350, level: 7 },
      research: { category: 'research', xp: 600, level: 9 },
      mayhem: { category: 'mayhem', xp: 280, level: 6 },
    },
  },
};
