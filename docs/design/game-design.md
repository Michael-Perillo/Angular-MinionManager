# Minion Manager — Game Design (Current State)

Last updated: 2026-03-02

## Status Legend
- `Implemented`: behavior exists and is considered active in the game flow.
- `In Progress`: partially implemented or present in WIP; not yet stable/validated.
- `Planned`: accepted direction but not implemented.

## Scope
This document is the canonical design snapshot for the v1 vertical-slice target:
`scout -> route -> execute -> quarter progression -> basic automation`.

Related docs:
- `game-design-vision.md` for long-horizon direction.
- `roadmap.md` for phased implementation order and gates.
- `implementation-status.md` for drift ledger and blockers.
- `tutorial-plan.md` for first-run onboarding design.

---

## System Status Matrix

| System | Status | Notes |
|---|---|---|
| Quarterly run structure (Q1-Q4, pass/miss, review flow) | `Implemented` | Core quarter progression and year-end review loop are in place. |
| Gold-only economy | `Implemented` | Gold is the primary spend/earn currency in active flow. |
| Base x Mult gold formula | `Implemented` | Transparent integer-additive mult system replaces opaque % scaling. |
| Department mult progression (no passives) | `Implemented` | Departments provide +1 mult per level above 1. No department-specific passives. |
| Per-department tier unlocking (gold sinks) | `Implemented` | Tiers purchased per department with gold (Sinister 15g, Diabolical 80g, Legendary 300g). |
| Scouting costs budget | `Implemented` | Each scout costs 1 task budget. Scouting is instant (no click cost). |
| Card/Joker inventory and pack opening | `Implemented` | Collection, pending pack, picks, and persistence are present. |
| Joker integer mult system | `Implemented` | All jokers use integer additive mult values (+1, +2, +3). |
| Rule CRUD and default rule fallback | `Implemented` | Rules can be created/toggled/reordered; default rule remains catch-all behavior. |
| Scouting-driven mission supply | `Implemented` | Player/minion scouting is the only mission intake. Board pre-seeded at quarter start. |
| Minion role model (`worker`/`scout`) | `Implemented` | Role field exists; scouts auto-scout every 3 ticks costing 1 budget each. |
| Department unlocks via vouchers | `Implemented` | Voucher model supports unlock vouchers. |
| Routing/role actions in rule engine | `In Progress` | New rule actions/conditions are in branch work; conflict-proof execution still being validated. |
| Efficiency rewards (par system) | `Implemented` | Budget remaining at quarter end determines card pack quality. |
| First-run guided tutorial | `Planned` | Defined in `tutorial-plan.md`; runtime system not yet complete. |

---

## Core Loop

### Mission Intake
`Implemented`

Current behavior:
1. Player manually scouts from the workbench (instant, costs 1 budget).
2. Scout-role minions auto-scout every 3 ticks (each costs 1 budget).
3. Board pre-seeded with 6 tasks at quarter start.
4. No passive timed board refill.

Design intent:
- Supply is player-controlled and automatable via scout minions and rule cards.
- Scouting costs budget, creating tension: "Spend 1 budget to find better tasks, or complete what's available?"

### Routing
`Implemented` with `In Progress` extensions

Current and target behavior:
1. Missions on the board are routed to a department queue or player workbench.
2. Manual routing is always available.
3. Rule-driven routing (task-scouted triggers to dept/workbench actions) is being finalized.
4. Dismissing a task from the board is free (no budget cost).

### Execution
`Implemented`

Current behavior:
1. Player can click tasks in workbench/manual queues.
2. Worker minions execute assigned queued tasks.
3. Completion awards gold using Base x Mult formula.

### Quarter Progression
`Implemented`

Current behavior:
1. Quarter ends when task budget is exhausted (scouting also costs budget).
2. Quarter is evaluated against gross gold target.
3. Pass/fail drives rewards and year-end review pressure.
4. Efficiency rating based on remaining budget when gold target is met.

---

## Economy and Progression

### Gold Formula: Base x Mult
`Implemented`

**Base** = fixed per tier (small, easy to multiply):

| Tier | Base Gold | Clicks |
|------|-----------|--------|
| Petty | 2 | 10 |
| Sinister | 5 | 18 |
| Diabolical | 12 | 30 |
| Legendary | 30 | 45 |

**Mult** = 1 + sum of all bonuses (all integers, trivial mental math):

| Source | Bonus | Example |
|--------|-------|---------|
| Dept level (matching) | +1 per level above 1 | Dept L5 = +4 |
| Specialty match | +1 | Minion specialty = task dept |
| Special Op flag | +1 | 15% chance on scout |
| Jokers (common/uncommon) | +1 each | Max 5 equipped |
| Jokers (rare/legendary) | +2 or +3 each | |
| Boss review penalty | -1 or -2 | Integer modifier penalties |

**Example:** "Sinister Heist, Research L4, specialty match = 5 x (1+3+1) = 5 x 5 = 25g"

**Removed from gold formula:** VL scaling (was +5%/level), dept passives (were opaque %s). VL is cosmetic title only.

### Departments
`Implemented`

- Departments are the primary mult driver: +1 per level above 1.
- All departments work identically through mult — no department-specific passives.
- Two investment axes per department:
  1. **Gold → tier unlocks** (Sinister 15g, Diabolical 80g, Legendary 300g per dept)
  2. **XP → dept level** (+1 mult per level above 1)

Steepened XP curve: `floor(25 * pow(level-1, 2.0))`

| Level | XP Required | Mult Bonus |
|-------|-------------|------------|
| 2 | 25 | +1 |
| 3 | 100 | +2 |
| 4 | 225 | +3 |
| 5 | 400 | +4 |
| 6 | 625 | +5 |

### Tier Unlocking (Per-Department Gold Sinks)
`Implemented`

| Tier | Unlock Cost (per dept) | Earliest Realistic |
|------|----------------------|-------------------|
| Petty | Free | Always |
| Sinister | 15g | Y1 Q1 |
| Diabolical | 80g | Y1 Q2-Q3 |
| Legendary | 300g | Y2+ |

- Each department independently tracks unlocked tiers.
- Only unlocked tiers appear when scouting for that department's tasks.
- Scouting tier weights (within unlocked tiers): Petty 50%, Sinister 30%, Diabolical 15%, Legendary 5%.

### Scouting Budget
`Implemented`

- Each scout = 1 budget spent (player or minion).
- Scouting is instant (no click cost, no scout task object).
- Board pre-seeded with 6 tasks at quarter start.
- Board max capacity: 8 + min(4, minionCount) + voucher bonus.
- Dismissing a task from the board is free.
- Scout minions auto-scout every 3 ticks (3 seconds), each costing 1 budget.

### Minions
`Implemented`

- Minions have speed, specialty, level/xp.
- Role model includes `worker` and `scout`.
- Specialty match adds +1 to mult.
- Minion cost curve: `floor(75 * pow(1.5, minionCount) * (1 - hireDiscount))`.

### Currency
`Implemented`

- Gold drives hires, tier unlocks, vouchers, and pack purchases.
- Quarterly target tension based on gross gold earned (not spend tracking).
- Gold sinks: minion hiring, tier unlocking, voucher upgrades, card packs.

---

## Special Operations
`Implemented`

- Special Op = flag on scouted task (15% chance).
- Adds +1 to mult (shown in breakdown, consistent with integer system).
- No expiry timer — they sit on board like any task.

---

## Efficiency Rewards (Par System)
`Implemented`

When gold target is hit with budget remaining:

| Budget Remaining | Rating | Card Pack Reward |
|-----------------|--------|-----------------|
| 0-10% | Standard | 1 pick from 3 |
| 11-25% | Standard+ | 2 picks from 4 |
| 26-50% | Premium | 2 picks from 5 |
| 50%+ | Premium+ | 3 picks from 5 |

Leftover budget bonus: each unspent budget point = +1g carried to next quarter.

---

## Voucher Shop
`Implemented`

- Show 3 random upgrade vouchers per shop visit (seeded by year+quarter).
- All costs multiply by year number (Y1=x1, Y2=x2, Y3=x3).
- Available vouchers: iron-fingers, board-expansion, operations-desk, hire-discount, dept-funding, rule-mastery.
- Rapid Intel and Scout Expansion removed (scouting has no click cost).

---

## Quarter Targets
`Implemented`

| Year | Quarter | Budget | Target |
|------|---------|--------|--------|
| Y1 | Q1 | 25 | 30g |
| Y1 | Q2 | 35 | 100g |
| Y1 | Q3 | 45 | 300g |
| Y2 | Q1 | 35 | 200g |
| Y2 | Q2 | 45 | 600g |
| Y2 | Q3 | 55 | 1500g |
| Y3 | Q1 | 45 | 500g |
| Y3 | Q2 | 55 | 1200g |
| Y3 | Q3 | 65 | 3500g |
| Y4+ | | +8/yr | x2.0/yr |

---

## Joker System
`Implemented`

All jokers use integer additive mult values:

| Joker | Rarity | Effect |
|-------|--------|--------|
| Gold Rush | Common | +1 mult (all tasks) |
| Deep Pockets | Common | +1 flat gold |
| Iron Fist | Common | +2 click power |
| Quick Study | Uncommon | +1 minion XP mult |
| Heist Expert | Uncommon | +2 mult (heists only) |
| Research Grant | Uncommon | +1 dept XP mult |
| Speed Demon | Rare | +1 speed tier |
| Bargain Hunter | Rare | -3 clicks flat |
| Lucky Break | Rare | +2 mult (specialty match) |
| Overachiever | Legendary | +3 mult (specialty match) |

---

## Automation Stack

### Cards/Jokers/Packs
`Implemented`

- Owned card and joker collections are persisted.
- Pack generation and pick flows exist.
- Joker effects use integer additive mult values.
- Efficiency-based pack quality from par system.

### Rule Engine
`Implemented` with `In Progress` expansion

Implemented baseline:
- Event-driven rule evaluation and action generation.
- Default fallback rule behavior.

In-progress extensions:
- New scouting/routing triggers and conditions.
- Role-switch actions.
- Routing actions against task context.

v1 requirement:
- Rule behavior must be useful by Y1Q3 (at least 2-3 practical strong rules).

---

## Reviews and Modifiers
`Implemented`

- Q4 review/boss flow is active.
- Operational constraints include automation-disabled behavior.
- "Board Frozen" = "Intel Blackout" in scouting-first flow.
- Gold penalty modifiers use integer mult adjustments (-1, -2 from mult).

---

## UI State

| Surface | Status | v1 Direction |
|---|---|---|
| Mission board | `Implemented` | Empty-state and blackout language aligned to scouting-first supply. |
| Kanban + queues | `Implemented` | Maintain manual routing as baseline; preserve mobile parity. |
| Rule editor/drawer rules tab | `Implemented` | Keep as v1 editing surface; improve clarity and useful presets later. |
| Shop | `Implemented` | 3 random vouchers per visit, year-scaled costs, card packs. |
| Workbench scouting | `Implemented` | Instant scout button (costs 1 budget). |
| Dept tier unlock UI | `Implemented` | Tier unlock buttons in department column ("Unlock Sinister: 15g"). |
| Gold breakdown display | `Implemented` | "Base x Mult = Total" with breakdown tooltip. |
| Tutorial overlay | `Planned` | First-run guided, skippable, replayable, seeded. |

---

## v1 Vertical Slice Definition

The slice is complete when all of the following are true:
1. Player can discover missions via scouting (manual or scout-role minions), each costing 1 budget.
2. Missions can be manually or automatically routed and completed.
3. Gold formula is transparent: Base x Mult with integer additive bonuses.
4. Quarter pass/fail loop with efficiency rewards is coherent.
5. Automation fallback works when modifiers disable custom rules.
6. Build/type/tests are green per the release gate in `roadmap.md`.

---

## Out of Scope for v1

The following can proceed post-v1 unless low-risk:
1. Full menu-system overhaul.
2. Full toast visual redesign.
3. Large-scale aesthetic rewrites not required for core loop clarity.
