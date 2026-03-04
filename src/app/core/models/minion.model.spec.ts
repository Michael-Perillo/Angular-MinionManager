import {
  MINION_ARCHETYPES, ALL_ARCHETYPE_IDS, MinionArchetype, MinionRarity,
  rollHireOptions, getActivePassives, aggregatePassiveFlat, aggregatePassiveMult,
  getMinionDisplay, getRarityColor, getRarityBorderColor, getArchetype, Minion,
} from './minion.model';

describe('Minion Model (Archetype System)', () => {

  describe('MINION_ARCHETYPES', () => {
    it('should have 18 archetypes', () => {
      expect(ALL_ARCHETYPE_IDS.length).toBe(18);
    });

    it('should have unique IDs', () => {
      expect(new Set(ALL_ARCHETYPE_IDS).size).toBe(18);
    });

    it('should have valid rarity on all archetypes', () => {
      const validRarities: MinionRarity[] = ['common', 'uncommon', 'rare'];
      for (const id of ALL_ARCHETYPE_IDS) {
        expect(validRarities).toContain(MINION_ARCHETYPES[id].rarity);
      }
    });

    it('should have 8 common, 6 uncommon, 4 rare', () => {
      const archs = ALL_ARCHETYPE_IDS.map(id => MINION_ARCHETYPES[id]);
      expect(archs.filter(a => a.rarity === 'common').length).toBe(8);
      expect(archs.filter(a => a.rarity === 'uncommon').length).toBe(6);
      expect(archs.filter(a => a.rarity === 'rare').length).toBe(4);
    });

    it('each archetype should have required fields', () => {
      for (const id of ALL_ARCHETYPE_IDS) {
        const arch = MINION_ARCHETYPES[id];
        expect(arch.id).toBe(id);
        expect(arch.name).toBeTruthy();
        expect(arch.icon).toBeTruthy();
        expect(arch.color).toBeTruthy();
        expect(arch.passive).toBeTruthy();
        expect(arch.passive.effectType).toBeTruthy();
        expect(arch.passive.scope).toBeTruthy();
        expect(arch.description).toBeTruthy();
      }
    });
  });

  describe('getArchetype', () => {
    it('should return archetype for valid ID', () => {
      const arch = getArchetype('penny-pincher');
      expect(arch).toBeTruthy();
      expect(arch!.name).toBe('Penny Pincher');
    });

    it('should return undefined for invalid ID', () => {
      expect(getArchetype('nonexistent')).toBeUndefined();
    });
  });

  describe('getMinionDisplay', () => {
    it('should return archetype for valid minion', () => {
      const minion: Minion = {
        id: 'test', archetypeId: 'iron-grip', role: 'worker',
        status: 'idle', assignedTaskId: null, assignedDepartment: null,
      };
      const display = getMinionDisplay(minion);
      expect(display.name).toBe('Iron Grip');
      expect(display.icon).toBe('👊');
    });

    it('should fallback to penny-pincher for unknown archetype', () => {
      const minion: Minion = {
        id: 'test', archetypeId: 'unknown', role: 'worker',
        status: 'idle', assignedTaskId: null, assignedDepartment: null,
      };
      const display = getMinionDisplay(minion);
      expect(display.name).toBe('Penny Pincher');
    });
  });

  describe('rollHireOptions', () => {
    it('should return the requested number of options', () => {
      const options = rollHireOptions(3);
      expect(options.length).toBe(3);
    });

    it('should return valid archetype IDs', () => {
      const options = rollHireOptions(10);
      for (const id of options) {
        expect(MINION_ARCHETYPES[id]).toBeTruthy();
      }
    });

    it('should respect rarity weights with deterministic rng', () => {
      // rng always returns 0 → common rarity
      const options = rollHireOptions(5, () => 0);
      for (const id of options) {
        expect(MINION_ARCHETYPES[id].rarity).toBe('common');
      }
    });

    it('should return rare with high rng roll', () => {
      // rng returns 0.99 → rare rarity (87+ out of 100)
      const options = rollHireOptions(5, () => 0.99);
      for (const id of options) {
        expect(MINION_ARCHETYPES[id].rarity).toBe('rare');
      }
    });
  });

  describe('getActivePassives', () => {
    const makeMinion = (id: string, archetypeId: string, role: 'worker' | 'manager', dept: string | null): Minion => ({
      id, archetypeId, role, status: 'idle', assignedTaskId: null,
      assignedDepartment: dept as any,
    });

    it('should return manager passive for all tasks in dept', () => {
      const minions: Minion[] = [
        makeMinion('m1', 'penny-pincher', 'manager', 'schemes'),
      ];
      const passives = getActivePassives(minions, 'schemes');
      expect(passives.length).toBe(1);
      expect(passives[0].id).toBe('penny-pincher');
    });

    it('should return worker passive only for their own tasks', () => {
      const minions: Minion[] = [
        makeMinion('m1', 'penny-pincher', 'worker', 'schemes'),
      ];
      // Without minionId — worker passive not included
      expect(getActivePassives(minions, 'schemes').length).toBe(0);
      // With minionId — worker passive included
      expect(getActivePassives(minions, 'schemes', 'm1').length).toBe(1);
    });

    it('should exclude minions from different departments', () => {
      const minions: Minion[] = [
        makeMinion('m1', 'penny-pincher', 'manager', 'heists'),
      ];
      expect(getActivePassives(minions, 'schemes').length).toBe(0);
    });

    it('should respect scope-limited passives', () => {
      const minions: Minion[] = [
        // vault-cracker has scope: 'heists'
        makeMinion('m1', 'vault-cracker', 'manager', 'schemes'),
      ];
      // Assigned to schemes but passive only applies to heists
      expect(getActivePassives(minions, 'schemes').length).toBe(0);
    });

    it('should include scope-matched department-specific passives', () => {
      const minions: Minion[] = [
        makeMinion('m1', 'vault-cracker', 'manager', 'heists'),
      ];
      expect(getActivePassives(minions, 'heists').length).toBe(1);
    });
  });

  describe('aggregatePassiveFlat', () => {
    it('should sum flat values for matching effect type', () => {
      const archetypes: MinionArchetype[] = [
        MINION_ARCHETYPES['tip-jar'],       // +1 gold-flat
        MINION_ARCHETYPES['double-dipper'], // +2 gold-flat
      ];
      expect(aggregatePassiveFlat(archetypes, 'gold-flat')).toBe(3);
    });

    it('should return 0 when no matching effects', () => {
      const archetypes: MinionArchetype[] = [MINION_ARCHETYPES['penny-pincher']]; // gold-mult
      expect(aggregatePassiveFlat(archetypes, 'gold-flat')).toBe(0);
    });
  });

  describe('aggregatePassiveMult', () => {
    it('should multiply values for matching effect type', () => {
      const archetypes: MinionArchetype[] = [
        MINION_ARCHETYPES['taskmaster'],  // 1.2× speed-mult
        MINION_ARCHETYPES['overdriver'],  // 1.4× speed-mult
      ];
      expect(aggregatePassiveMult(archetypes, 'speed-mult')).toBeCloseTo(1.68, 2);
    });

    it('should return 1 when no matching effects', () => {
      const archetypes: MinionArchetype[] = [MINION_ARCHETYPES['penny-pincher']];
      expect(aggregatePassiveMult(archetypes, 'speed-mult')).toBe(1);
    });
  });

  describe('getRarityColor', () => {
    it('should return different classes for each rarity', () => {
      const common = getRarityColor('common');
      const uncommon = getRarityColor('uncommon');
      const rare = getRarityColor('rare');
      expect(common).not.toBe(uncommon);
      expect(uncommon).not.toBe(rare);
    });
  });

  describe('getRarityBorderColor', () => {
    it('should return different border classes for each rarity', () => {
      const common = getRarityBorderColor('common');
      const uncommon = getRarityBorderColor('uncommon');
      const rare = getRarityBorderColor('rare');
      expect(common).not.toBe(uncommon);
      expect(uncommon).not.toBe(rare);
    });
  });
});
