import type { Meta, StoryObj } from '@storybook/angular';
import { PrisonPanelComponent } from './prison-panel.component';
import { CapturedMinion, Minion } from '../../../core/models/minion.model';

const makeMinion = (overrides: Partial<Minion> = {}): Minion => ({
  id: crypto.randomUUID(),
  name: 'Skulk',
  appearance: { color: '#1a5276', accessory: 'helmet' },
  status: 'idle',
  assignedTaskId: null,
  stats: { speed: 1.0, efficiency: 1.1 },
  specialty: 'heists',
  assignedDepartment: 'heists',
  xp: 0,
  level: 1,
  ...overrides,
});

const now = Date.now();

const makeCaptured = (minionOverrides: Partial<Minion>, timing: { capturedAt: number; expiresAt: number }): CapturedMinion => ({
  minion: makeMinion(minionOverrides),
  capturedAt: timing.capturedAt,
  expiresAt: timing.expiresAt,
  rescueDifficulty: 1,
} as CapturedMinion);

const meta: Meta<PrisonPanelComponent> = {
  title: 'Minion Manager/Molecules/PrisonPanel',
  component: PrisonPanelComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PrisonPanelComponent>;

export const Empty: Story = {
  args: {
    capturedMinions: [],
    currentTime: now,
  },
};

export const SingleCaptured: Story = {
  args: {
    capturedMinions: [
      makeCaptured(
        { name: 'Skulk', specialty: 'heists', level: 2 },
        { capturedAt: now - 150_000, expiresAt: now + 150_000 },
      ),
    ],
    currentTime: now,
  },
};

export const MultipleCaptured: Story = {
  args: {
    capturedMinions: [
      makeCaptured(
        { name: 'Skulk', appearance: { color: '#1a5276', accessory: 'helmet' }, specialty: 'heists', level: 2 },
        { capturedAt: now - 120_000, expiresAt: now + 180_000 },
      ),
      makeCaptured(
        { name: 'Grim', appearance: { color: '#6c3483', accessory: 'goggles' }, specialty: 'schemes', level: 3 },
        { capturedAt: now - 200_000, expiresAt: now + 100_000 },
      ),
      makeCaptured(
        { name: 'Hex', appearance: { color: '#1e8449', accessory: 'horns' }, specialty: 'research', level: 4 },
        { capturedAt: now - 250_000, expiresAt: now + 50_000 },
      ),
    ],
    currentTime: now,
  },
};

export const CriticalTimer: Story = {
  args: {
    capturedMinions: [
      makeCaptured(
        { name: 'Doom', appearance: { color: '#b9770e', accessory: 'cape' }, specialty: 'mayhem', level: 5 },
        { capturedAt: now - 280_000, expiresAt: now + 20_000 },
      ),
    ],
    currentTime: now,
  },
};
