import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { DrawerPanelComponent } from './drawer-panel.component';
import { TaskCategory } from '../../../core/models/task.model';
import { Department } from '../../../core/models/department.model';
import { Minion, CapturedMinion } from '../../../core/models/minion.model';
import { createDefaultUpgrades } from '../../../core/models/upgrade.model';
import { ThreatLevel } from '../../../core/models/notoriety.model';

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
    notoriety: 25,
    threatLevel: 'suspicious' as ThreatLevel,
    goldPenalty: 5,
    raidActive: false,
    raidTimer: 0,
    gold: 150,
    minions: defaultMinions(),
    departments: defaultDepts(),
    upgrades: createDefaultUpgrades(),
    capturedMinions: [],
    currentTime: Date.now(),
    nextMinionCost: 50,
    canHireMinion: true,
    unlockedDepartments: new Set(['schemes', 'heists'] as TaskCategory[]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Default tab is Notoriety — verify it renders
    expect(canvas.getByText('Notoriety')).toBeTruthy();

    // Click "Minions" tab (hire panel)
    await userEvent.click(canvas.getByText(/Minions/));
    expect(canvas.getByText('Hire Minion')).toBeTruthy();

    // Click "Upgrades" tab
    await userEvent.click(canvas.getByText(/Upgrades/));
    expect(canvas.getByText(/Lair Upgrades/)).toBeTruthy();

    // Click "Depts" tab
    await userEvent.click(canvas.getByText(/Depts/));
    expect(canvas.getByText(/Departments/)).toBeTruthy();
  },
};

export const Closed: Story = {
  args: {
    initiallyOpen: false,
    notoriety: 25,
    threatLevel: 'suspicious' as ThreatLevel,
    goldPenalty: 5,
    raidActive: false,
    raidTimer: 0,
    gold: 150,
    minions: defaultMinions(),
    departments: defaultDepts(),
    upgrades: createDefaultUpgrades(),
    capturedMinions: [],
    currentTime: Date.now(),
    nextMinionCost: 50,
    canHireMinion: true,
    unlockedDepartments: new Set(['schemes', 'heists'] as TaskCategory[]),
  },
};

export const WithRaidAlert: Story = {
  args: {
    initiallyOpen: true,
    notoriety: 85,
    threatLevel: 'infamous' as ThreatLevel,
    goldPenalty: 40,
    raidActive: true,
    raidTimer: 25,
    gold: 800,
    minions: defaultMinions(),
    departments: {
      schemes: makeDept('schemes', 5, 200),
      heists: makeDept('heists', 3, 60),
      research: makeDept('research', 4, 120),
      mayhem: makeDept('mayhem', 2, 20),
    },
    upgrades: createDefaultUpgrades().map((u, i) => i < 3 ? { ...u, currentLevel: 2 } : u),
    capturedMinions: [],
    currentTime: Date.now(),
    nextMinionCost: 120,
    canHireMinion: true,
    unlockedDepartments: new Set(['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[]),
  },
};

export const WithPrisonTimer: Story = {
  args: {
    initiallyOpen: true,
    initialTab: 'prison',
    notoriety: 60,
    threatLevel: 'hunted' as ThreatLevel,
    goldPenalty: 20,
    raidActive: false,
    raidTimer: 0,
    gold: 400,
    minions: [
      makeMinion({ name: 'Grim', specialty: 'schemes', assignedDepartment: 'schemes', level: 3 }),
    ],
    departments: defaultDepts(),
    upgrades: createDefaultUpgrades(),
    capturedMinions: [
      {
        minion: makeMinion({
          name: 'Skulk',
          appearance: { color: '#1a5276', accessory: 'helmet' },
          specialty: 'heists',
          assignedDepartment: 'heists',
          level: 2,
        }),
        capturedAt: Date.now() - 120_000,
        expiresAt: Date.now() + 180_000,
        rescueDifficulty: 1,
      } as CapturedMinion,
    ],
    currentTime: Date.now(),
    nextMinionCost: 80,
    canHireMinion: true,
    unlockedDepartments: new Set(['schemes', 'heists'] as TaskCategory[]),
  },
};
