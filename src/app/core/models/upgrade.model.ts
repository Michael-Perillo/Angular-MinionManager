export type UpgradeCategory = 'click' | 'minion' | 'war-room' | 'department';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  icon: string;
  maxLevel: number;
  currentLevel: number;
  baseCost: number;
  costScale: number; // multiplier per level
}

export function upgradeCost(upgrade: Upgrade): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costScale, upgrade.currentLevel));
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
      maxLevel: 10,
      currentLevel: 0,
      baseCost: 30,
      costScale: 1.8,
    },
    {
      id: 'click-gold',
      name: 'Golden Touch',
      description: '+15% gold from manually completed tasks per level.',
      category: 'click',
      icon: '✨',
      maxLevel: 8,
      currentLevel: 0,
      baseCost: 50,
      costScale: 2.0,
    },

    // Minion Training upgrades
    {
      id: 'minion-speed',
      name: 'Speed Drills',
      description: '+8% global minion speed per level.',
      category: 'minion',
      icon: '⚡',
      maxLevel: 10,
      currentLevel: 0,
      baseCost: 60,
      costScale: 1.9,
    },
    {
      id: 'minion-efficiency',
      name: 'Profit Training',
      description: '+8% global minion efficiency per level.',
      category: 'minion',
      icon: '💰',
      maxLevel: 10,
      currentLevel: 0,
      baseCost: 60,
      costScale: 1.9,
    },
    {
      id: 'minion-xp',
      name: 'Fast Learner',
      description: '+20% minion XP gain per level.',
      category: 'minion',
      icon: '📚',
      maxLevel: 5,
      currentLevel: 0,
      baseCost: 100,
      costScale: 2.2,
    },

    // War Room upgrades
    {
      id: 'board-slots',
      name: 'Expanded Intel',
      description: '+3 mission board slots per level.',
      category: 'war-room',
      icon: '📋',
      maxLevel: 5,
      currentLevel: 0,
      baseCost: 80,
      costScale: 2.0,
    },
    {
      id: 'active-slots',
      name: 'Operations Desk',
      description: '+1 active mission slot per level.',
      category: 'war-room',
      icon: '🗂️',
      maxLevel: 5,
      currentLevel: 0,
      baseCost: 120,
      costScale: 2.5,
    },
    {
      id: 'board-refresh',
      name: 'Rapid Intel',
      description: 'Board refreshes 20% faster per level.',
      category: 'war-room',
      icon: '🔄',
      maxLevel: 5,
      currentLevel: 0,
      baseCost: 70,
      costScale: 2.0,
    },

    // Department upgrades
    {
      id: 'dept-xp-boost',
      name: 'Department Funding',
      description: '+15% department XP gain per level.',
      category: 'department',
      icon: '🏛️',
      maxLevel: 8,
      currentLevel: 0,
      baseCost: 90,
      costScale: 2.0,
    },
    {
      id: 'hire-discount',
      name: 'Recruitment Agency',
      description: '-8% minion hire cost per level.',
      category: 'minion',
      icon: '🏷️',
      maxLevel: 5,
      currentLevel: 0,
      baseCost: 75,
      costScale: 2.2,
    },
  ];
}
