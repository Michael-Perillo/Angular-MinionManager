export type UpgradeCategory = 'click' | 'minion' | 'war-room' | 'department';
export type UpgradeEffectType = 'percentage' | 'additive' | 'refresh-multiplier';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  icon: string;
  currentLevel: number;
  baseCost: number;
  costScale: number; // multiplier per level
  effectType: UpgradeEffectType;
  effectRate: number;
  effectMax: number; // asymptotic cap for percentage types; 0 = not used
}

export function upgradeCost(upgrade: Upgrade): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costScale, upgrade.currentLevel));
}

/** Calculate the current effect of an upgrade at its current level */
export function upgradeEffect(upgrade: Upgrade): number {
  return upgradeEffectAtLevel(upgrade, upgrade.currentLevel);
}

/** Calculate the effect of an upgrade at a given level */
export function upgradeEffectAtLevel(upgrade: Upgrade, level: number): number {
  if (level <= 0) return 0;
  switch (upgrade.effectType) {
    case 'percentage':
      // Asymptotic: approaches effectMax
      return upgrade.effectMax * (1 - 1 / (1 + level * upgrade.effectRate));
    case 'additive':
      // Logarithmic growth
      return Math.floor(upgrade.effectRate * Math.log(level + 1));
    case 'refresh-multiplier':
      // Asymptotic speedup: returns multiplier on interval (smaller = faster)
      return 1 / (1 + level * upgrade.effectRate);
  }
}

export function createDefaultUpgrades(): Upgrade[] {
  return [
    // Click Power upgrades
    {
      id: 'click-power',
      name: 'Iron Fingers',
      description: 'Each click counts as multiple clicks.',
      category: 'click',
      icon: '👆',
      currentLevel: 0,
      baseCost: 30,
      costScale: 1.8,
      effectType: 'additive',
      effectRate: 4.17,
      effectMax: 0,
    },
    {
      id: 'click-gold',
      name: 'Golden Touch',
      description: 'Bonus gold from manually completed tasks.',
      category: 'click',
      icon: '✨',
      currentLevel: 0,
      baseCost: 50,
      costScale: 2.0,
      effectType: 'percentage',
      effectRate: 0.5,
      effectMax: 1.5,
    },

    // Minion Training upgrades
    {
      id: 'minion-speed',
      name: 'Speed Drills',
      description: 'Global minion speed bonus.',
      category: 'minion',
      icon: '⚡',
      currentLevel: 0,
      baseCost: 60,
      costScale: 1.9,
      effectType: 'percentage',
      effectRate: 0.4,
      effectMax: 1.0,
    },
    {
      id: 'minion-efficiency',
      name: 'Profit Training',
      description: 'Global minion efficiency bonus.',
      category: 'minion',
      icon: '💰',
      currentLevel: 0,
      baseCost: 60,
      costScale: 1.9,
      effectType: 'percentage',
      effectRate: 0.4,
      effectMax: 1.0,
    },
    {
      id: 'minion-xp',
      name: 'Fast Learner',
      description: 'Bonus minion XP gain from tasks.',
      category: 'minion',
      icon: '📚',
      currentLevel: 0,
      baseCost: 100,
      costScale: 2.2,
      effectType: 'percentage',
      effectRate: 0.2,
      effectMax: 2.0,
    },

    // War Room upgrades
    {
      id: 'board-slots',
      name: 'Expanded Intel',
      description: 'Additional mission board slots.',
      category: 'war-room',
      icon: '📋',
      currentLevel: 0,
      baseCost: 80,
      costScale: 2.0,
      effectType: 'additive',
      effectRate: 8.37,
      effectMax: 0,
    },
    {
      id: 'active-slots',
      name: 'Operations Desk',
      description: 'Additional active mission slots.',
      category: 'war-room',
      icon: '🗂️',
      currentLevel: 0,
      baseCost: 120,
      costScale: 2.5,
      effectType: 'additive',
      effectRate: 2.79,
      effectMax: 0,
    },
    {
      id: 'board-refresh',
      name: 'Rapid Intel',
      description: 'Board refreshes faster.',
      category: 'war-room',
      icon: '🔄',
      currentLevel: 0,
      baseCost: 70,
      costScale: 2.0,
      effectType: 'refresh-multiplier',
      effectRate: 0.4,
      effectMax: 0,
    },

    // Department upgrades
    {
      id: 'dept-xp-boost',
      name: 'Department Funding',
      description: 'Bonus department XP gain.',
      category: 'department',
      icon: '🏛️',
      currentLevel: 0,
      baseCost: 90,
      costScale: 2.0,
      effectType: 'percentage',
      effectRate: 0.5,
      effectMax: 1.5,
    },
    {
      id: 'hire-discount',
      name: 'Recruitment Agency',
      description: 'Reduced minion hire cost.',
      category: 'minion',
      icon: '🏷️',
      currentLevel: 0,
      baseCost: 75,
      costScale: 2.2,
      effectType: 'percentage',
      effectRate: 0.4,
      effectMax: 0.6,
    },

  ];
}
