import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within, fn, userEvent } from 'storybook/test';
import { RuleEditorComponent } from './rule-editor.component';
import { Rule, DEFAULT_RULE, createRule } from '../../../core/models/rule.model';
import { CardId, ALL_CARD_IDS } from '../../../core/models/card.model';

const allCards = (): Set<CardId> => new Set(ALL_CARD_IDS);

const meta: Meta<RuleEditorComponent> = {
  title: 'Minion Manager/Organisms/RuleEditor',
  component: RuleEditorComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<RuleEditorComponent>;

export const EmptySlots: Story = {
  args: {
    rules: [DEFAULT_RULE],
    ownedCards: allCards(),
    maxSlots: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show 0/3 slots and default rule
    expect(canvas.getByTestId('default-rule')).toBeTruthy();
    expect(canvas.getByTestId('add-rule-btn')).toBeTruthy();
    expect(canvasElement.textContent).toContain('0/3');
  },
};

export const WithRules: Story = {
  args: {
    rules: [
      createRule('when-idle', 'assign-to-work', ['specialty-match']),
      createRule('when-task-appears', 'assign-highest-tier', []),
      DEFAULT_RULE,
    ],
    ownedCards: allCards(),
    maxSlots: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show 2/3 slots used
    expect(canvasElement.textContent).toContain('2/3');
    // Default rule should still show
    expect(canvas.getByTestId('default-rule')).toBeTruthy();
  },
};

export const FullSlots: Story = {
  args: {
    rules: [
      createRule('when-idle', 'assign-to-work', ['specialty-match']),
      createRule('when-task-appears', 'assign-highest-tier', []),
      createRule('on-completion', 'assign-lowest-tier', ['queue-empty']),
      DEFAULT_RULE,
    ],
    ownedCards: allCards(),
    maxSlots: 3,
  },
  play: async ({ canvasElement }) => {
    // Should not show add button when at max slots
    const addBtn = canvasElement.querySelector('[data-testid="add-rule-btn"]');
    expect(addBtn).toBeNull();
  },
};

export const BuilderInteraction: Story = {
  args: {
    rules: [DEFAULT_RULE],
    ownedCards: allCards(),
    maxSlots: 3,
    ruleAdded: fn(),
    closed: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click Add Rule to open builder
    await userEvent.click(canvas.getByTestId('add-rule-btn'));

    // Builder should be visible with trigger/condition/action pickers
    expect(canvas.getByText('New Rule')).toBeTruthy();

    // Close button should dismiss
    const closeBtn = canvas.getByTestId('rule-editor-close');
    expect(closeBtn).toBeTruthy();
  },
};
