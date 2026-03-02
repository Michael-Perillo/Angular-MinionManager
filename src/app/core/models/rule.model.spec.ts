import {
  DEFAULT_RULE, MAX_CONDITIONS_PER_RULE,
  createRule, isDefaultRule, getCardsUsedByRule, getCardsInUse,
  Rule,
} from './rule.model';

describe('Rule Model', () => {
  describe('DEFAULT_RULE', () => {
    it('has expected structure', () => {
      expect(DEFAULT_RULE.id).toBe('__default__');
      expect(DEFAULT_RULE.triggerId).toBe('when-idle');
      expect(DEFAULT_RULE.actionId).toBe('assign-to-work');
      expect(DEFAULT_RULE.conditionIds).toEqual([]);
      expect(DEFAULT_RULE.priority).toBe(Infinity);
      expect(DEFAULT_RULE.enabled).toBe(true);
    });
  });

  describe('MAX_CONDITIONS_PER_RULE', () => {
    it('is 3', () => {
      expect(MAX_CONDITIONS_PER_RULE).toBe(3);
    });
  });

  describe('createRule', () => {
    it('creates a rule with trigger and action', () => {
      const rule = createRule('when-idle', 'assign-to-work');
      expect(rule.triggerId).toBe('when-idle');
      expect(rule.actionId).toBe('assign-to-work');
      expect(rule.conditionIds).toEqual([]);
      expect(rule.enabled).toBe(true);
      expect(rule.id).toContain('rule-');
    });

    it('creates a rule with conditions', () => {
      const rule = createRule('when-idle', 'assign-to-work', ['specialty-match', 'tier-petty']);
      expect(rule.conditionIds).toEqual(['specialty-match', 'tier-petty']);
    });

    it('clamps conditions to MAX_CONDITIONS_PER_RULE', () => {
      const rule = createRule('when-idle', 'assign-to-work', ['a', 'b', 'c', 'd']);
      expect(rule.conditionIds.length).toBe(MAX_CONDITIONS_PER_RULE);
    });

    it('assigns custom priority if provided', () => {
      const rule = createRule('when-idle', 'assign-to-work', [], 5);
      expect(rule.priority).toBe(5);
    });

    it('creates unique IDs', () => {
      const r1 = createRule('when-idle', 'assign-to-work');
      const r2 = createRule('when-idle', 'assign-to-work');
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('isDefaultRule', () => {
    it('returns true for default rule', () => {
      expect(isDefaultRule(DEFAULT_RULE)).toBe(true);
    });

    it('returns false for custom rule', () => {
      const rule = createRule('when-idle', 'assign-to-work');
      expect(isDefaultRule(rule)).toBe(false);
    });
  });

  describe('getCardsUsedByRule', () => {
    it('returns empty for default rule (virtual cards)', () => {
      expect(getCardsUsedByRule(DEFAULT_RULE)).toEqual([]);
    });

    it('returns all card IDs for a custom rule', () => {
      const rule = createRule('when-idle', 'assign-highest-tier', ['specialty-match', 'tier-petty']);
      const used = getCardsUsedByRule(rule);
      expect(used).toContain('when-idle');
      expect(used).toContain('assign-highest-tier');
      expect(used).toContain('specialty-match');
      expect(used).toContain('tier-petty');
      expect(used.length).toBe(4);
    });
  });

  describe('getCardsInUse', () => {
    it('returns empty set for only default rule', () => {
      expect(getCardsInUse([DEFAULT_RULE]).size).toBe(0);
    });

    it('collects cards across multiple rules', () => {
      const r1 = createRule('when-idle', 'assign-to-work', ['specialty-match']);
      const r2 = createRule('on-completion', 'hold', ['queue-empty']);
      const used = getCardsInUse([r1, r2, DEFAULT_RULE]);
      expect(used.has('when-idle')).toBe(true);
      expect(used.has('assign-to-work')).toBe(true);
      expect(used.has('specialty-match')).toBe(true);
      expect(used.has('on-completion')).toBe(true);
      expect(used.has('hold')).toBe(true);
      expect(used.has('queue-empty')).toBe(true);
    });
  });
});
