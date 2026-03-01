import type { Meta, StoryObj } from '@storybook/angular';
import { ModifierBadgeComponent } from './modifier-badge.component';
import { Modifier } from '../../../core/models/reviewer.model';

const meta: Meta<ModifierBadgeComponent> = {
  title: 'Minion Manager/Atoms/ModifierBadge',
  component: ModifierBadgeComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ModifierBadgeComponent>;

const taskConstraint: Modifier = {
  id: 'sinister-only',
  name: 'High Standards',
  description: 'Only Sinister+ tasks count toward gold target',
  category: 'task-constraint',
};

const operationalConstraint: Modifier = {
  id: 'no-hiring',
  name: 'Hiring Freeze',
  description: 'No new hires during review',
  category: 'operational-constraint',
};

const economicPenalty: Modifier = {
  id: 'gold-halved',
  name: 'Revenue Split',
  description: 'All gold rewards reduced by 50%',
  category: 'economic-penalty',
};

export const TaskConstraint: Story = {
  args: { modifier: taskConstraint },
};

export const OperationalConstraint: Story = {
  args: { modifier: operationalConstraint },
};

export const EconomicPenalty: Story = {
  args: { modifier: economicPenalty },
};
