import type { Meta, StoryObj } from '@storybook/angular';
import { ReviewerIntroComponent } from './reviewer-intro.component';
import { Reviewer, Modifier, REVIEWERS, ALL_MODIFIERS } from '../../../core/models/reviewer.model';

const meta: Meta<ReviewerIntroComponent> = {
  title: 'Minion Manager/Organisms/ReviewerIntro',
  component: ReviewerIntroComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<ReviewerIntroComponent>;

const thornton = REVIEWERS.find(r => r.id === 'thornton')!;
const auditor = REVIEWERS.find(r => r.id === 'auditor')!;

const noHiring = ALL_MODIFIERS.find(m => m.id === 'no-hiring')!;
const goldReduced = ALL_MODIFIERS.find(m => m.id === 'gold-reduced-30')!;
const sinisterOnly = ALL_MODIFIERS.find(m => m.id === 'sinister-only')!;
const goldDrain = ALL_MODIFIERS.find(m => m.id === 'gold-drain')!;
const goldHalved = ALL_MODIFIERS.find(m => m.id === 'gold-halved')!;
const startingGoldZero = ALL_MODIFIERS.find(m => m.id === 'starting-gold-zero')!;

export const CleanReview: Story = {
  args: {
    reviewer: thornton,
    modifiers: [sinisterOnly],
    goldTarget: 200,
  },
};

export const WithMissedQuarters: Story = {
  args: {
    reviewer: auditor,
    modifiers: [goldDrain, goldHalved, startingGoldZero],
    goldTarget: 300,
  },
};
