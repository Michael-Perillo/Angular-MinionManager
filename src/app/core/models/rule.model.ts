import { CardId } from './card.model';

// ─── Rule types ──────────────────────────

export interface Rule {
  id: string;
  name: string;
  priority: number;
  triggerId: CardId;
  conditionIds: CardId[];
  actionId: CardId;
  enabled: boolean;
}

export const MAX_CONDITIONS_PER_RULE = 3;

export const DEFAULT_RULE: Rule = {
  id: '__default__',
  name: 'Default: Auto-Assign',
  priority: Infinity,
  triggerId: 'when-idle',
  conditionIds: [],
  actionId: 'assign-to-work',
  enabled: true,
};

// ─── Helpers ─────────────────────────────

let ruleCounter = 0;

export function createRule(
  triggerId: CardId,
  actionId: CardId,
  conditionIds: CardId[] = [],
  priority?: number,
): Rule {
  ruleCounter++;
  return {
    id: `rule-${ruleCounter}-${Date.now()}`,
    name: `Rule ${ruleCounter}`,
    priority: priority ?? ruleCounter,
    triggerId,
    conditionIds: conditionIds.slice(0, MAX_CONDITIONS_PER_RULE),
    actionId,
    enabled: true,
  };
}

/** Check if a rule is the immutable default rule */
export function isDefaultRule(rule: Rule): boolean {
  return rule.id === '__default__';
}

/** Get all card IDs used by a rule (trigger + conditions + action) */
export function getCardsUsedByRule(rule: Rule): CardId[] {
  if (isDefaultRule(rule)) return []; // Default rule uses virtual cards, not from collection
  return [rule.triggerId, ...rule.conditionIds, rule.actionId];
}

/** Get all card IDs used across a set of rules (excluding default) */
export function getCardsInUse(rules: Rule[]): Set<CardId> {
  const used = new Set<CardId>();
  for (const rule of rules) {
    for (const cardId of getCardsUsedByRule(rule)) {
      used.add(cardId);
    }
  }
  return used;
}
