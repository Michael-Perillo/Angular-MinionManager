import { TaskTier, TaskCategory } from './task.model';

// ─── Card types ──────────────────────────

export type CardType = 'trigger' | 'condition' | 'action';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type CardId = string;

export interface CardDefinition {
  id: CardId;
  type: CardType;
  name: string;
  description: string;
  icon: string;
  rarity: CardRarity;
}

export interface TriggerCard extends CardDefinition {
  type: 'trigger';
  eventTypes: string[];
}

export interface ConditionCard extends CardDefinition {
  type: 'condition';
  evaluate: 'specialty-match' | 'tier-gte' | 'tier-eq' | 'queue-empty' | 'gold-above' | 'gold-below';
  threshold?: number;
  tierMin?: TaskTier;
}

export interface ActionCard extends CardDefinition {
  type: 'action';
  action: 'assign-to-work' | 'assign-highest-tier' | 'assign-lowest-tier' | 'hold';
}

export type AnyCard = TriggerCard | ConditionCard | ActionCard;

// ─── Card pool ───────────────────────────

export const CARD_POOL: Record<CardId, AnyCard> = {
  // Triggers
  'when-idle': {
    id: 'when-idle', type: 'trigger', name: 'When Idle', icon: '💤',
    rarity: 'common', description: 'Fires when a minion becomes idle',
    eventTypes: ['MinionIdle'],
  },
  'when-task-appears': {
    id: 'when-task-appears', type: 'trigger', name: 'Task Spotted', icon: '👁️',
    rarity: 'common', description: 'Fires when a new task is queued',
    eventTypes: ['TaskQueued'],
  },
  'on-completion': {
    id: 'on-completion', type: 'trigger', name: 'Job Done', icon: '✅',
    rarity: 'uncommon', description: 'Fires when a task is completed',
    eventTypes: ['TaskCompleted'],
  },
  'on-level-up': {
    id: 'on-level-up', type: 'trigger', name: 'Promotion', icon: '⬆️',
    rarity: 'uncommon', description: 'Fires when a minion levels up',
    eventTypes: ['LevelUp'],
  },

  // Conditions
  'specialty-match': {
    id: 'specialty-match', type: 'condition', name: 'Right Minion', icon: '🎯',
    rarity: 'common', description: 'Minion specialty matches the task category',
    evaluate: 'specialty-match',
  },
  'tier-petty': {
    id: 'tier-petty', type: 'condition', name: 'Petty Only', icon: '🟢',
    rarity: 'common', description: 'Only matches Petty tier tasks',
    evaluate: 'tier-eq', tierMin: 'petty',
  },
  'tier-sinister-plus': {
    id: 'tier-sinister-plus', type: 'condition', name: 'Sinister+', icon: '🟡',
    rarity: 'uncommon', description: 'Only matches Sinister tier or higher tasks',
    evaluate: 'tier-gte', tierMin: 'sinister',
  },
  'queue-empty': {
    id: 'queue-empty', type: 'condition', name: 'Empty Queue', icon: '📭',
    rarity: 'common', description: 'Department queue has no queued tasks',
    evaluate: 'queue-empty',
  },
  'gold-above-100': {
    id: 'gold-above-100', type: 'condition', name: 'Flush', icon: '💰',
    rarity: 'common', description: 'Current gold is above 100',
    evaluate: 'gold-above', threshold: 100,
  },
  'gold-below-50': {
    id: 'gold-below-50', type: 'condition', name: 'Broke', icon: '💸',
    rarity: 'common', description: 'Current gold is below 50',
    evaluate: 'gold-below', threshold: 50,
  },

  // Actions
  'assign-to-work': {
    id: 'assign-to-work', type: 'action', name: 'Assign to Work', icon: '⚒️',
    rarity: 'common', description: 'Assign the minion to the next queued task',
    action: 'assign-to-work',
  },
  'assign-highest-tier': {
    id: 'assign-highest-tier', type: 'action', name: 'Top Priority', icon: '🔝',
    rarity: 'uncommon', description: 'Assign to the highest tier queued task',
    action: 'assign-highest-tier',
  },
  'assign-lowest-tier': {
    id: 'assign-lowest-tier', type: 'action', name: 'Quick Win', icon: '🔽',
    rarity: 'common', description: 'Assign to the lowest tier queued task',
    action: 'assign-lowest-tier',
  },
  'hold': {
    id: 'hold', type: 'action', name: 'Stand By', icon: '✋',
    rarity: 'common', description: 'Keep the minion idle — do nothing',
    action: 'hold',
  },
};

export const ALL_CARD_IDS: CardId[] = Object.keys(CARD_POOL);

// ─── Helpers ─────────────────────────────

export function getCard(id: CardId): AnyCard | undefined {
  return CARD_POOL[id];
}

export function getCardsByType(type: CardType): AnyCard[] {
  return ALL_CARD_IDS.map(id => CARD_POOL[id]).filter(c => c.type === type);
}

export function getCardsByRarity(rarity: CardRarity): AnyCard[] {
  return ALL_CARD_IDS.map(id => CARD_POOL[id]).filter(c => c.rarity === rarity);
}

/** The tier ordering used for tier comparisons */
export const TIER_ORDER: Record<TaskTier, number> = {
  petty: 1,
  sinister: 2,
  diabolical: 3,
  legendary: 4,
};
