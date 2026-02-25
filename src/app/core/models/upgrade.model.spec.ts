import { upgradeCost, createDefaultUpgrades, Upgrade } from './upgrade.model';

describe('Upgrade Model', () => {

  describe('upgradeCost', () => {
    it('should return baseCost at level 0', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', maxLevel: 5, currentLevel: 0, baseCost: 100, costScale: 2.0,
      };
      expect(upgradeCost(upgrade)).toBe(100);
    });

    it('should scale by costScale at level 1', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', maxLevel: 5, currentLevel: 1, baseCost: 100, costScale: 2.0,
      };
      expect(upgradeCost(upgrade)).toBe(200);
    });

    it('should scale exponentially', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', maxLevel: 10, currentLevel: 3, baseCost: 100, costScale: 2.0,
      };
      // 100 * 2^3 = 800
      expect(upgradeCost(upgrade)).toBe(800);
    });

    it('should floor the result', () => {
      const upgrade: Upgrade = {
        id: 'test', name: 'Test', description: '', category: 'click',
        icon: '', maxLevel: 10, currentLevel: 1, baseCost: 30, costScale: 1.8,
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
        icon: '', maxLevel: 10, currentLevel: 5, baseCost: 100, costScale: 2.5,
      };
      expect(upgradeCost(upgrade)).toBeGreaterThan(5000);
    });
  });

  describe('createDefaultUpgrades', () => {
    it('should return 10 upgrades', () => {
      expect(createDefaultUpgrades().length).toBe(10);
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
    });

    it('should have positive baseCost and costScale > 1 for all', () => {
      createDefaultUpgrades().forEach(u => {
        expect(u.baseCost).toBeGreaterThan(0);
        expect(u.costScale).toBeGreaterThan(1);
      });
    });

    it('should have maxLevel > 0 for all', () => {
      createDefaultUpgrades().forEach(u => {
        expect(u.maxLevel).toBeGreaterThan(0);
      });
    });
  });
});
