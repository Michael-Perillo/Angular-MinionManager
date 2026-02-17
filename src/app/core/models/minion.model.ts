export interface Minion {
  id: string;
  name: string;
  appearance: MinionAppearance;
  status: 'idle' | 'working';
  assignedTaskId: string | null;
}

export interface MinionAppearance {
  color: string;
  accessory: 'goggles' | 'helmet' | 'cape' | 'horns' | 'none';
}

export const MINION_NAMES: string[] = [
  'Grim', 'Skulk', 'Mortis', 'Dread', 'Vex',
  'Blight', 'Scourge', 'Wraith', 'Gloom', 'Malice',
  'Spite', 'Ruin', 'Hex', 'Fang', 'Shade',
  'Doom', 'Murk', 'Cinder', 'Rot', 'Snarl',
  'Blaze', 'Torment', 'Havoc', 'Nox', 'Vile',
];

export const MINION_COLORS: string[] = [
  '#6c3483', '#1a5276', '#7b241c', '#1e8449', '#b9770e',
  '#5b2c6f', '#154360', '#922b21', '#196f3d', '#9a7d0a',
  '#4a235a', '#1b4f72', '#78281f', '#1d8348', '#7d6608',
];

export const MINION_ACCESSORIES: MinionAppearance['accessory'][] = [
  'goggles', 'helmet', 'cape', 'horns', 'none',
];
