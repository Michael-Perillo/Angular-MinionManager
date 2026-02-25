export interface Resources {
  supplies: number;
  intel: number;
}

/** Supplies earned per research task completion, scaled by tier */
export const SUPPLIES_PER_TIER: Record<string, number> = {
  petty: 2,
  sinister: 4,
  diabolical: 6,
  legendary: 10,
};

/** Intel earned per schemes task completion, scaled by tier */
export const INTEL_PER_TIER: Record<string, number> = {
  petty: 1,
  sinister: 2,
  diabolical: 3,
  legendary: 5,
};
