import type { Meta, StoryObj } from '@storybook/angular';
import { MissionBoardComponent } from './mission-board.component';
import { Task, TaskTier, TaskCategory } from '../../../core/models';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  template: { name: 'Forge Hall Passes', description: 'Create convincing hall passes.', category: 'schemes' as TaskCategory, tier: 'petty' as TaskTier },
  status: 'queued',
  tier: 'petty',
  goldReward: 5,
  timeToComplete: 8,
  timeRemaining: 8,
  clicksRequired: 10,
  clicksRemaining: 10,
  assignedMinionId: null,
  queuedAt: Date.now(),
  ...overrides,
});

const makeBoardMissions = (): Task[] => [
  makeTask({ template: { name: 'Forge Hall Passes', description: 'Create convincing hall passes.', category: 'schemes', tier: 'petty' }, tier: 'petty', goldReward: 5 }),
  makeTask({ template: { name: 'Museum Night Raid', description: 'Break in after hours.', category: 'heists', tier: 'sinister' }, tier: 'sinister', goldReward: 18 }),
  makeTask({ template: { name: 'Build Doomsday Device', description: 'Ultimate bargaining chip.', category: 'research', tier: 'diabolical' }, tier: 'diabolical', goldReward: 48 }),
  makeTask({ template: { name: 'Steal the Moon', description: 'The ultimate heist.', category: 'heists', tier: 'legendary' }, tier: 'legendary', goldReward: 120 }),
  makeTask({ template: { name: 'TP the Hero\'s House', description: 'Classic TP bombardment.', category: 'mayhem', tier: 'petty' }, tier: 'petty', goldReward: 6 }),
  makeTask({ template: { name: 'Infiltrate Council', description: 'Plant a spy.', category: 'schemes', tier: 'sinister' }, tier: 'sinister', goldReward: 20, isSpecialOp: true, specialOpExpiry: Date.now() + 30000 }),
  makeTask({ template: { name: 'Mix Stink Bombs', description: 'Brew a foul concoction.', category: 'research', tier: 'petty' }, tier: 'petty', goldReward: 5 }),
  makeTask({ template: { name: 'Bribe the Witnesses', description: 'Pay off everyone. Reduces notoriety.', category: 'schemes', tier: 'petty' }, tier: 'petty', goldReward: 0, isCoverOp: true }),
  makeTask({ template: { name: 'Release Robot Swarm', description: 'Deploy tiny robots.', category: 'mayhem', tier: 'sinister' }, tier: 'sinister', goldReward: 15 }),
  makeTask({ template: { name: 'Volcano Activation', description: 'Trigger a dormant volcano.', category: 'mayhem', tier: 'diabolical' }, tier: 'diabolical', goldReward: 44 }),
  makeTask({ template: { name: 'Jewel Store Heist', description: 'Crack display cases.', category: 'heists', tier: 'sinister' }, tier: 'sinister', goldReward: 16 }),
  makeTask({ template: { name: 'Brew Sleeping Potion', description: 'A mild sedative.', category: 'research', tier: 'petty' }, tier: 'petty', goldReward: 5 }),
];

const meta: Meta<MissionBoardComponent> = {
  title: 'Minion Manager/Organisms/MissionBoard',
  component: MissionBoardComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MissionBoardComponent>;

export const FullBoard: Story = {
  args: {
    missions: makeBoardMissions(),
    activeCount: 1,
    activeSlots: 4,
  },
};

export const BoardWithFullSlots: Story = {
  args: {
    missions: makeBoardMissions(),
    activeCount: 4,
    activeSlots: 4,
  },
};

export const EmptyBoard: Story = {
  args: {
    missions: [],
    activeCount: 0,
    activeSlots: 3,
  },
};
