     │ Balance Pass: Upgrade Redesign + Quarter Scaling (Balatro-Informed)                                                       │
     │                                                                                                                           │
     │ Context                                                                                                                   │
     │                                                                                                                           │
     │ Player power compounds multiplicatively (VL × efficiency × heists × upgrades) with no ceiling. Upgrades are infinitely    │
     │ leveled passives that just make everything scale without forcing choices. By Y2, gold targets are trivially easy. The game│
     │  lacks the "number go up" tension that Balatro does so well.                                                              │
     │                                                                                                                           │
     │ Balatro → Minion Manager Mapping                                                                                          │
     │                                                                                                                           │
     │ Structural Analogy                                                                                                        │
     │                                                                                                                           │
     │ ┌────────────────────────────────┬───────────────────────────────────┬─────────────────────────┐                          │
     │ │            Balatro             │          Minion Manager           │          Role           │                          │
     │ ├────────────────────────────────┼───────────────────────────────────┼─────────────────────────┤                          │
     │ │ Ante (8 per run)               │ Year (3+ per run)                 │ Difficulty tier         │                          │
     │ ├────────────────────────────────┼───────────────────────────────────┼─────────────────────────┤                          │
     │ │ Small/Big/Boss Blind           │ Q1/Q2/Q3                          │ Escalation within tier  │                          │
     │ ├────────────────────────────────┼───────────────────────────────────┼─────────────────────────┤                          │
     │ │ Boss Blind                     │ Q4 Year-End Review                │ Constrained challenge   │                          │
     │ ├────────────────────────────────┼───────────────────────────────────┼─────────────────────────┤                          │
     │ │ Score = Chips × Mult           │ Gold = base × VL × eff × passives │ Multiplicative output   │                          │
     │ ├────────────────────────────────┼───────────────────────────────────┼─────────────────────────┤                          │
     │ │ Jokers (5 slots, ~150 options) │ Upgrades (5 active of 10)         │ Build-defining choices  │                          │
     │ ├────────────────────────────────┼───────────────────────────────────┼─────────────────────────┤                          │
     │ │ Planet cards                   │ Department levels + minion XP     │ Incremental progression │                          │
     │ ├────────────────────────────────┼───────────────────────────────────┼─────────────────────────┤                          │
     │ │ Boss blind constraints         │ Reviewer modifiers                │ Test build robustness   │                          │
     │ ├────────────────────────────────┼───────────────────────────────────┼─────────────────────────┤                          │
     │ │ $25 interest threshold         │ Hire vs upgrade vs save           │ Economy tension         │                          │
     │ └────────────────────────────────┴───────────────────────────────────┴─────────────────────────┘                          │
     │                                                                                                                           │
     │ Balatro's Blind Scaling Chart                                                                                             │
     │                                                                                                                           │
     │ ┌──────┬────────┬────────────┬────────────┬───────────┬──────────────┐                                                    │
     │ │ Ante │  Base  │ Small (1×) │ Big (1.5×) │ Boss (2×) │ Inter-Ante × │                                                    │
     │ ├──────┼────────┼────────────┼────────────┼───────────┼──────────────┤                                                    │
     │ │ 1    │ 300    │ 300        │ 450        │ 600       │ —            │                                                    │
     │ ├──────┼────────┼────────────┼────────────┼───────────┼──────────────┤                                                    │
     │ │ 2    │ 800    │ 800        │ 1,200      │ 1,600     │ 2.67×        │                                                    │
     │ ├──────┼────────┼────────────┼────────────┼───────────┼──────────────┤                                                    │
     │ │ 3    │ 2,000  │ 2,000      │ 3,000      │ 4,000     │ 2.50×        │                                                    │
     │ ├──────┼────────┼────────────┼────────────┼───────────┼──────────────┤                                                    │
     │ │ 4    │ 5,000  │ 5,000      │ 7,500      │ 10,000    │ 2.50×        │                                                    │
     │ ├──────┼────────┼────────────┼────────────┼───────────┼──────────────┤                                                    │
     │ │ 5    │ 11,000 │ 11,000     │ 16,500     │ 22,000    │ 2.20×        │                                                    │
     │ └──────┴────────┴────────────┴────────────┴───────────┴──────────────┘                                                    │
     │                                                                                                                           │
     │ Key insight: Inter-ante scaling is 2.2-2.67× (steep!), but intra-ante is only 1×/1.5×/2× (gentle). The boss of one ante → │
     │ small of next is only ~1.3× jump — breathing room before the next escalation.                                             │
     │                                                                                                                           │
     │ Our Current Problem (Numbers)                                                                                             │
     │                                                                                                                           │
     │ End of Y1 player: VL6, 4-5 minions, Speed/Efficiency at L3-4 (uncapped)                                                   │
     │                                                                                                                           │
     │ Gold per sinister task:                                                                                                   │
     │   15g base × 1.35 (VL6) × 1.68 (eff w/ upgrade L3) × 1.16 (heists L5) = ~39g                                              │
     │                                                                                                                           │
     │ Y2Q1 old target: 135g in 40 tasks → 3.4 g/task needed                                                                     │
     │ Player output: 39 g/task → passes in ~4 tasks out of 40 ← TRIVIALLY EASY                                                  │
     │                                                                                                                           │
     │ Multiplicative stacking with no upgrade ceiling means player power grows ~10-20× while targets grow 1.8×/year. The gap    │
     │ widens every year.                                                                                                        │
     │                                                                                                                           │
     │ Balatro's Key Design Principles We're Applying                                                                            │
     │                                                                                                                           │
     │ 1. Scarcity forces identity — 5 joker slots out of 150+ options. Can't have everything. Must specialize. → 5 active       │
     │ upgrade slots out of 10                                                                                                   │
     │ 2. Big jumps, not gradual creep — Each joker is a powerful, discrete effect, not an incremental +2% passive. → 3 fixed    │
     │ levels with significant jumps                                                                                             │
     │ 3. Difficulty grows steeply — Inter-ante 2.2-2.67× growth. → Inter-year ~2.5× gold target growth                          │
     │ 4. Player should overshoot IF build is good — Balatro power can be 10×+ the requirement with a great build. The fun is    │
     │ demolishing walls. But a mediocre build FAILS. → Targets tuned so good build = 1.3-1.8× overshoot, bad build = 0.7-0.9×   │
     │ (fail)                                                                                                                    │
     │                                                                                                                           │
     │ ---                                                                                                                       │
     │ Part 1: Upgrade Redesign (Joker-Style)                                                                                    │
     │                                                                                                                           │
     │ 1A. Replace infinite leveling with fixed 3-level effects                                                                  │
     │                                                                                                                           │
     │ File: src/app/core/models/upgrade.model.ts                                                                                │
     │                                                                                                                           │
     │ Replace effectType/effectRate/effectMax/baseCost/costScale with explicit per-level values:                                │
     │                                                                                                                           │
     │ export interface Upgrade {                                                                                                │
     │   id: string;                                                                                                             │
     │   name: string;                                                                                                           │
     │   description: string;                                                                                                    │
     │   category: UpgradeCategory;                                                                                              │
     │   icon: string;                                                                                                           │
     │   currentLevel: number;                                                                                                   │
     │   maxLevel: number;           // NEW: 3 for all                                                                           │
     │   levelCosts: number[];       // NEW: explicit cost per level [L1, L2, L3]                                                │
     │   levelEffects: number[];     // NEW: explicit effect per level [L1, L2, L3]                                              │
     │   effectLabel: string;        // NEW: e.g. "% speed", "click power", "board slots"                                        │
     │ }                                                                                                                         │
     │                                                                                                                           │
     │ Drop: baseCost, costScale, effectType, effectRate, effectMax                                                              │
     │                                                                                                                           │
     │ Update upgradeCost():                                                                                                     │
     │ export function upgradeCost(upgrade: Upgrade): number {                                                                   │
     │   if (upgrade.currentLevel >= upgrade.maxLevel) return Infinity;                                                          │
     │   return upgrade.levelCosts[upgrade.currentLevel]; // index 0 = cost to buy L1                                            │
     │ }                                                                                                                         │
     │                                                                                                                           │
     │ Update upgradeEffect():                                                                                                   │
     │ export function upgradeEffect(upgrade: Upgrade): number {                                                                 │
     │   if (upgrade.currentLevel <= 0) return 0;                                                                                │
     │   return upgrade.levelEffects[upgrade.currentLevel - 1]; // index 0 = L1 effect                                           │
     │ }                                                                                                                         │
     │                                                                                                                           │
     │ Drop upgradeEffectAtLevel() and replace usages with direct levelEffects access.                                           │
     │                                                                                                                           │
     │ 1B. New upgrade values                                                                                                    │
     │                                                                                                                           │
     │ Design principle: each level should feel like acquiring a new Balatro joker — a meaningful power jump, not a marginal     │
     │ increment.                                                                                                                │
     │                                                                                                                           │
     │                                                                                                                           │
     │ ┌─────────────────┬─────────────────┬──────────────────┬──────────────────┬─────────┬─────────┬─────────┐                 │
     │ │     Upgrade     │    L1 Effect    │    L2 Effect     │    L3 Effect     │ L1 Cost │ L2 Cost │ L3 Cost │                 │
     │ ├─────────────────┼─────────────────┼──────────────────┼──────────────────┼─────────┼─────────┼─────────┤                 │
     │ │ Iron Fingers    │ +2 clicks       │ +5 clicks        │ +12 clicks       │ 40g     │ 200g    │ 600g    │                 │
     │ ├─────────────────┼─────────────────┼──────────────────┼──────────────────┼─────────┼─────────┼─────────┤                 │
     │ │ Golden Touch    │ +50% click gold │ +120% click gold │ +250% click gold │ 60g     │ 250g    │ 700g    │                 │
     │ ├─────────────────┼─────────────────┼──────────────────┼──────────────────┼─────────┼─────────┼─────────┤                 │
     │ │ Speed Drills    │ +30% speed      │ +75% speed       │ +150% speed      │ 75g     │ 300g    │ 800g    │                 │
     │ ├─────────────────┼─────────────────┼──────────────────┼──────────────────┼─────────┼─────────┼─────────┤                 │
     │ │ Profit Training │ +30% efficiency │ +75% efficiency  │ +150% efficiency │ 75g     │ 300g    │ 800g    │                 │
     │ ├─────────────────┼─────────────────┼──────────────────┼──────────────────┼─────────┼─────────┼─────────┤                 │
     │ │ Fast Learner    │ +50% XP         │ +120% XP         │ +250% XP         │ 60g     │ 250g    │ 650g    │                 │
     │ ├─────────────────┼─────────────────┼──────────────────┼──────────────────┼─────────┼─────────┼─────────┤                 │
     │ │ Hire Discount   │ -20% cost       │ -40% cost        │ -60% cost        │ 75g     │ 300g    │ 750g    │                 │
     │ ├─────────────────┼─────────────────┼──────────────────┼──────────────────┼─────────┼─────────┼─────────┤                 │
     │ │ Board Slots     │ +3 slots        │ +7 slots         │ +12 slots        │ 60g     │ 250g    │ 650g    │                 │
     │ ├─────────────────┼─────────────────┼──────────────────┼──────────────────┼─────────┼─────────┼─────────┤                 │
     │ │ Operations Desk │ +2 active       │ +4 active        │ +7 active        │ 80g     │ 350g    │ 900g    │                 │
     │ ├─────────────────┼─────────────────┼──────────────────┼──────────────────┼─────────┼─────────┼─────────┤                 │
     │ │ Rapid Intel     │ ×0.65 refresh   │ ×0.40 refresh    │ ×0.20 refresh    │ 60g     │ 250g    │ 650g    │                 │
     │ ├─────────────────┼─────────────────┼──────────────────┼──────────────────┼─────────┼─────────┼─────────┤                 │
     │ │ Dept Funding    │ +50% dept XP    │ +120% dept XP    │ +250% dept XP    │ 75g     │ 300g    │ 750g    │                 │
     │ └─────────────────┴─────────────────┴──────────────────┴──────────────────┴─────────┴─────────┴─────────┘                 │
     │                                                                                                                           │
     │ Total to max one upgrade: ~1,150g average. Total to max all 10: ~11,500g.                                                 │
     │                                                                                                                           │
     │ 1C. Active upgrade slots (5 of 10)                                                                                        │
     │                                                                                                                           │
     │ File: src/app/core/services/game-state.service.ts                                                                         │
     │                                                                                                                           │
     │ Add signals:                                                                                                              │
     │ private readonly _activeUpgradeIds = signal<Set<string>>(new Set());                                                      │
     │ readonly activeUpgradeIds = computed(() => [...this._activeUpgradeIds()]);                                                │
     │ readonly maxActiveUpgrades = 5;                                                                                           │
     │                                                                                                                           │
     │ Change getUpgradeEffect() to check active status:                                                                         │
     │ private getUpgradeEffect(id: string): number {                                                                            │
     │   if (!this._activeUpgradeIds().has(id)) return 0;  // ← inactive = no effect                                             │
     │   const upgrade = this._upgrades().find(u => u.id === id);                                                                │
     │   return upgrade ? upgradeEffect(upgrade) : 0;                                                                            │
     │ }                                                                                                                         │
     │                                                                                                                           │
     │ Add toggle method:                                                                                                        │
     │ toggleUpgradeActive(upgradeId: string): void {                                                                            │
     │   const active = this._activeUpgradeIds();                                                                                │
     │   if (active.has(upgradeId)) {                                                                                            │
     │     this._activeUpgradeIds.update(s => { const n = new Set(s); n.delete(upgradeId); return n; });                         │
     │   } else if (active.size < this.maxActiveUpgrades) {                                                                      │
     │     this._activeUpgradeIds.update(s => new Set([...s, upgradeId]));                                                       │
     │   }                                                                                                                       │
     │ }                                                                                                                         │
     │                                                                                                                           │
     │ Auto-activate on first purchase (if slots available):                                                                     │
     │ // In purchaseUpgrade(), after incrementing level:                                                                        │
     │ if (upgrade.currentLevel === 0) { // was 0, now becoming 1                                                                │
     │   if (this._activeUpgradeIds().size < this.maxActiveUpgrades) {                                                           │
     │     this._activeUpgradeIds.update(s => new Set([...s, upgradeId]));                                                       │
     │   }                                                                                                                       │
     │ }                                                                                                                         │
     │                                                                                                                           │
     │ 1D. Upgrade shop UI updates                                                                                               │
     │                                                                                                                           │
     │ File: src/app/shared/components/upgrade-shop/upgrade-shop.component.ts                                                    │
     │                                                                                                                           │
     │ Changes:                                                                                                                  │
     │ - Add activeUpgradeIds input + toggleActive output                                                                        │
     │ - Show active/inactive toggle per upgrade (colored dot or checkbox)                                                       │
     │ - Show "X/5 Active" counter in header                                                                                     │
     │ - Show "MAX" instead of cost when at max level                                                                            │
     │ - Show all 3 level effects in tooltip so player can see the full progression                                              │
     │ - Disable buy button at max level                                                                                         │
     │                                                                                                                           │
     │ 1E. Save data v9 migration                                                                                                │
     │                                                                                                                           │
     │ File: src/app/core/models/save-data.model.ts — add activeUpgradeIds?: string[]                                            │
     │                                                                                                                           │
     │ File: src/app/core/services/save.service.ts                                                                               │
     │                                                                                                                           │
     │ Migration v8→v9:                                                                                                          │
     │ - Clamp all upgrade levels to new maxLevel (3)                                                                            │
     │ - Set activeUpgradeIds to the first 5 upgrades that have currentLevel > 0 (or all if fewer than 5 are purchased)          │
     │                                                                                                                           │
     │ 1F. Impact on gold multiplier stack                                                                                       │
     │                                                                                                                           │
     │ Before (uncapped upgrades at L5):                                                                                         │
     │ Speed:      1 + 0.67 = 1.67× (asymptotic)                                                                                 │
     │ Efficiency: 1 + 0.67 = 1.67×                                                                                              │
     │ Combined:   2.79× from upgrades alone                                                                                     │
     │                                                                                                                           │
     │ After (capped at L3, 5 active slots):                                                                                     │
     │ Speed L3:      1 + 1.50 = 2.50× (if active)                                                                               │
     │ Efficiency L3: 1 + 1.50 = 2.50×                                                                                           │
     │ Combined:      6.25× BUT uses 2 of 5 active slots                                                                         │
     │                                                                                                                           │
     │ If both active → sacrifice 2 utility upgrades (board, refresh, hire, etc.)                                                │
     │ If only one active → only 2.50× but keep more utility                                                                     │
     │                                                                                                                           │
     │ This is a BIGGER multiplier per upgrade (2.50× vs 1.67×) but forces tradeoffs via the slot constraint. More "number go up"│
     │  feeling WITH meaningful choices. Exactly like Balatro's joker system.                                                    │
     │                                                                                                                           │
     │ ---                                                                                                                       │
     │ Part 2: Quarter Target Rebalancing                                                                                        │
     │                                                                                                                           │
     │ 2A. Balatro-style target table                                                                                            │
     │                                                                                                                           │
     │ Apply Balatro's blind progression structure:                                                                              │
     │ - Within a year: Q1 (1×) → Q2 (3×) → Q3 (8×) — steep intra-year escalation                                                │
     │ - Between years: ~2.5× jump on Q1 base, gentling to ~2× by Y4+                                                            │
     │ - Boss→next small: ~1.25× (breathing room)                                                                                │
     │                                                                                                                           │
     │ File: src/app/core/models/quarter.model.ts                                                                                │
     │                                                                                                                           │
     │ Replace formula with hand-tuned lookup (Y1-Y3) + formula (Y4+):                                                           │
     │                                                                                                                           │
     │ ┌─────┬───────┬─────────────┬───────────────┬───────────────────────────┐                                                 │
     │ │ Y.Q │ Tasks │ Gold Target │ g/task needed │    Change from Current    │                                                 │
     │ ├─────┼───────┼─────────────┼───────────────┼───────────────────────────┤                                                 │
     │ │ 1.1 │ 30    │ 75          │ 2.5           │ unchanged                 │                                                 │
     │ ├─────┼───────┼─────────────┼───────────────┼───────────────────────────┤                                                 │
     │ │ 1.2 │ 40    │ 400         │ 10.0          │ unchanged                 │                                                 │
     │ ├─────┼───────┼─────────────┼───────────────┼───────────────────────────┤                                                 │
     │ │ 1.3 │ 60    │ 1,200       │ 20.0          │ unchanged                 │                                                 │
     │ ├─────┼───────┼─────────────┼───────────────┼───────────────────────────┤                                                 │
     │ │ 2.1 │ 30    │ 1,500       │ 50.0          │ was 135 → 11× increase    │                                                 │
     │ ├─────┼───────┼─────────────┼───────────────┼───────────────────────────┤                                                 │
     │ │ 2.2 │ 40    │ 4,500       │ 112.5         │ was 720 → 6.3× increase   │                                                 │
     │ ├─────┼───────┼─────────────┼───────────────┼───────────────────────────┤                                                 │
     │ │ 2.3 │ 50    │ 10,000      │ 200.0         │ was 2,160 → 4.6× increase │                                                 │
     │ ├─────┼───────┼─────────────┼───────────────┼───────────────────────────┤                                                 │
     │ │ 3.1 │ 30    │ 3,500       │ 116.7         │ was 243 → 14× increase    │                                                 │
     │ ├─────┼───────┼─────────────┼───────────────┼───────────────────────────┤                                                 │
     │ │ 3.2 │ 40    │ 10,000      │ 250.0         │ was 1,296 → 7.7× increase │                                                 │
     │ ├─────┼───────┼─────────────┼───────────────┼───────────────────────────┤                                                 │
     │ │ 3.3 │ 50    │ 25,000      │ 500.0         │ was 3,888 → 6.4× increase │                                                 │
     │ └─────┴───────┴─────────────┴───────────────┴───────────────────────────┘                                                 │
     │                                                                                                                           │
     │ Y4+ formula: Y3 base × 2.0^(year-3), tasks +5/quarter/year from Y3 base.                                                  │
     │                                                                                                                           │
     │ 2B. Validation against new upgrade system                                                                                 │
     │                                                                                                                           │
     │ Y2Q1: 1,500g in 30 tasks = 50 g/task needed                                                                               │
     │                                                                                                                           │
     │ Player at VL6-7, 4 minions, Speed+Efficiency L2 active (2 of 5 slots):                                                    │
     │ Sinister (15g) × 1.42 (VL7) × 1.75 (eff L2) × 1.12 (heists L3) = 42g/task                                                 │
     │ Diabolical (40g) × 1.42 × 1.75 × 1.12 = 112g/task                                                                         │
     │ Tier mix (50% sin, 30% diab, 20% petty): 42×0.5 + 112×0.3 + 7×0.2 = 56g avg                                               │
     │                                                                                                                           │
     │ 30 tasks × 56g = 1,680g ← PASSES at 1.12× (comfortable but not trivial)                                                   │
     │                                                                                                                           │
     │ Without efficiency upgrades active (chose utility build):                                                                 │
     │ Sinister × 1.42 × 1.2 (base minion) × 1.12 = 24g/task                                                                     │
     │ Mix: 24×0.5 + 64×0.3 + 7×0.2 = 33g avg                                                                                    │
     │                                                                                                                           │
     │ 30 × 33g = 990g ← FAILS. Must have SOME gold investment.                                                                  │
     │                                                                                                                           │
     │ This is the Balatro feeling: you need your build to work.                                                                 │
     │                                                                                                                           │
     │ Y2Q3: 10,000g in 50 tasks = 200 g/task needed                                                                             │
     │                                                                                                                           │
     │ Player at VL8-9, 5-6 minions, Speed+Efficiency L3 active:                                                                 │
     │ Diabolical (40g) × 1.56 (VL9) × 2.50 (eff L3) × 1.20 (heists L5) = 187g/task                                              │
     │ Legendary (100g) × 1.56 × 2.50 × 1.20 = 468g/task                                                                         │
     │ Mix (60% diab, 20% legend, 20% sin): 187×0.6 + 468×0.2 + 56×0.2 = 217g avg                                                │
     │                                                                                                                           │
     │ 50 × 217g = 10,850g ← PASSES at 1.09× (tight! needs good build)                                                           │
     │                                                                                                                           │
     │ Y3Q3: 25,000g in 50 tasks = 500 g/task needed                                                                             │
     │                                                                                                                           │
     │ Player at VL11-12, 6+ minions, fully optimized:                                                                           │
     │ Legendary (100g) × 1.77 (VL12) × 2.50 × 1.28 (heists L8) = 566g/task                                                      │
     │ Diabolical (40g) × 1.77 × 2.50 × 1.28 = 226g/task                                                                         │
     │ Mix (40% legend, 50% diab, 10% sin): 566×0.4 + 226×0.5 + 68×0.1 = 346g avg                                                │
     │                                                                                                                           │
     │ 50 × 346g = 17,300g ← FAILS unless heavily legendary-optimized                                                            │
     │                                                                                                                           │
     │ All-legendary: 50 × 566g = 28,300g ← PASSES at 1.13×                                                                      │
     │                                                                                                                           │
     │ Y3 requires legendary-dominant play. This is intentionally hard — the ceiling of the current game. Phase C cards would    │
     │ help extend viability.                                                                                                    │
     │                                                                                                                           │
     │ 2C. Task budget tightening rationale                                                                                      │
     │                                                                                                                           │
     │ Current budgets: Q1=30, Q2=40, Q3=60, Y2+= +10/year/quarter                                                               │
     │                                                                                                                           │
     │ New budgets: Q1=30, Q2=40, Q3=50(Y2+), fixed across years (task budget stays constant, gold targets rise)                 │
     │                                                                                                                           │
     │ Tighter Q3 budget (60→50) increases g/task pressure. Fixed budgets across years means ALL difficulty comes from gold      │
     │ target scaling, not task volume. This is simpler and matches Balatro where hand count stays fixed (4) — only score        │
     │ requirements change.                                                                                                      │
     │                                                                                                                           │
     │ 2D. Reviewer gold target scaling                                                                                          │
     │                                                                                                                           │
     │ File: src/app/core/models/reviewer.model.ts                                                                               │
     │                                                                                                                           │
     │ Change REVIEWER_GOLD_SCALE_PER_YEAR from 1.8 to 2.5 to match inter-year gold target growth.                               │
     │                                                                                                                           │
     │ Y1 Thornton: 200g in 30 tasks = 6.7 g/task (fine)                                                                         │
     │ Y2 Thornton: 500g in 30 tasks = 16.7 g/task (needs sinister+)                                                             │
     │ Y3 Thornton: 1,250g in 30 tasks = 41.7 g/task (needs diabolical)                                                          │
     │                                                                                                                           │
     │ ---                                                                                                                       │
     │ Implementation Order (Atomic)                                                                                             │
     │                                                                                                                           │
     │ Upgrade redesign (do first — affects all balance math)                                                                    │
     │                                                                                                                           │
     │ 1. Rewrite upgrade.model.ts — new Upgrade interface, upgradeCost(), upgradeEffect(), createDefaultUpgrades() with new     │
     │ values. Drop upgradeEffectAtLevel, UpgradeEffectType.                                                                     │
     │ 2. Update game-state.service.ts upgrade logic — add _activeUpgradeIds signal, update getUpgradeEffect() to check active   │
     │ status, add toggleUpgradeActive(), auto-activate on first purchase, update initializeGame() and startNewRun() to reset    │
     │ active set.                                                                                                               │
     │ 3. Update upgrade-shop.component.ts — add active toggle UI, slot counter, max level display, new effect formatting.       │
     │ 4. Save v9 migration — add activeUpgradeIds to SaveData, migration in save.service.ts (clamp levels, populate active set).│
     │ 5. Update game-container.component.ts — wire activeUpgradeIds and toggleActive to upgrade shop (both desktop drawer and   │
     │ mobile).                                                                                                                  │
     │ 6. Update upgrade model tests — upgrade.model.spec.ts for new cost/effect functions.                                      │
     │ 7. Update game-state upgrade tests — game-state.service.spec.ts for active slot logic, getUpgradeEffect gating.           │
     │ 8. Update upgrade shop Storybook — stories with active/inactive states, max level.                                        │
     │                                                                                                                           │
     │ Quarter target rebalancing                                                                                                │
     │                                                                                                                           │
     │ 9. Rewrite quarter.model.ts — hand-tuned Y1-Y3 lookup table, Y4+ formula (×2.0), fixed task budgets.                      │
     │ 10. Update reviewer.model.ts — REVIEWER_GOLD_SCALE_PER_YEAR → 2.5.                                                        │
     │ 11. Update quarter model tests — quarter.model.spec.ts with new expected values.                                          │
     │ 12. Update reviewer model tests — reviewer.model.spec.ts with new scaling.                                                │
     │ 13. Update game-state quarter tests — any Y2+ assertions.                                                                 │
     │                                                                                                                           │
     │ Design docs                                                                                                               │
     │                                                                                                                           │
     │ 14. Update docs/design/balance-audit.md — new Balatro comparison, upgrade redesign rationale, target tables.              │
     │ 15. Update docs/design/game-design.md — upgrade system description, quarter targets section.                              │
     │ 16. Update docs/design/roadmap.md — mark balance pass complete.                                                           │
     │                                                                                                                           │
     │ ---                                                                                                                       │
     │ Files Modified                                                                                                            │
     │                                                                                                                           │
     │                                                                                                                           │
     │ ┌──────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────┐│
     │ │                               File                               │                       Changes                       ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ src/app/core/models/upgrade.model.ts                             │ New interface, 3-level effects, explicit costs      ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ src/app/core/models/quarter.model.ts                             │ Hand-tuned targets, fixed budgets                   ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ src/app/core/models/reviewer.model.ts                            │ Gold scale 1.8→2.5                                  ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ src/app/core/models/save-data.model.ts                           │ Add activeUpgradeIds field                          ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ src/app/core/services/game-state.service.ts                      │ Active slots signal, toggle, gated getUpgradeEffect ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ src/app/core/services/save.service.ts                            │ v9 migration                                        ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ src/app/shared/components/upgrade-shop/upgrade-shop.component.ts │ Active toggle UI, slot counter, max level           ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ src/app/features/game/game-container.component.ts                │ Wire active upgrade signals to shop                 ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ docs/design/balance-audit.md                                     │ Full rewrite with Balatro comparison                ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ docs/design/game-design.md                                       │ Upgrade + quarter sections                          ││
     │ ├──────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤│
     │ │ docs/design/roadmap.md                                           │ Progress update                                     ││
     │ └──────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────┘│
     │                                                                                                                           │
     │                                                                                                                           │
     │                                                                      