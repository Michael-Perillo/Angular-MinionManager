import {
  CARD_POOL, ALL_CARD_IDS, AnyCard, CardType,
  getCard, getCardsByType, getCardsByRarity, TIER_ORDER,
  TriggerCard, ConditionCard, ActionCard,
} from './card.model';

describe('Card Model', () => {
  describe('CARD_POOL', () => {
    it('should define exactly 14 starter cards', () => {
      expect(ALL_CARD_IDS.length).toBe(14);
      expect(Object.keys(CARD_POOL).length).toBe(14);
    });

    it('each card has required fields', () => {
      for (const id of ALL_CARD_IDS) {
        const card = CARD_POOL[id];
        expect(card.id).toBe(id);
        expect(card.name).toBeTruthy();
        expect(card.description).toBeTruthy();
        expect(card.icon).toBeTruthy();
        expect(['trigger', 'condition', 'action']).toContain(card.type);
        expect(['common', 'uncommon', 'rare', 'legendary']).toContain(card.rarity);
      }
    });

    it('has 4 trigger cards', () => {
      const triggers = ALL_CARD_IDS.filter(id => CARD_POOL[id].type === 'trigger');
      expect(triggers.length).toBe(4);
    });

    it('has 6 condition cards', () => {
      const conditions = ALL_CARD_IDS.filter(id => CARD_POOL[id].type === 'condition');
      expect(conditions.length).toBe(6);
    });

    it('has 4 action cards', () => {
      const actions = ALL_CARD_IDS.filter(id => CARD_POOL[id].type === 'action');
      expect(actions.length).toBe(4);
    });

    it('trigger cards have eventTypes arrays', () => {
      for (const id of ALL_CARD_IDS) {
        const card = CARD_POOL[id];
        if (card.type === 'trigger') {
          const trigger = card as TriggerCard;
          expect(trigger.eventTypes).toBeTruthy();
          expect(trigger.eventTypes.length).toBeGreaterThan(0);
        }
      }
    });

    it('condition cards have evaluate field', () => {
      for (const id of ALL_CARD_IDS) {
        const card = CARD_POOL[id];
        if (card.type === 'condition') {
          const condition = card as ConditionCard;
          expect(condition.evaluate).toBeTruthy();
        }
      }
    });

    it('action cards have action field', () => {
      for (const id of ALL_CARD_IDS) {
        const card = CARD_POOL[id];
        if (card.type === 'action') {
          const action = card as ActionCard;
          expect(action.action).toBeTruthy();
        }
      }
    });

    it('gold condition cards have threshold', () => {
      const goldAbove = CARD_POOL['gold-above-100'] as ConditionCard;
      expect(goldAbove.threshold).toBe(100);
      const goldBelow = CARD_POOL['gold-below-50'] as ConditionCard;
      expect(goldBelow.threshold).toBe(50);
    });

    it('tier condition cards have tierMin', () => {
      const pettyOnly = CARD_POOL['tier-petty'] as ConditionCard;
      expect(pettyOnly.tierMin).toBe('petty');
      const sinisterPlus = CARD_POOL['tier-sinister-plus'] as ConditionCard;
      expect(sinisterPlus.tierMin).toBe('sinister');
    });
  });

  describe('getCard', () => {
    it('returns the card for a valid ID', () => {
      expect(getCard('when-idle')?.name).toBe('When Idle');
      expect(getCard('assign-to-work')?.name).toBe('Assign to Work');
    });

    it('returns undefined for an invalid ID', () => {
      expect(getCard('nonexistent')).toBeUndefined();
    });
  });

  describe('getCardsByType', () => {
    it('returns only trigger cards', () => {
      const triggers = getCardsByType('trigger');
      expect(triggers.length).toBe(4);
      for (const card of triggers) {
        expect(card.type).toBe('trigger');
      }
    });

    it('returns only condition cards', () => {
      const conditions = getCardsByType('condition');
      expect(conditions.length).toBe(6);
      for (const card of conditions) {
        expect(card.type).toBe('condition');
      }
    });

    it('returns only action cards', () => {
      const actions = getCardsByType('action');
      expect(actions.length).toBe(4);
      for (const card of actions) {
        expect(card.type).toBe('action');
      }
    });
  });

  describe('getCardsByRarity', () => {
    it('returns common cards', () => {
      const common = getCardsByRarity('common');
      expect(common.length).toBeGreaterThan(0);
      for (const card of common) {
        expect(card.rarity).toBe('common');
      }
    });

    it('returns uncommon cards', () => {
      const uncommon = getCardsByRarity('uncommon');
      expect(uncommon.length).toBeGreaterThan(0);
      for (const card of uncommon) {
        expect(card.rarity).toBe('uncommon');
      }
    });

    it('returns empty array for legendary (none in starter set)', () => {
      const legendary = getCardsByRarity('legendary');
      expect(legendary.length).toBe(0);
    });
  });

  describe('TIER_ORDER', () => {
    it('orders tiers correctly', () => {
      expect(TIER_ORDER['petty']).toBeLessThan(TIER_ORDER['sinister']);
      expect(TIER_ORDER['sinister']).toBeLessThan(TIER_ORDER['diabolical']);
      expect(TIER_ORDER['diabolical']).toBeLessThan(TIER_ORDER['legendary']);
    });
  });
});
