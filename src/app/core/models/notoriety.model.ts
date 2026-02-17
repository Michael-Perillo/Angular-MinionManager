import { TaskTier } from './task.model';

/** Notoriety gained per task tier completed */
export const NOTORIETY_PER_TIER: Record<TaskTier, number> = {
  petty: 2,
  sinister: 5,
  diabolical: 12,
  legendary: 25,
};

/** Max notoriety before consequences become severe */
export const MAX_NOTORIETY = 100;

/** Notoriety thresholds */
export type ThreatLevel = 'unknown' | 'suspicious' | 'wanted' | 'hunted' | 'infamous';

export function getThreatLevel(notoriety: number): ThreatLevel {
  if (notoriety < 15) return 'unknown';
  if (notoriety < 35) return 'suspicious';
  if (notoriety < 60) return 'wanted';
  if (notoriety < 85) return 'hunted';
  return 'infamous';
}

export function getThreatLabel(threat: ThreatLevel): string {
  switch (threat) {
    case 'unknown': return 'Unknown';
    case 'suspicious': return 'Suspicious';
    case 'wanted': return 'Wanted';
    case 'hunted': return 'Hunted';
    case 'infamous': return 'Infamous';
  }
}

/** Gold penalty from high notoriety: reduces rewards by up to 30% */
export function notorietyGoldPenalty(notoriety: number): number {
  if (notoriety < 35) return 0;
  // Linear from 0% at 35 to 30% at 100
  return Math.min(0.30, ((notoriety - 35) / 65) * 0.30);
}

/** Bribe cost to reduce notoriety by 10 points */
export function bribeCost(notoriety: number): number {
  // Scales with how notorious you are: 20g base, +2g per notoriety point
  return Math.floor(20 + notoriety * 2);
}

/** Cover Your Tracks missions reduce notoriety by this amount */
export const COVER_TRACKS_REDUCTION = 15;
