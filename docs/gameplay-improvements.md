# Notoriety Management & Minion Stat Visibility Improvements

## Context

Two early/mid-game pain points:

1. **Notoriety climbs too fast** — bribes are expensive, cover-tracks missions are rare (12% spawn, petty/sinister only), and there's no passive decay. Players hit "hunted" status within minutes and have no sustainable way to manage heat.
2. **Minion stats feel invisible** — levels and efficiency have real mechanical effects (+2% speed, +3% efficiency per level, +25% specialty bonus) but the UI just shows raw "S:0.9 E:1.1" with no context for what that means or how it grows.

---

## Phase 1 — Notoriety Management

### 1A. Passive Notoriety Decay

Notoriety slowly decays over time at a base rate of **0.05/tick** (~3/min) when notoriety > 0 and no raid is active. This creates a natural equilibrium where moderate play stabilizes notoriety instead of it climbing relentlessly.

**Balance rationale:** A player running one petty task every ~40 seconds (+2 notoriety) would roughly break even with passive decay alone. Higher-tier tasks still accumulate faster than decay, preserving tension.

**Files:**
- `src/app/core/models/notoriety.model.ts` — add `BASE_NOTORIETY_DECAY` constant and `notorietyDecayRate()` helper
- `src/app/core/services/game-state.service.ts` — add fractional accumulator signal, apply decay in tick loop
- `src/app/shared/components/notoriety-bar/notoriety-bar.component.ts` — show decay rate indicator

### 1B. Three Notoriety Upgrades

New "Notoriety" upgrade category giving players a proactive gold investment path for heat management:

| Upgrade | Effect | Max Level | Base Cost | Scaling |
|---------|--------|-----------|-----------|---------|
| **Bribe Network** | -12% bribe cost per level | 5 | 80g | 2.0x |
| **Shadow Operations** | +5% cover-tracks spawn rate per level | 5 | 100g | 2.2x |
| **Lay Low Protocol** | +0.05 passive decay/tick per level | 5 | 120g | 2.4x |

At max Lay Low (level 5): decay = 0.05 + 0.25 = 0.30/tick = 18/min. Combined with cheaper bribes and more frequent cover-tracks missions, notoriety becomes manageable without being trivial.

**Files:**
- `src/app/core/models/upgrade.model.ts` — add `'notoriety'` to `UpgradeCategory`, add 3 upgrade definitions
- `src/app/core/services/game-state.service.ts` — apply bribe discount, cover-tracks rate, and decay upgrade
- `src/app/shared/components/notoriety-bar/notoriety-bar.component.ts` — show discounted bribe cost
- `src/app/shared/components/upgrade-shop/upgrade-shop.component.ts` — handle new category tab

### 1C. Scaled Cover-Tracks Missions

Cover-tracks missions currently cap at sinister tier (-15 notoriety). This doesn't scale to late game where legendary tasks generate +25 each. Fix: spawn cover-tracks at **all unlocked tiers** with proportional reduction:

| Tier | Notoriety Reduction | Time (vs normal) |
|------|-------------------|-------------------|
| Petty | -15 | 60% |
| Sinister | -15 | 60% |
| Diabolical | -25 | 70% |
| Legendary | -40 | 80% |

New templates:
- Diabolical: "Witness Protection Purge", "Deepfake the Evidence"
- Legendary: "Rewrite the History Books", "Memory Wipe Protocol"

**Files:**
- `src/app/core/models/notoriety.model.ts` — per-tier reduction mapping
- `src/app/core/models/task.model.ts` — add `coverTrackReduction` to Task interface
- `src/app/core/services/game-state.service.ts` — expand templates, tier-aware cover-tracks creation

---

## Phase 2 — Minion Stat Visibility

### 2A. Rank Titles & Stars

Give minion levels named ranks and visual star indicators so leveling *feels* meaningful:

| Levels | Rank | Stars | Color Accent |
|--------|------|-------|-------------|
| 1-2 | Lackey | - | default |
| 3-4 | Grunt | 1 | bronze |
| 5-6 | Agent | 2 | silver |
| 7-8 | Operative | 3 | gold |
| 9-10 | Elite | 4 | purple |
| 11+ | Mastermind | 5 | red |

Stars appear next to the level. Avatar gets a colored accent ring matching rank tier.

**Files:**
- `src/app/core/models/minion.model.ts` — add `MinionRank` type, `getMinionRank()`, `getMinionStars()`, `getMinionRankColor()`
- `src/app/shared/components/minion-card/minion-card.component.ts` — replace "Lv.X" with "Lv.X Rank" + stars + color accent

### 2B. Stat Breakdown (Expandable Card)

Replace the raw "S:0.9 E:1.1" with computed effective values. Clicking the card expands it to show the full breakdown:

```
Speed: 1.24x
  Base:        0.90
  + Level 4:   +0.06  (+2% per level)
  + Specialty:  +0.25  (Schemes match!)
  + Drills Lv2: x1.16
  = Effective:  1.24x

Efficiency: 1.38x
  Base:        1.10
  + Level 4:   +0.09  (+3% per level)
  + Specialty:  --     (no match)
  + Training Lv2: x1.16
  = Effective:  1.38x
```

This makes every investment visible — buying Speed Drills shows up immediately, leveling up grows the level bonus line, specialty matching lights up green.

**Files:**
- `src/app/shared/components/minion-card/minion-card.component.ts` — expandable state, effective stat computations, breakdown template
- `src/app/shared/components/minion-roster/minion-roster.component.ts` — pass upgrade levels and task category
- `src/app/features/game/game-container.component.ts` — supply active missions and upgrade levels

### 2C. Specialty Match Indicator on Task Cards

When a minion is assigned to a task, show the minion's name on the task card. If specialty matches, display a green **"+25% Specialty"** badge. No negative indicator for non-matches (avoid punishing feel).

Example: `"Grim working... (Schemes +25%)"` vs just `"Grim working..."`

**Files:**
- `src/app/shared/components/task-card/task-card.component.ts` — add minion name + match badge
- `src/app/shared/components/task-queue/task-queue.component.ts` — look up assigned minion, compute match
- `src/app/features/game/game-container.component.ts` — pass minions list to task queue

---

## Phase 3 — Optional Polish

### 3A. Scapegoat Mechanic

"Sacrifice Minion" button on idle minion cards. Dismisses the minion for a notoriety drop: **-20 base, -5 per level above 1**. A level 5 minion removes 40 notoriety. Requires confirmation click. Creates an interesting trade-off — is it worth losing a leveled minion to escape a notoriety death spiral?

### 3B. Level-Up Celebration

Golden glow pulse animation on the minion card when leveling up. "PROMOTED!" flash when crossing a rank threshold (e.g., Grunt -> Agent). Notification toast enhanced with rank title.

### 3C. Gold-Per-Minute Estimate

Display estimated "~X.Xg/min" on each minion card based on effective speed/efficiency and the current task tier distribution. Makes the cumulative impact of leveling tangible in one "bottom line" number.

---

## Recommended Implementation Order

1. **1A** Passive decay — standalone, highest-impact notoriety fix
2. **2A** Rank titles & stars — standalone, highest-impact visibility fix
3. **1B** Notoriety upgrades — builds on 1A's decay infrastructure
4. **2C** Specialty match indicator — small, self-contained
5. **1C** Scaled cover-tracks — important for late-game balance
6. **2B** Stat breakdown — medium effort, depends on 2A being in place
7. **3A-3C** Polish features as desired

---

## Balance Scenario: Mid-Game Player (Before vs After)

**Before (current):**
- 3 minions running sinister tasks (+5 notoriety each, ~20s completion)
- Notoriety gain: ~15/min | Passive decay: 0/min
- Bribe: -10 for ~80-120g | Cover tracks: rare, low-tier only
- **Result:** Notoriety reaches "hunted" (60+) in ~4 minutes. Raids threaten minion loss.

**After (Phase 1 complete, Lay Low Lv2, Shadow Ops Lv2):**
- Passive decay: 0.15/tick = 9/min
- Notoriety gain still 15/min, but net gain drops to 6/min
- Cover tracks at 22% spawn rate, completing ~1/min = -15/min
- **Net result:** Notoriety slowly *decreasing*. Player can sustain sinister-tier play without death spiral.
- Higher tiers still require active management (bribes, more cover ops), preserving strategic tension.
