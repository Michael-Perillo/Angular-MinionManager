import { upgradeCost, upgradeEffect, upgradeEffectAtLevel, createDefaultUpgrades, Upgrade } from './upgrade.model';

describe('Upgrade Model', () => {

  describe('upgradeCost', () => {
    it('should return baseCost at level 0', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', currentLevel: 0, baseCost: 100, costScale: 2.0,
        effectType: 'percentage', effectRate: 0.5, effectMax: 1.0,
      };
      expect(upgradeCost(upgrade)).toBe(100);
    });

    it('should scale by costScale at level 1', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', currentLevel: 1, baseCost: 100, costScale: 2.0,
        effectType: 'percentage', effectRate: 0.5, effectMax: 1.0,
      };
      expect(upgradeCost(upgrade)).toBe(200);
    });

    it('should scale exponentially', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', currentLevel: 3, baseCost: 100, costScale: 2.0,
        effectType: 'percentage', effectRate: 0.5, effectMax: 1.0,
      };
      // 100 * 2^3 = 800
      expect(upgradeCost(upgrade)).toBe(800);
    });

    it('should floor the result', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', currentLevel: 1, baseCost: 30, costScale: 1.8,
        effectType: 'additive', effectRate: 4.17, effectMax: 0,
      };
      expect(upgradeCost(upgrade)).toBe(Math.floor(30 * 1.8));
    });

    it('should handle real upgrade: click-power at level 0', () => {
      const defaults = createDefaultUpgrades();
      const clickPower = defaults.find(u => u.id === 'click-power')!;
      expect(upgradeCost(clickPower)).toBe(30); // baseCost
    });

    it('should get expensive quickly with high costScale', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', currentLevel: 5, baseCost: 100, costScale: 2.5,
        effectType: 'percentage', effectRate: 0.5, effectMax: 1.0,
      };
      expect(upgradeCost(upgrade)).toBeGreaterThan(5000);
    });
  });

  describe('upgradeEffect', () => {
    it('should return 0 at level 0', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', currentLevel: 0, baseCost: 100, costScale: 2.0,
        effectType: 'percentage', effectRate: 0.5, effectMax: 1.0,
      };
      expect(upgradeEffect(upgrade)).toBe(0);
    });

    it('should compute percentage effect correctly', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', currentLevel: 5, baseCost: 100, costScale: 2.0,
        effectType: 'percentage', effectRate: 0.4, effectMax: 1.0,
      };
      // effectMax * (1 - 1/(1 + level * effectRate)) = 1.0 * (1 - 1/(1+2)) = 1 - 1/3 = 0.6667
      expect(upgradeEffect(upgrade)).toBeCloseTo(0.6667, 3);
    });

    it('should compute additive effect correctly', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', currentLevel: 10, baseCost: 100, costScale: 2.0,
        effectType: 'additive', effectRate: 4.17, effectMax: 0,
      };
      // floor(4.17 * ln(11)) = floor(4.17 * 2.3979) = floor(9.999) = 9
      expect(upgradeEffect(upgrade)).toBe(9);
    });

    it('should compute refresh-multiplier correctly', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'war-room',
        icon: '', currentLevel: 5, baseCost: 100, costScale: 2.0,
        effectType: 'refresh-multiplier', effectRate: 0.4, effectMax: 0,
      };
      // 1 / (1 + 5 * 0.4) = 1/3 = 0.3333
      expect(upgradeEffect(upgrade)).toBeCloseTo(0.3333, 3);
    });

    it('should compute passive-decay correctly', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'notoriety',
        icon: '', currentLevel: 3, baseCost: 100, costScale: 2.0,
        effectType: 'passive-decay', effectRate: 1.5, effectMax: 0,
      };
      // 1.5 * ln(4) = 1.5 * 1.3863 = 2.0794
      expect(upgradeEffect(upgrade)).toBeCloseTo(2.0794, 3);
    });

    it('percentage effects should approach but not exceed effectMax', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', currentLevel: 100, baseCost: 100, costScale: 2.0,
        effectType: 'percentage', effectRate: 0.5, effectMax: 1.0,
      };
      expect(upgradeEffect(upgrade)).toBeLessThan(1.0);
      expect(upgradeEffect(upgrade)).toBeGreaterThan(0.98);
    });
  });

  describe('upgradeEffectAtLevel', () => {
    it('should calculate effect at arbitrary levels', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', currentLevel: 0, baseCost: 100, costScale: 2.0,
        effectType: 'additive', effectRate: 4.17, effectMax: 0,
      };
      const atLevel5 = upgradeEffectAtLevel(upgrade, 5);
      const atLevel10 = upgradeEffectAtLevel(upgrade, 10);
      expect(atLevel10).toBeGreaterThan(atLevel5);
    });
  });

  describe('createDefaultUpgrades', () => {
    it('should return 14 upgrades (10 base + 4 notoriety)', () => {
      expect(createDefaultUpgrades().length).toBe(14);
    });

    it('should have unique IDs', () => {
      const ids = createDefaultUpgrades().map(u => u.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should start all at level 0', () => {
      createDefaultUpgrades().forEach(u => {
        expect(u.currentLevel).toBe(0);
      });
    });

    it('should return fresh copies each call (no shared references)', () => {
      const a = createDefaultUpgrades();
      const b = createDefaultUpgrades();
      a[0].currentLevel = 5;
      expect(b[0].currentLevel).toBe(0);
    });

    it('should include expected upgrade IDs', () => {
      const ids = createDefaultUpgrades().map(u => u.id);
      expect(ids).toContain('click-power');
      expect(ids).toContain('click-gold');
      expect(ids).toContain('minion-speed');
      expect(ids).toContain('minion-efficiency');
      expect(ids).toContain('minion-xp');
      expect(ids).toContain('board-slots');
      expect(ids).toContain('active-slots');
      expect(ids).toContain('board-refresh');
      expect(ids).toContain('dept-xp-boost');
      expect(ids).toContain('hire-discount');
      expect(ids).toContain('bribe-network');
      expect(ids).toContain('shadow-ops');
      expect(ids).toContain('cover-spawn');
      expect(ids).toContain('lay-low');
    });

    it('should have positive baseCost and costScale > 1 for all', () => {
      createDefaultUpgrades().forEach(u => {
        expect(u.baseCost).toBeGreaterThan(0);
        expect(u.costScale).toBeGreaterThan(1);
      });
    });

    it('should include 4 notoriety-category upgrades', () => {
      const notorietyUpgrades = createDefaultUpgrades().filter(u => u.category === 'notoriety');
      expect(notorietyUpgrades.length).toBe(4);
    });
  });
});
