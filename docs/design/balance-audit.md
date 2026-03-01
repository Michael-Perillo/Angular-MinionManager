# Balance Audit — Quarterly Review Redesign

> Last updated: 2026-03-01 (post redesign on `feature/phase0-foundation`)
>
> This document audits every numeric system in the game, verifying scaling coherence and documenting equilibrium points. The game has been redesigned around **gold-only economy** with **quarterly targets** and **Year-End boss reviews**. Notoriety, Influence, raids, bribes, and cover tracks have been removed.

---

## Table of Contents

1. [Gold Economy](#1-gold-economy)
2. [Quarterly Target Validation](#2-quarterly-target-validation)
3. [Minion Progression](#3-minion-progression)
4. [Villain Level Progression](#4-villain-level-progression)
5. [Department Progression](#5-department-progression)
6. [Upgrade System](#6-upgrade-system)
7. [Task Distribution & Tier Weighting](#7-task-distribution--tier-weighting)
8. [Special Operations](#8-special-operations)
9. [Cross-System Interactions](#9-cross-system-interactions)
10. [Quarterly Target Math Deep Dive](#10-quarterly-target-math-deep-dive)
11. [Known Gaps & Next Phase Prep](#11-known-gaps--next-phase-prep)

---

## 1. Gold Economy

### 1.1 Gold Sources

**Source files:** `task.model.ts` (TIER_CONFIG), `game-state.service.ts` (awardGold, completeTaskByTimer, clickTask)

Gold is awarded on task completion. The full pipeline:

```
finalGold = round(baseGold × levelBonus × efficiencyMult × heistsPassive)
```

For player-clicked tasks, `efficiencyMult` is replaced by `clickGoldBonus`:

```
clickGoldBonus = 1 + upgradeEffect('click-gold')
```

| Component | Formula | Source |
|-----------|---------|--------|
| baseGold | `TIER_CONFIG[tier].gold` | task.model.ts |
| levelBonus | `1 + (VL - 1) × 0.07` | game-state.service.ts |
| efficiencyMult | `(baseStat + (level-1)×0.03 + specialtyBonus) × (1 + efficiencyUpgrade)` | game-state.service.ts |
| heistsPassive | `1 + (heistsLevel - 1) × 0.04` | department.model.ts |
| clickGoldBonus | `1 + effectMax × (1 - 1/(1 + level × effectRate))` | upgrade.model.ts |
| specialOp | `× 1.5` if special op | game-state.service.ts |

**Base gold by tier and villain level:**

| Tier | Base | VL1 | VL5 | VL10 | VL15 | VL20 |
|------|------|-----|-----|------|------|------|
| Petty | 5g | 5 | 6 | 8 | 10 | 12 |
| Sinister | 15g | 15 | 19 | 24 | 30 | 35 |
| Diabolical | 40g | 40 | 51 | 65 | 80 | 95 |
| Legendary | 100g | 100 | 128 | 163 | 199 | 233 |

### 1.2 Gold Sinks

| Sink | Formula | Source |
|------|---------|--------|
| Hire minion | `floor(75 × 1.6^n) × (1 - hireDiscount)` | game-state.service.ts |
| Upgrades | `floor(baseCost × costScale^level)` | upgrade.model.ts |
| Card packs (Phase C) | Gold-priced, TBD | — |
| Strategic upgrades (Phase C) | Gold-priced: 25-350g | — |

**Hire cost progression:**

| Minion # | Base | With Discount L3 (45%) | With Discount L5 (56%) |
|----------|------|------------------------|------------------------|
| 1 | 75g | 41g | 33g |
| 2 | 120g | 66g | 53g |
| 3 | 192g | 106g | 85g |
| 4 | 307g | 169g | 135g |
| 5 | 491g | 270g | 216g |
| 6 | 786g | 432g | 346g |
| 7 | 1,258g | 692g | 554g |
| 8 | 2,013g | 1,107g | 886g |

### 1.3 Gold Income Projections

**Early game (VL1, 1 minion on sinister, avg stats 1.0):**

- Gold per task: 15g
- Task time: 25s / 1.0 speed = 25s
- Rate: **36 g/min**

**Mid game (VL5, 4 minions on sinister, L3 minions, Speed Drills L3):**

- Speed mult: 1.0 × (1 + 0.545) = 1.545
- Efficiency mult: ~1.09 × (1 + 0.545) = 1.68
- Gold per task: round(19 × 1.68) = 32g
- Task time: 32s / 1.545 = 20.7s → 2.9 tasks/min/minion
- Rate: 4 × 2.9 × 32 = **370 g/min**

**Late game (VL10, 6 minions, L5 specialty minions, Speed/Efficiency L5, Heists L5):**

- Speed: (1.0 + 0.08 + 0.25) × 1.667 = 2.22
- Efficiency: (1.0 + 0.12 + 0.25) × 1.667 = 2.28
- Diabolical gold: round(65 × 2.28) = 148g
- Task time: (55 × 1.63) / 2.22 = 40.3s → 1.49 tasks/min/minion
- Rate: 6 × 1.49 × 148 × 1.16 (Heists) = **1,530 g/min**

**Acceleration ratio:** ~36 → ~1,530 = **~42× from early to late game.**

### 1.4 Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Time to first minion | ~2 min | Petty clicking → 75g. Feels right. |
| Upgrade affordability | Good | L1 upgrades (30-120g) within first 10 min; L5 (300-2300g) stretch goals at mid-game. |
| Late-game sinks | Sparse pre-Phase C | Gold piles up once upgrades/hires exhausted. Card packs + strategic upgrades (Phase C) fix this. |
| Core tension | Gold targets (gross) | Quarterly gold targets measure earning efficiency. Spending doesn't count against the target. |

---

## 2. Quarterly Target Validation

### 2.1 Year 1 Targets

| Quarter | Task Budget | Gold Target | Avg Gold/Task Needed |
|---------|------------|-----------------|--------------------------|
| Q1 | 30 tasks | 75g | 2.5g/task |
| Q2 | 40 tasks | 400g | 10g/task |
| Q3 | 60 tasks | 1,200g | 20g/task |
| Q4 | Boss Review | — | Survive under modifiers |

### 2.2 Q1 Feasibility (30 tasks, 75g gold target)

**Assumptions:** Player starts with 0g, 0 minions. Mostly petty tasks with some sinister.

**Player-click income (VL1):**
- Petty: 5g/task, sinister: 15g/task
- 25 petty + 5 sinister = 125g + 75g = **200g gross**

**Key decision: hire a minion?**
- First hire costs 75g — spending doesn't affect the target
- Gold earned = **200g** ✓ (passes 75g target regardless of spending)

**Observation:** Q1 is a tutorial quarter where the target is easily reachable. The player can freely invest in their first hire without worrying about the target.

**With 1 minion hired at task ~15:**
- Minion completes ~5-8 sinister tasks in remaining budget
- Additional income: 5 × 15 = 75g
- Gross ≈ 200 + 75 = **275g**, net = 275 − 75 = **200g** ✓

### 2.3 Q2 Feasibility (40 tasks, 400g net)

**Assumptions:** 1-2 minions from Q1, VL2-3, departments reaching L3 (sinister unlocking).

**Income projection (2 minions on sinister, VL2, avg stats):**
- Gold/task: round(15 × 1.07 × 1.0) = 16g
- Plus player clicking: mixed petty/sinister
- 40 tasks × ~16g avg = **640g gross**

**Spending room:**
- Second minion hire (if not yet): 120g
- Speed Drills L1: 60g
- Click Power L1: 30g
- Total spend: ~210g
- Net: 640 − 210 = **430g** ✓ (passes 400g target)

**Tight but achievable.** Overspending on upgrades here risks missing the target. The player must be selective.

### 2.4 Q3 Feasibility (60 tasks, 1,200g net)

**Assumptions:** 3-4 minions, VL4-5, sinister/diabolical mix, some upgrades.

**Income projection (3 minions on sinister, VL5, Speed L2):**
- Speed: 1.0 × (1 + 0.39) = 1.39
- Gold/task: round(19 × 1.0 × 1.39) = 26g
- 60 tasks × 26g = **1,560g gross** (from minions alone)
- Player clicks add ~200g

**Spending:**
- 3rd-4th minion hires: 192 + 307 = 499g
- Upgrades: ~200g
- Total spend: ~700g
- Net: 1,760 − 700 = **1,060g** — tight!

**With 4 minions and better efficiency:**
- 60 tasks × 32g avg = **1,920g gross**
- Net: 1,920 − 700 = **1,220g** ✓ (barely passes)

**Q3 is the pressure point.** 3 minions + light upgrades barely passes. 4 minions + some upgrades passes comfortably. This is where the player needs to have made smart investments in Q1-Q2.

### 2.5 Year 2+ Scaling Validation

| Year | Q1 Target | Q2 Target | Q3 Target | Task Budget Growth |
|------|-----------|-----------|-----------|-------------------|
| 1 | 75g | 400g | 1,200g | 30/40/60 |
| 2 | 135g | 720g | 2,160g | 40/50/70 |
| 3 | 243g | 1,296g | 3,888g | 50/60/80 |
| 4 | 365g | 1,944g | 5,832g | 60/70/90 |

**Year 2 mid-game projection (VL7, 5 minions, Speed L3, Efficiency L3, sinister/diabolical):**
- Gold/task: ~50-80g depending on tier mix
- 70 tasks × 60g avg = 4,200g gross
- Spend on hires/upgrades: ~1,500g
- Net: ~2,700g vs 2,160g target ✓

**Year 3 demands:**
- Q3 target: 3,888g net in 80 tasks = 49g net/task needed
- Requires diabolical-dominant task mix and high-level minions
- This is where card-based automation becomes necessary to optimize routing

**Assessment:** Year scaling creates genuine difficulty ramp. Year 1 is achievable with manual play. Year 2 demands good upgrade investment. Year 3+ demands optimized automation from the card system.

---

## 3. Minion Progression

### 3.1 Minion Stats

**Source:** `minion.model.ts`, `game-state.service.ts`

**Speed formula:**
```
effectiveSpeed = (baseStat + (level-1) × 0.02 + specialtyBonus) × (1 + speedUpgrade)
taskDurationMs = round((baseTime / effectiveSpeed) × 1000)
```

**Efficiency formula:**
```
effectiveEfficiency = (baseStat + (level-1) × 0.03 + specialtyBonus) × (1 + efficiencyUpgrade)
goldMultiplier = effectiveEfficiency
```

| Parameter | Value |
|-----------|-------|
| Base stat range | 0.7–1.3 (random on hire) |
| Speed growth/level | +0.02 |
| Efficiency growth/level | +0.03 |
| Specialty bonus | +0.25 (when task matches specialty) |

**Speed progression (base 1.0 minion):**

| Level | No Specialty | + Specialty | + Speed L3 | + Speed L5 |
|-------|-------------|-------------|------------|------------|
| 1 | 1.00 | 1.25 | 1.94 | 2.08 |
| 3 | 1.04 | 1.29 | 2.00 | 2.15 |
| 5 | 1.08 | 1.33 | 2.06 | 2.22 |
| 10 | 1.18 | 1.43 | 2.22 | 2.38 |

**Observation:** Per-level stat growth is gentle (+0.02/+0.03). The real multipliers come from upgrades (×1.55 at L3, ×1.67 at L5) and specialty matching (+0.25). Individual minion leveling provides flavor and soft progression without breaking the economy.

### 3.2 Minion XP Curve

**Source:** `minion.model.ts:27` (xpForLevel)

```
xpForLevel(level) = floor(10 × (level - 1)^1.6)
```

| Level | XP Required | Sinister Tasks (8 XP) | With Fast Learner L3 (+90% → 15 XP) |
|-------|-------------|----------------------|--------------------------------------|
| 2 | 10 | 2 | 1 |
| 3 | 25 | 4 | 2 |
| 5 | 85 | 11 | 6 |
| 8 | 248 | 31 | 17 |
| 10 | 398 | 50 | 27 |

**Time to L10 on sinister (25s/task):** 50 × 25s = 1,250s = **~21 min**
**Time to L10 with Fast Learner L3:** 27 × 25s = 675s = **~11 min**

### 3.3 Rank System

| Level | Rank | Stars |
|-------|------|-------|
| 1–2 | Lackey | ★ |
| 3–4 | Grunt | ★★ |
| 5–6 | Agent | ★★★ |
| 7–8 | Operative | ★★★★ |
| 9–10 | Elite | ★★★★★ |
| 11+ | Mastermind | ★★★★★ |

### 3.4 Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Stat growth rate | Gentle | +0.02/+0.03 per level — flavor, not dominant. |
| XP curve shape | Appropriate | Exponent 1.6 gives smooth deceleration. |
| Specialty bonus | Meaningful | +0.25 = 25% on a 1.0 base. Rewards matching. |
| Time to max rank | ~20 min | Achievable in a session, not instant. |

---

## 4. Villain Level Progression

### 4.1 VL Formula

**Source:** `game-state.service.ts`

```
VL = min(20, floor(sqrt(completedCount / 5)) + 1)
```

| VL | Tasks Needed | Total | Delta |
|----|-------------|-------|-------|
| 1 | 0 | 0 | 0 |
| 2 | — | 5 | 5 |
| 3 | — | 20 | 15 |
| 5 | — | 80 | 35 |
| 7 | — | 180 | 55 |
| 10 | — | 405 | 75 |
| 15 | — | 980 | 105 |
| 20 | — | 1,805 | 185 |

### 4.2 VL and Quarterly Alignment

The quarterly task budget drives VL progression:

| Quarter | Cumulative Tasks | Expected VL | Notes |
|---------|-----------------|-------------|-------|
| Q1 end | 30 | 3 | sqrt(30/5)+1 = 3.4 → VL3 |
| Q2 end | 70 | 4 | sqrt(70/5)+1 = 4.7 → VL4 |
| Q3 end | 130 | 6 | sqrt(130/5)+1 = 6.1 → VL6 |
| Y1 end (~160) | 160 | 6-7 | sqrt(160/5)+1 = 6.7 → VL6 |
| Y2 end (~320) | 320 | 9 | sqrt(320/5)+1 = 9.0 → VL9 |
| Y3 end (~530) | 530 | 11 | sqrt(530/5)+1 = 11.3 → VL11 |

**VL pacing aligns with quarterly demands:** By Q3, VL6 means sinister tasks pay 21g (vs 15g at VL1) — a meaningful boost that helps hit the 1,200g target. By Year 2, VL9 provides +56% gold scaling — needed for 1.8× target increases.

### 4.3 Symmetric Scaling

All four task dimensions scale identically at +7%/VL:

| Dimension | VL1 | VL10 (×1.63) | VL20 (×2.33) |
|-----------|-----|-------------|-------------|
| Gold | 15g | 24g | 35g |
| Time | 25s | 41s | 58s |
| Clicks | 25 | 41 | 58 |

(Example: sinister tier)

**Effect:** Gold/min/minion stays roughly flat across VLs. Growth comes from more minions and better upgrades, not raw VL progression. This prevents runaway acceleration.

### 4.4 Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Curve shape | Good | sqrt gives decreasing returns — early VLs fast, late VLs grind. |
| Quarterly alignment | Good | VL naturally increases with task budget, boosting gold when targets demand it. |
| Symmetric scaling | Correct | Prevents gold/min inflation. |

---

## 5. Department Progression

### 5.1 Department XP Curve

**Source:** `department.model.ts`

```
deptXpForLevel(level) = floor(20 × (level - 1)^1.8)
```

| Level | XP Required | Petty Tasks (5 XP) | Sinister Tasks (12 XP) | With Dept XP L3 (+90% → 23 XP) |
|-------|-------------|--------------------|-----------------------|--------------------------------|
| 2 | 20 | 4 | 2 | 1 |
| 3 | 60 | 12 | 5 | 3 |
| 5 | 200 | 40 | 17 | 9 |
| 8 | 543 | 109 | 46 | 24 |
| 10 | 812 | 163 | 68 | 36 |

### 5.2 Tier Unlocking

| Dept Level | Tiers Available |
|------------|----------------|
| 1–2 | Petty |
| 3–4 | + Sinister |
| 5–7 | + Diabolical |
| 8+ | + Legendary |

**Time to sinister (L3):** ~5 petty tasks × 10s = **~50 seconds**. Very fast — sinister unlocks almost immediately.

**Time to legendary (L8):** ~46 sinister tasks × 25s = **~19 min** per department with 1 minion.

### 5.3 Department Passives

**Source:** `department.model.ts`

```
passiveBonus = (level - 1) × scalingPerLevel
```

| Department | Passive | Per Level Above 1 | At L5 | At L8 |
|------------|---------|-------------------|-------|-------|
| Research | TBD (needs new passive) | — | — | — |
| Schemes | Intel Network — faster board refresh | −8%/level | −32% | −56% |
| Heists | Loot Bonus — bonus gold all tasks | +4%/level | +16% | +28% |
| Mayhem | Intimidation — Special Op chance | +3%/level | +12% | +21% |

**Note:** Research passive was "reduced notoriety gain." With notoriety removed, it needs a new purpose. Proposed: "Efficiency Lab — reduced task time" (−5% per level above 1).

**Board refresh stacking (Schemes passive × Board Refresh upgrade):**

| Schemes Level | Refresh L0 | Refresh L3 | Refresh L5 |
|---------------|-----------|-----------|-----------|
| L1 | 3.00s | 1.36s | 1.00s |
| L5 | 2.04s | 0.93s | 0.68s |
| L8 | 1.32s | **0.60s** (floor) | **0.60s** (floor) |

Floor = 600ms. Reached at Schemes L8 + Refresh L3.

### 5.4 Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Sinister unlock speed | Fast (50s) | Brief teaching moment, then real game begins. |
| Legendary unlock | ~19 min | Deep investment, feels like an achievement. |
| Research passive | **Needs redesign** | Was notoriety reduction. Must be replaced. |
| Board refresh floor | 600ms | Good hard cap prevents infinite cycling. |

---

## 6. Upgrade System

### 6.1 All Upgrades — Full Reference

**Source:** `upgrade.model.ts`

**Cost formula:** `floor(baseCost × costScale^level)`

**Effect formulas by type:**

| Type | Formula |
|------|---------|
| percentage | `effectMax × (1 - 1/(1 + level × effectRate))` |
| additive | `floor(effectRate × ln(level + 1))` |
| refresh-multiplier | `1 / (1 + level × effectRate)` |

### 6.2 Operational Upgrades (10 total)

*Note: 4 notoriety upgrades (Lay Low, Shadow Ops, Deep Cover, Bribe Network) have been removed.*

| Upgrade | Base | Scale | L1 | L3 | L5 | L10 |
|---------|------|-------|-----|-----|------|------|
| Click Power | 30 | 1.8 | 30 | 97 | 315 | 3,570 |
| Golden Touch | 50 | 2.0 | 50 | 200 | 800 | 25,600 |
| Speed Drills | 60 | 1.9 | 60 | 216 | 781 | 16,036 |
| Profit Training | 60 | 1.9 | 60 | 216 | 781 | 16,036 |
| Fast Learner | 100 | 2.2 | 100 | 484 | 2,342 | 259,374 |
| Board Slots | 80 | 2.0 | 80 | 320 | 1,280 | 40,960 |
| Operations Desk | 120 | 2.5 | 120 | 750 | 4,687 | 2,288,818 |
| Board Refresh | 70 | 2.0 | 70 | 280 | 1,120 | 35,840 |
| Dept XP Boost | 90 | 2.0 | 90 | 360 | 1,440 | 46,080 |
| Hire Discount | 75 | 2.2 | 75 | 363 | 1,756 | 194,539 |

### 6.3 Upgrade Effect Tables

| Upgrade | Type | Rate | Max | L1 | L3 | L5 |
|---------|------|------|-----|-----|-----|-----|
| Click Power | additive | 4.17 | — | +3 | +5 | +7 |
| Golden Touch | percentage | 0.5 | 1.5 | +50% | +90% | +107% |
| Speed Drills | percentage | 0.4 | 1.0 | +29% | +55% | +67% |
| Profit Training | percentage | 0.4 | 1.0 | +29% | +55% | +67% |
| Fast Learner | percentage | 0.2 | 2.0 | +17% | +43% | +60% |
| Board Slots | additive | 8.37 | — | +6 | +11 | +14 |
| Operations Desk | additive | 2.79 | — | +2 | +3 | +4 |
| Board Refresh | refresh-mult | 0.4 | — | ×0.71 | ×0.45 | ×0.33 |
| Dept XP Boost | percentage | 0.5 | 1.5 | +50% | +90% | +107% |
| Hire Discount | percentage | 0.4 | 0.6 | −29% | −45% | −56% |

### 6.4 ROI Analysis (Quarterly Context)

With the quarterly gold target system (gross gold earned), upgrade purchases don't directly reduce your target progress. The ROI question is: **will this upgrade increase my gold-per-task enough to matter within the remaining task budget?**

**Best Q1 buys (30 task budget):**

1. **Click Power L1** (30g) — +3 clicks/click. Massive manual throughput. If clicking tasks, pays back in ~3 petty tasks.
2. **Speed Drills L1** (60g) — +29% minion speed. If hired a minion, pays back in ~4 tasks of increased throughput.
3. **Hire Discount L1** (75g) — Only worth it if hiring 2+ minions this run.

**Upgrades to defer:** Golden Touch L1 (50g) is only worth it for click-heavy play. Board Slots L1 (80g) has no direct gold payback — useful for throughput but doesn't increase gold per task.

**Quarter-aware spending:** The last 5-10 tasks of a quarter should be pure earning, not investing. Upgrades early in a quarter have more tasks to pay back. Late-quarter upgrades are risky.

### 6.5 Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Cost curves | Well-calibrated | L1 affordable in Q1; L5 is a stretch goal; L10 is aspirational. |
| Effect diminishing returns | Correct | Asymptotic formulas prevent any upgrade from being "solved." |
| Quarterly tension | Strong | Upgrades increase earning efficiency, helping meet gold targets in later quarters. |
| No dominant strategy | Correct | Multiple viable Q1 paths: click-focused, minion-focused, or hybrid. |

---

## 7. Task Distribution & Tier Weighting

### 7.1 Board Tier Weights

**Source:** `game-state.service.ts` (pickRandomTemplate)

```
pettyWeight    = max(10, 70 - (VL-1) × 5)
legendaryWeight = VL >= 8 ? min(25, (VL-7) × 4) : 0
diabolicalWeight = min(40, 5 + (VL-1) × 4)
sinisterWeight  = 100 - petty - diabolical - legendary
```

| VL | Petty | Sinister | Diabolical | Legendary |
|----|-------|----------|------------|-----------|
| 1 | 70% | 25% | 5% | 0% |
| 3 | 60% | 23% | 13% | 0% |
| 5 | 50% | 21% | 21% | 0% |
| 8 | 35% | 16% | 33% | 4% |
| 10 | 25% | 16% | 37% | 12% |
| 13 | 10% | 10% | 40% | 24% |
| 15+ | 10% | 5% | 40% | 25% |

### 7.2 Quarterly Tier Mix Implications

Since VL increases with cumulative tasks completed, the tier mix shifts across quarters:

| Quarter | Expected VL | Dominant Tiers | Gold/Task Range |
|---------|-------------|----------------|----------------|
| Q1 | 1-3 | Petty (60-70%), Sinister (23-25%) | 5-15g |
| Q2 | 3-4 | Petty (55-60%), Sinister (23%), Diab. (13-17%) | 5-40g |
| Q3 | 5-6 | Petty (45-50%), Sinister (21%), Diab. (21-25%) | 6-51g |
| Y2 Q3 | 8-9 | Petty (30-35%), Sinister (16%), Diab. (33-37%), Leg. (4-8%) | 8-128g |

The tier weight shift naturally supports higher quarterly targets — more lucrative tasks appear as demands increase.

### 7.3 Board Capacity

```
boardCapacity = 12 + min(8, minions × 2) + boardSlotsUpgrade
activeSlots = 3 + minions + activeSlotsUpgrade
```

| Minions | Board Capacity (base) | Active Slots (base) |
|---------|-----------------------|--------------------|
| 0 | 12 | 3 |
| 2 | 16 | 5 |
| 4 | 20 | 7 |
| 6 | 24 | 9 |

### 7.4 Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Tier weight shift | Good | Late game dominated by diabolical/legendary — ramps pressure naturally. |
| Quarterly alignment | Strong | VL progression ensures higher-gold tiers appear when targets demand it. |
| Board capacity | Generous | 20-35 missions visible. Plenty of choice for routing. |

---

## 8. Special Operations

### 8.1 Parameters

| Parameter | Value |
|-----------|-------|
| Base spawn chance | 15% per board slot |
| Mayhem passive | +3%/level above 1 |
| Gold multiplier | ×1.5 |
| Expiry | 30 seconds |

**Effective chance at Mayhem L8:** 15% + 21% = 36%. Roughly 1 in 3 board slots is a special op.

### 8.2 Quarterly Impact

Special ops are pure upside with no notoriety penalty (since notoriety is removed). The +50% gold directly helps quarterly targets.

**Example:** A sinister special op at VL5 pays 19 × 1.5 = **29g** vs 19g regular. Over a 40-task Q2, if 6-8 tasks are special ops, that's an extra ~60-80g — meaningful against a 400g target.

### 8.3 Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Risk/reward | Simplified | No notoriety trade-off anymore — special ops are pure gold bonus. |
| Attention test | Still meaningful | 30s expiry window demands attention. |
| Quarterly value | Moderate | +50% gold on lucky spawns helps but doesn't trivialize targets. |
| **Possible concern** | May be too free | Without notoriety, special ops have no downside. Consider if this is fine or if they need a new trade-off. |

---

## 9. Cross-System Interactions

### 9.1 Gold Pipeline (Full Multiplier Stack)

```
Minion completes task:
  baseGold = TIER_CONFIG[tier].gold
  × levelBonus (VL scaling)
  × minionEfficiency (stat + level + specialty + upgrade)
  × heistsPassive (dept level)
  × specialOpMultiplier (1.5 if special, else 1.0)
  = finalGold (gross — added to quarterly gross gold)

Player clicks task:
  baseGold × levelBonus × clickGoldBonus × specialOpMultiplier = finalGold
```

Note: The notoriety gold penalty has been removed. Gold income is no longer penalized.

### 9.2 Quarterly Gold Tracking

```
quarterGold = quarterGrossGoldEarned
pass = quarterGold >= quarterGoldTarget
```

Only one bucket matters for the quarterly target:
- **Gold earned** += task completion rewards

Spending (hires, upgrades, card packs) does not count against the target. This creates a clean, auditable economy focused on earning efficiency.

### 9.3 Game Phase Progression (Quarterly Context)

| Quarter | Phase | VL | Minions | Key Activity |
|---------|-------|-----|---------|-------------|
| Q1 (30 tasks) | Tutorial | 1–3 | 0–1 | Manual clicking, first hire, learn economy |
| Q2 (40 tasks) | Early | 3–4 | 1–3 | First upgrades, sinister unlocking |
| Q3 (60 tasks) | Mid | 5–6 | 3–5 | Upgrade investment, diabolical appearing |
| Y-E Review | Boss | 6–7 | 4–6 | Survive reviewer's modifiers |
| Y2 Q1 | Late-early | 7–8 | 5–6 | Card-based automation needed |
| Y2 Q3 | Late | 8–10 | 6–8 | Full optimization required |
| Y3+ | Endurance | 10+ | 7–8 | How far can your build go? |

### 9.4 Investment Decision Framework

The quarterly gold target system creates a clear decision framework:

| Decision | Gold Cost | Payback Period (tasks) | Q1 ROI | Q2+ ROI |
|----------|-----------|----------------------|--------|---------|
| Hire minion #1 | 75g | ~5 sinister tasks | Tight but positive | Strong |
| Click Power L1 | 30g | ~3 tasks (if clicking) | Strong | Moderate |
| Speed Drills L1 | 60g | ~4 tasks per minion | Needs 1+ minion | Strong |
| Profit Training L1 | 60g | ~4 tasks per minion | Needs 1+ minion | Strong |
| Hire Discount L1 | 75g | Only if hiring 2+ | Situational | Good |
| Board Slots L1 | 80g | No direct payback | Risky in Q1 | Low priority |

### 9.5 Degenerate Strategy Analysis

**Q: Can a player cheese by only doing petty tasks?**
- Petty gold: 5g/task → at VL5 = 6g. With 6 minions: ~216 g/min
- Q3 target: 1,200g net in 60 tasks = 20g/task needed
- 60 petty tasks × 6g = 360g gross — **far short of 1,200g**
- Verdict: **Not viable past Q1.** Petty-only can't hit mid-game targets. Forces tier progression.

**Q: Can a player hoard gold and never invest?**
- No hires, no upgrades = clicking only
- Q2: 40 tasks × 15g avg (clicking sinister) = 600g gross, 0 spent = **600g net** ✓ passes 400g
- Q3: 60 tasks × 15g = 900g gross — **short of 1,200g**
- Verdict: **Hoarding fails at Q3.** Investment in minions/upgrades is required to hit targets.

**Q: Can a player over-invest and miss targets?**
- Yes! Buying 3 upgrades (30+60+60=150g) + hiring (75g) = 225g spent in Q1
- If only earning ~275g gross, net = 50g — **misses 75g target**
- Verdict: **Investment timing matters.** This is the core tension working correctly.

---

## 10. Quarterly Target Math Deep Dive

### 10.1 Gold Per Task Requirements

| Year | Quarter | Budget | Target | Gold/Task Needed |
|------|---------|--------|--------|----------------|
| 1 | Q1 | 30 | 75g | 2.5g |
| 1 | Q2 | 40 | 400g | 10.0g |
| 1 | Q3 | 60 | 1,200g | 20.0g |
| 2 | Q1 | 40 | 135g | 3.4g |
| 2 | Q2 | 50 | 720g | 14.4g |
| 2 | Q3 | 70 | 2,160g | 30.9g |
| 3 | Q1 | 50 | 243g | 4.9g |
| 3 | Q2 | 60 | 1,296g | 21.6g |
| 3 | Q3 | 80 | 3,888g | 48.6g |

The "30% spend" column assumes players reinvest ~30% of gross gold — a reasonable mid-run average.

### 10.2 Tier Requirements by Year

Based on gold/task needed and available tiers:

| Year | Minimum Viable Tier Mix | Automation Demand |
|------|------------------------|-------------------|
| 1 | Petty Q1, Sinister Q2-Q3 | Manual play viable |
| 2 | Sinister dominant, some Diabolical | Basic automation helpful |
| 3 | Diabolical dominant, Legendary appearing | Automation required |
| 4+ | Diabolical/Legendary dominant | Fully optimized automation |

### 10.3 Boss Review Task Budgets (Proposed)

Year-End reviews need their own task budget and target, tuned to be achievable but challenging under the reviewer's modifiers.

| Year | Review Budget | Review Target | Notes |
|------|-------------|---------------|-------|
| 1 | 25 tasks | 300g net | Under one base modifier. Achievable with Q3-level build. |
| 2 | 30 tasks | 800g net | Under 1+ modifiers. Demands efficiency. |
| 3 | 35 tasks | 2,000g net | Under 1-4 modifiers. Heavily constrained. |

These are preliminary — actual tuning depends on modifier severity.

---

## 11. Known Gaps & Next Phase Prep

### 11.1 Gaps Acceptable for Phase A

| Gap | Impact | Fix Phase |
|-----|--------|-----------|
| Gold sinks dry up late game | Gold stockpiles after upgrades/hires | Phase C (card packs, strategic upgrades) |
| No automation rules | Player must micro-manage | Phase C (card system) |
| No loss condition | No run termination | Phase B (boss reviews) |
| No meta-progression | Each session starts fresh | Phase D (Infamy Points) |
| Research passive undefined | Department missing its ability | Phase A (redesign needed) |
| Special ops have no downside | May be too "free" without notoriety | Phase A or B (evaluate if trade-off needed) |

### 11.2 Phase B-C Integration Points

The balance supports:
- **Card pack gold pricing:** At 370g/min mid-game, a 50-100g pack is a meaningful choice against quarterly targets.
- **Strategic upgrade costs (25-350g):** Competes with hires and operational upgrades for available gold.
- **Boss modifier impact:** Reviewers that restrict tiers/departments/speed can drop gold/task significantly. This makes the review genuinely challenging.
- **Card-based automation as enabler:** Year 3+ targets demand ~50-70g net/task. Only achievable with automated tier routing and minion optimization.

### 11.3 Summary Verdict

The quarterly target system creates clean, testable tension. Year 1 targets are validated as achievable with manual play. Year 2+ demands smart investment and eventually card-based automation. The gold-only economy eliminates currency confusion. The one number that matters is gross gold earned for the quarter.

**The balance is ready for Phase A implementation (strip notoriety, add quarterly tracking).**
