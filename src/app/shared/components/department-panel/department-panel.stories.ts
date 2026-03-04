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
      schemes: { category: 'schemes', level: 1, workerSlots: 1, hasManager: false },
      heists: { category: 'heists', level: 1, workerSlots: 0, hasManager: false },
      research: { category: 'research', level: 1, workerSlots: 0, hasManager: false },
      mayhem: { category: 'mayhem', level: 1, workerSlots: 0, hasManager: false },
    },
  },
};

export const MidGame: Story = {
  args: {
    departments: {
      schemes: { category: 'schemes', level: 4, workerSlots: 2, hasManager: true },
      heists: { category: 'heists', level: 3, workerSlots: 2, hasManager: false },
      research: { category: 'research', level: 5, workerSlots: 1, hasManager: false },
      mayhem: { category: 'mayhem', level: 2, workerSlots: 1, hasManager: false },
    },
  },
};

export const LateGame: Story = {
  args: {
    departments: {
      schemes: { category: 'schemes', level: 8, workerSlots: 4, hasManager: true },
      heists: { category: 'heists', level: 7, workerSlots: 3, hasManager: true },
      research: { category: 'research', level: 8, workerSlots: 4, hasManager: true },
      mayhem: { category: 'mayhem', level: 6, workerSlots: 3, hasManager: true },
    },
  },
};
