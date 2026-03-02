import { TIER_CONFIG, VILLAIN_SCALE_PER_LEVEL, TaskTier } from './task.model';

describe('Task Model', () => {

  describe('TIER_CONFIG', () => {
    it('should have configs for all 4 tiers', () => {
      expect(TIER_CONFIG.petty).toBeDefined();
      expect(TIER_CONFIG.sinister).toBeDefined();
      expect(TIER_CONFIG.diabolical).toBeDefined();
      expect(TIER_CONFIG.legendary).toBeDefined();
    });

    it('should have gold increasing across tiers', () => {
      expect(TIER_CONFIG.petty.gold).toBeLessThan(TIER_CONFIG.sinister.gold);
      expect(TIER_CONFIG.sinister.gold).toBeLessThan(TIER_CONFIG.diabolical.gold);
      expect(TIER_CONFIG.diabolical.gold).toBeLessThan(TIER_CONFIG.legendary.gold);
    });

    it('should have clicks increasing across tiers', () => {
      expect(TIER_CONFIG.petty.clicks).toBeLessThan(TIER_CONFIG.sinister.clicks);
      expect(TIER_CONFIG.sinister.clicks).toBeLessThan(TIER_CONFIG.diabolical.clicks);
      expect(TIER_CONFIG.diabolical.clicks).toBeLessThan(TIER_CONFIG.legendary.clicks);
    });

    it('should have specific petty values', () => {
      expect(TIER_CONFIG.petty).toEqual({ gold: 5, clicks: 12 });
    });

    it('should have specific sinister values', () => {
      expect(TIER_CONFIG.sinister).toEqual({ gold: 15, clicks: 25 });
    });

    it('should have specific diabolical values', () => {
      expect(TIER_CONFIG.diabolical).toEqual({ gold: 40, clicks: 40 });
    });

    it('should have specific legendary values', () => {
      expect(TIER_CONFIG.legendary).toEqual({ gold: 100, clicks: 55 });
    });
  });

  describe('VILLAIN_SCALE_PER_LEVEL', () => {
    it('should be 0.05', () => {
      expect(VILLAIN_SCALE_PER_LEVEL).toBe(0.05);
    });
  });
});
