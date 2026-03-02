import {
  ALL_MODIFIERS,
  REVIEWERS,
  getModifier,
  getAvailableReviewers,
  selectReviewer,
  drawModifiers,
  getReviewerGoldTarget,
  getReviewModifiers,
} from './reviewer.model';

describe('ReviewerModel', () => {
  describe('ALL_MODIFIERS', () => {
    it('should have unique IDs', () => {
      const ids = ALL_MODIFIERS.map(m => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have valid categories', () => {
      const validCategories = ['task-constraint', 'operational-constraint', 'economic-penalty'];
      for (const mod of ALL_MODIFIERS) {
        expect(validCategories).toContain(mod.category);
      }
    });
  });

  describe('getModifier', () => {
    it('should return a modifier by ID', () => {
      const mod = getModifier('no-hiring');
      expect(mod).toBeDefined();
      expect(mod!.name).toBe('Hiring Freeze');
    });

    it('should return undefined for unknown ID', () => {
      expect(getModifier('nonexistent')).toBeUndefined();
    });
  });

  describe('REVIEWERS', () => {
    it('should have unique IDs', () => {
      const ids = REVIEWERS.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have 5 reviewers', () => {
      expect(REVIEWERS.length).toBe(5);
    });

    it('should have valid base modifiers', () => {
      for (const reviewer of REVIEWERS) {
        expect(getModifier(reviewer.baseModifier)).toBeDefined();
      }
    });

    it('should have valid modifier pool entries', () => {
      for (const reviewer of REVIEWERS) {
        for (const modId of reviewer.modifierPool) {
          expect(getModifier(modId)).toBeDefined();
        }
      }
    });

    it('should have gold targets > 0', () => {
      for (const reviewer of REVIEWERS) {
        expect(reviewer.goldTarget).toBeGreaterThan(0);
      }
    });
  });

  describe('getAvailableReviewers', () => {
    it('should return 3 reviewers for Year 1', () => {
      const available = getAvailableReviewers(1);
      expect(available.length).toBe(3);
      expect(available.every(r => r.yearMinimum <= 1)).toBe(true);
    });

    it('should return all 5 reviewers for Year 2', () => {
      const available = getAvailableReviewers(2);
      expect(available.length).toBe(5);
    });

    it('should return all 5 reviewers for Year 3+', () => {
      const available = getAvailableReviewers(3);
      expect(available.length).toBe(5);
    });
  });

  describe('selectReviewer', () => {
    it('should return a reviewer from the available pool', () => {
      const reviewer = selectReviewer(1, () => 0);
      expect(reviewer.yearMinimum).toBeLessThanOrEqual(1);
    });

    it('should select deterministically with rng', () => {
      // rng = 0 should always pick the first available
      const r1 = selectReviewer(1, () => 0);
      const r2 = selectReviewer(1, () => 0);
      expect(r1.id).toBe(r2.id);
    });

    it('should select different reviewers with different rng values', () => {
      const r1 = selectReviewer(1, () => 0);
      const r2 = selectReviewer(1, () => 0.99);
      // With 3 Y1 reviewers, 0 → first, 0.99 → last
      expect(r1.id).not.toBe(r2.id);
    });

    it('should be able to select Y2 reviewers in Year 2', () => {
      // The last available is chen (Y2), rng=0.99 should reach it
      const reviewer = selectReviewer(2, () => 0.99);
      expect(reviewer.yearMinimum).toBeLessThanOrEqual(2);
    });
  });

  describe('drawModifiers', () => {
    it('should return empty array when missedCount is 0', () => {
      const reviewer = REVIEWERS[0]; // Thornton
      expect(drawModifiers(reviewer, 0)).toEqual([]);
    });

    it('should return 1 modifier for 1 missed quarter', () => {
      const reviewer = REVIEWERS[0]; // Thornton, pool: [no-hiring, gold-reduced-30, lock-research]
      const mods = drawModifiers(reviewer, 1, () => 0);
      expect(mods.length).toBe(1);
    });

    it('should return 2 modifiers for 2 missed quarters', () => {
      const reviewer = REVIEWERS[0];
      const mods = drawModifiers(reviewer, 2, () => 0);
      expect(mods.length).toBe(2);
    });

    it('should return 3 modifiers for 3 missed quarters when pool allows', () => {
      const reviewer = REVIEWERS[0]; // pool has 3 entries
      const mods = drawModifiers(reviewer, 3, () => 0);
      expect(mods.length).toBe(3);
    });

    it('should cap at pool size', () => {
      const reviewer = REVIEWERS[0]; // pool has 3 entries
      const mods = drawModifiers(reviewer, 10, () => 0);
      expect(mods.length).toBeLessThanOrEqual(3);
    });

    it('should not include the base modifier in drawn results', () => {
      // Grimes has baseModifier: 'no-hiring' and pool includes 'no-hiring' isn't there
      // but let's verify with a reviewer whose pool doesn't include base
      for (const reviewer of REVIEWERS) {
        const mods = drawModifiers(reviewer, 3, () => 0);
        for (const mod of mods) {
          expect(mod.id).not.toBe(reviewer.baseModifier);
        }
      }
    });

    it('should return valid modifiers', () => {
      const reviewer = REVIEWERS[0];
      const mods = drawModifiers(reviewer, 3, () => 0.5);
      for (const mod of mods) {
        expect(mod.id).toBeDefined();
        expect(mod.name).toBeDefined();
      }
    });
  });

  describe('getReviewerGoldTarget', () => {
    it('should return base gold target for Year 1', () => {
      const reviewer = REVIEWERS[0]; // Thornton, goldTarget: 200
      expect(getReviewerGoldTarget(reviewer, 1)).toBe(200);
    });

    it('should scale gold target for Year 2', () => {
      const reviewer = REVIEWERS[0];
      expect(getReviewerGoldTarget(reviewer, 2)).toBe(Math.round(200 * 2.2));
    });

    it('should scale gold target for Year 3', () => {
      const reviewer = REVIEWERS[0];
      expect(getReviewerGoldTarget(reviewer, 3)).toBe(Math.round(200 * 2.2 * 2.2));
    });
  });

  describe('getReviewModifiers', () => {
    it('should include base modifier with 0 missed quarters', () => {
      const reviewer = REVIEWERS[0]; // base: sinister-only
      const mods = getReviewModifiers(reviewer, 0);
      expect(mods.length).toBe(1);
      expect(mods[0].id).toBe('sinister-only');
    });

    it('should include base + extras for missed quarters', () => {
      const reviewer = REVIEWERS[0];
      const mods = getReviewModifiers(reviewer, 2, () => 0);
      expect(mods.length).toBe(3); // 1 base + 2 drawn
      expect(mods[0].id).toBe('sinister-only'); // base is first
    });

    it('should not duplicate base modifier in extras', () => {
      for (const reviewer of REVIEWERS) {
        const mods = getReviewModifiers(reviewer, 3, () => 0);
        const ids = mods.map(m => m.id);
        // base should only appear once
        expect(ids.filter(id => id === reviewer.baseModifier).length).toBeLessThanOrEqual(1);
      }
    });
  });
});
