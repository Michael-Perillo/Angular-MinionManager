import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { DrawerPanelComponent } from './drawer-panel.component';
import { TaskCategory } from '../../../core/models/task.model';
import { Department } from '../../../core/models/department.model';
import { Minion } from '../../../core/models/minion.model';

const makeDept = (cat: TaskCategory, level = 1, xp = 0): Department => ({
  category: cat,
  xp,
  level,
});

const makeMinion = (overrides: Partial<Minion> = {}): Minion => ({
  id: crypto.randomUUID(),
  name: 'Grim',
  appearance: { color: '#6c3483', accessory: 'goggles' },
  status: 'idle',
  assignedTaskId: null,
  stats: { speed: 1.0, efficiency: 1.1 },
  specialty: 'schemes',
  assignedDepartment: 'schemes',
  xp: 0,
  level: 1,
  ...overrides,
});

const defaultDepts = (): Record<TaskCategory, Department> => ({
  schemes: makeDept('schemes', 2, 20),
  heists: makeDept('heists', 1),
  research: makeDept('research', 1),
  mayhem: makeDept('mayhem', 1),
});

const defaultMinions = (): Minion[] => [
  makeMinion({ name: 'Grim', specialty: 'schemes', assignedDepartment: 'schemes', level: 2 }),
  makeMinion({ name: 'Skulk', appearance: { color: '#1a5276', accessory: 'helmet' }, specialty: 'heists', assignedDepartment: 'heists' }),
];

const meta: Meta<DrawerPanelComponent> = {
  title: 'Minion Manager/Organisms/DrawerPanel',
  component: DrawerPanelComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<DrawerPanelComponent>;

export const Open: Story = {
  args: {
    initiallyOpen: true,
    gold: 150,
    minions: defaultMinions(),
    departments: defaultDepts(),
    nextMinionCost: 75,
    canHireMinion: true,
    unlockedDepartments: new Set(['schemes', 'heists'] as TaskCategory[]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Default tab is Minions — verify it renders
    expect(canvas.getByText('Hire Minion')).toBeTruthy();

    // Click "Depts" tab
    await userEvent.click(canvas.getByText(/Depts/));
    expect(canvas.getByText(/Departments/)).toBeTruthy();
  },
};

export const Closed: Story = {
  args: {
    initiallyOpen: false,
    gold: 150,
    minions: defaultMinions(),
    departments: defaultDepts(),
    nextMinionCost: 75,
    canHireMinion: true,
    unlockedDepartments: new Set(['schemes', 'heists'] as TaskCategory[]),
  },
};

export const WithDepartments: Story = {
  args: {
    initiallyOpen: true,
    initialTab: 'departments',
    gold: 800,
    minions: defaultMinions(),
    departments: {
      schemes: makeDept('schemes', 5, 200),
      heists: makeDept('heists', 3, 60),
      research: makeDept('research', 4, 120),
      mayhem: makeDept('mayhem', 2, 20),
    },
    nextMinionCost: 120,
    canHireMinion: true,
    unlockedDepartments: new Set(['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[]),
  },
};
