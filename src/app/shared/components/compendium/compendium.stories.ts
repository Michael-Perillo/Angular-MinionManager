import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { CompendiumComponent } from './compendium.component';
import { CompendiumData } from '../../../core/models/meta.model';

function makeCompendium(overrides: Partial<CompendiumData> = {}): CompendiumData {
  return {
    seenArchetypes: [],
    seenTasks: [],
    seenReviewers: [],
    seenModifiers: [],
    ...overrides,
  };
}

const meta: Meta<CompendiumComponent> = {
  title: 'Minion Manager/Organisms/Compendium',
  component: CompendiumComponent,
  tags: ['autodocs'],
  args: {
    back: fn(),
  },
};

export default meta;
type Story = StoryObj<CompendiumComponent>;

export const Empty: Story = {
  args: {
    compendium: makeCompendium(),
  },
};

export const Partial: Story = {
  args: {
    compendium: makeCompendium({
      seenArchetypes: ['penny-pincher', 'iron-grip', 'vault-cracker', 'golden-touch'],
      seenTasks: ['Forge Hall Passes', 'Rig the Lottery', 'Museum Night Raid', 'Mix Stink Bombs'],
      seenReviewers: ['thornton', 'grimes'],
      seenModifiers: ['no-hiring', 'sinister-only', 'gold-drain'],
    }),
  },
};

export const Full: Story = {
  args: {
    compendium: makeCompendium({
      seenArchetypes: [
        'penny-pincher', 'tip-jar', 'iron-grip', 'drill-sergeant', 'taskmaster',
        'corner-cutter', 'dept-mentor', 'double-dipper',
        'vault-cracker', 'lab-rat', 'demolitions-expert', 'scheme-architect', 'safe-hands', 'eureka-catalyst',
        'golden-touch', 'overdriver', 'ops-coordinator', 'paper-shredder',
      ],
      seenTasks: [
        'Forge Hall Passes', 'Rig the Lottery', 'Spread Rumors', 'Tamper with Signs', 'Steal Lunch Money',
        'Blackmail the Mayor', 'Infiltrate the Council', 'Frame a Rival',
        'Pilfer the Tip Jar', 'Snatch a Purse', 'Rob a Lemonade Stand',
        'Mix Stink Bombs', 'Invent Itching Powder',
        'TP the Hero\'s House', 'Release the Pigeons',
      ],
      seenReviewers: ['thornton', 'grimes', 'hale', 'auditor', 'chen'],
      seenModifiers: [
        'sinister-only', 'petty-only', 'no-hiring', 'board-frozen', 'gold-drain',
        'gold-halved', 'gold-reduced-30', 'starting-gold-zero',
        'upgrades-disabled', 'board-limited', 'lock-schemes', 'lock-heists', 'lock-research', 'lock-mayhem',
      ],
    }),
  },
};
