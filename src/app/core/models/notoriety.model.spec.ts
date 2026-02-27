import {
  getThreatLevel, notorietyGoldPenalty, bribeCost,
  NOTORIETY_PER_TIER, MAX_NOTORIETY, COVER_TRACKS_REDUCTION,
  BASE_NOTORIETY_DECAY,
} from './notoriety.model';

describe('Notoriety Model', () => {

  describe('getThreatLevel', () => {
    it('should return "unknown" at 0', () => {
      expect(getThreatLevel(0)).toBe('unknown');
    });

    it('should return "unknown" at 14', () => {
      expect(getThreatLevel(14)).toBe('unknown');
    });

    it('should return "suspicious" at 15', () => {
      expect(getThreatLevel(15)).toBe('suspicious');
    });

    it('should return "suspicious" at 34', () => {
      expect(getThreatLevel(34)).toBe('suspicious');
    });

    it('should return "wanted" at 35', () => {
      expect(getThreatLevel(35)).toBe('wanted');
    });

    it('should return "wanted" at 59', () => {
      expect(getThreatLevel(59)).toBe('wanted');
    });

    it('should return "hunted" at 60', () => {
      expect(getThreatLevel(60)).toBe('hunted');
    });

    it('should return "hunted" at 84', () => {
      expect(getThreatLevel(84)).toBe('hunted');
    });

    it('should return "infamous" at 85', () => {
      expect(getThreatLevel(85)).toBe('infamous');
    });

    it('should return "infamous" at 100', () => {
      expect(getThreatLevel(100)).toBe('infamous');
    });
  });

  describe('notorietyGoldPenalty', () => {
    it('should return 0 at notoriety 0', () => {
      expect(notorietyGoldPenalty(0)).toBe(0);
    });

    it('should return 0 at notoriety 34', () => {
      expect(notorietyGoldPenalty(34)).toBe(0);
    });

    it('should start penalizing at 35', () => {
      expect(notorietyGoldPenalty(35)).toBe(0);  // (35-35)/65*0.30 = 0
    });

    it('should return small penalty at 50', () => {
      const penalty = notorietyGoldPenalty(50);
      expect(penalty).toBeGreaterThan(0);
      expect(penalty).toBeLessThan(0.15);
    });

    it('should return 0.30 (max) at 100', () => {
      expect(notorietyGoldPenalty(100)).toBeCloseTo(0.30, 5);
    });

    it('should cap at 0.30 for values above 100', () => {
      expect(notorietyGoldPenalty(150)).toBe(0.30);
    });

    it('should increase monotonically from 35 to 100', () => {
      let prev = 0;
      for (let n = 35; n <= 100; n += 5) {
        const penalty = notorietyGoldPenalty(n);
        expect(penalty).toBeGreaterThanOrEqual(prev);
        prev = penalty;
      }
    });
  });

  describe('bribeCost', () => {
    it('should cost 20g at 0 notoriety', () => {
      expect(bribeCost(0)).toBe(20);
    });

    it('should cost 120g at 50 notoriety', () => {
      expect(bribeCost(50)).toBe(120);
    });

    it('should cost 220g at 100 notoriety', () => {
      expect(bribeCost(100)).toBe(220);
    });

    it('should scale linearly with notoriety', () => {
      const cost1 = bribeCost(10);
      const cost2 = bribeCost(20);
      const cost3 = bribeCost(30);
      expect(cost2 - cost1).toBe(cost3 - cost2);
    });
  });

  describe('constants', () => {
    it('NOTORIETY_PER_TIER should increase with tier', () => {
      expect(NOTORIETY_PER_TIER.petty).toBeLessThan(NOTORIETY_PER_TIER.sinister);
      expect(NOTORIETY_PER_TIER.sinister).toBeLessThan(NOTORIETY_PER_TIER.diabolical);
      expect(NOTORIETY_PER_TIER.diabolical).toBeLessThan(NOTORIETY_PER_TIER.legendary);
    });

    it('MAX_NOTORIETY should be 100', () => {
      expect(MAX_NOTORIETY).toBe(100);
    });

    it('COVER_TRACKS_REDUCTION should have per-tier values', () => {
      expect(COVER_TRACKS_REDUCTION.petty).toBe(15);
      expect(COVER_TRACKS_REDUCTION.sinister).toBe(15);
      expect(COVER_TRACKS_REDUCTION.diabolical).toBe(25);
      expect(COVER_TRACKS_REDUCTION.legendary).toBe(40);
    });

    it('BASE_NOTORIETY_DECAY should be 0.05', () => {
      expect(BASE_NOTORIETY_DECAY).toBe(0.05);
    });
  });
});
