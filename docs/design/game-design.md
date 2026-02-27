# Minion Manager — Game Design Document

> Sections marked **[CURRENT]** describe implemented mechanics with exact values from code.
> Sections marked **[PROPOSED]** describe future designs — not yet built.
>
> **See also:** [game-design-vision.md](game-design-vision.md) for the high-level roguelike management sim vision, including multi-phase scaling, card-based automation, rival orgs, and run structure. This document covers current mechanics and near-term proposals; the vision doc covers the long-term strategic direction.

---

## Core Game Loop [CURRENT]

### Tick Cycle

The game runs on a **1-second tick** driven by `TimerService`. Each tick:

1. Decrement timers on all in-progress minion tasks
2. Complete finished tasks — award gold, XP (minion + department), notoriety
3. Expire stale Special Operations (30s timeout)
4. Refill mission board (every ~3s base, reduced by upgrades/passives)
5. Auto-assign idle minions to queued tasks (specialty-match priority)
6. Roll for hero raids (2% per tick when notoriety >= 60)
7. Check prison expirations (5-minute limit)
8. Clean up old notifications (>4s)
9. Auto-save (~every 30 ticks)

### The Satisfactory Loop

The core progression follows a "Satisfactory-style" automation escalation:

```
Click manually to complete tasks
  → Earn gold to hire minions
    → Minions automate task completion
      → Upgrade minions (speed, efficiency, XP)
        → Unlock harder tiers (more gold, more notoriety)
          → Need more minions to handle volume
            → Expand departments for passive bonuses
              → Repeat at higher scale
```

**Key tension:** Higher-tier tasks earn more gold but generate more notoriety, creating a risk/reward curve that forces the player to manage threat level alongside expansion.

### Player Actions

- **Click tasks** in the player workbench (manual completion)
- **Drag missions** from the mission board to department queues or player workbench
- **Hire minions** (pick one of two candidates)
- **Purchase upgrades** from the upgrade shop
- **Bribe authorities** to reduce notoriety
- **Defend against raids** (click-to-defend during 10s countdown)
- **Rescue captured minions** via breakout missions

---

## Resource Economy

### Gold [CURRENT]

The primary currency. Earned from completing tasks, spent on everything.

**Earning formula:**
```
finalGold = floor(
  floor(baseGold * (1 + (villainLevel - 1) * 0.10))  // +10% per villain level
  * minionEfficiencyMultiplier                         // minion stat bonus
  * (1 + (heistsLevel - 1) * 0.04)                    // Heists dept passive
  * (1 - notorietyPenalty)                             // 0-30% penalty
)
```

**Base gold by tier:**

| Tier | Base Gold | Base Time (s) | Base Clicks |
|------|-----------|---------------|-------------|
| Petty | 5 | 8 | 10 |
| Sinister | 15 | 20 | 20 |
| Diabolical | 40 | 45 | 35 |
| Legendary | 100 | 75 | 50 |

Special Operations grant +50% bonus gold (1.5x multiplier).

**Spending sinks:**
- Hiring minions: `50 * 1.5^(numMinions)` base cost (reduced by Recruitment Agency upgrade)
- Upgrades: 11 upgrades with scaling costs (`baseCost * costScale^currentLevel`)
- Bribes: `20 + (notoriety * 2)` gold per 10-point notoriety reduction

### Notoriety [CURRENT]

The core tension mechanic. Rises from completing tasks, causes gold penalties and hero raids.

**Notoriety gain per task tier:**

| Tier | Base Notoriety |
|------|---------------|
| Petty | +2 |
| Sinister | +5 |
| Diabolical | +12 |
| Legendary | +25 |

**Reduction:** Research dept passive (-5% gain per level above 1), minimum 1 per task. Hard cap at 100.

**Threat levels:**

| Level | Range | Effect |
|-------|-------|--------|
| Unknown | 0–14 | No penalty |
| Suspicious | 15–34 | Warning zone |
| Wanted | 35–59 | Gold penalty starts (linear 0–30%) |
| Hunted | 60–84 | Raids active (2% per tick) |
| Infamous | 85–100 | Maximum danger |

**Gold penalty curve:** 0% below 35 notoriety, then linear from 0% to 30% at 100: `min(0.30, ((notoriety - 35) / 65) * 0.30)`

**Notoriety reduction tools:**
- Bribe: costs `20 + (notoriety * 2)` gold, removes 10 notoriety
- Cover Your Tracks missions: -15 notoriety, spawn at 12% rate when notoriety > 20
- Raid defense success: -20 notoriety

**Hero raids:** 2% chance per tick when notoriety >= 60. 10-second defense countdown. Failure captures a random minion for 5 minutes (permanent loss if not rescued).

### Supplies [CURRENT → CONSOLIDATING INTO INFLUENCE]

> **Design change:** Supplies is being consolidated into **Influence** — a unified strategic currency earned from all departments. See [game-design-vision.md](game-design-vision.md) for the full economy rationale. The per-department resource model was dropped because it doesn't scale to the multi-phase vision (Divisions/Regions).

Currently implemented as a secondary resource produced by **Research** department tasks. Accumulated but has no spending sink.

| Tier | Supplies Earned (current) |
|------|--------------------------|
| Petty | 2 |
| Sinister | 4 |
| Diabolical | 6 |
| Legendary | 10 |

### Intel [CURRENT → CONSOLIDATING INTO INFLUENCE]

> **Design change:** Same as Supplies — consolidating into Influence.

Currently implemented as a secondary resource produced by **Schemes** department tasks. Accumulated but has no spending sink.

| Tier | Intel Earned (current) |
|------|----------------------|
| Petty | 1 |
| Sinister | 2 |
| Diabolical | 3 |
| Legendary | 5 |

### Influence [PROPOSED — replaces Supplies, Intel, Loot, Chaos]

Unified strategic currency earned from completing tasks in **any** department. Spent on card packs and automation investments.

| Tier | Influence Earned |
|------|-----------------|
| Petty | 1 |
| Sinister | 3 |
| Diabolical | 5 |
| Legendary | 8 |

**Primary sink:** Card packs (Standard 15, Jumbo 40, Rare 75 Influence). See [game-design-vision.md](game-design-vision.md) for pack details.

**Why unified:** Departments are differentiated by passives, tier gating, and specialty bonuses — not by which resource they produce. A single strategic currency is simpler to balance, easier to understand, and scales naturally across Phases 2 and 3.

### ~~Loot~~ / ~~Chaos~~ [DROPPED]

> **Design change:** Loot (Heists) and Chaos (Mayhem) were never implemented and have been dropped from the design. The 4-resource-per-department model was replaced by the Gold + Influence two-currency model. Equipment (old Loot sink) is replaced by the card system. World events and intimidation actions (old Chaos sinks) may be revisited as card effects or Influence-funded actions.

---

## Automation Escalation [PROPOSED]

A structured progression from manual gameplay to empire management:

### Tier 1 — Manual (Early Game)
- Player clicks to complete tasks in their workbench
- Earn gold to hire first minion
- Learn the basic loop: accept mission → complete → earn gold → repeat

### Tier 2 — Departments (Early-Mid)
- 2–3 minions auto-working in department queues
- Player manages mission routing (drag tasks to the right department)
- Unlock all 4 departments through hiring
- Department passives begin to matter

### Tier 3 — Upgrades (Mid Game)
- Speed/efficiency upgrades accelerate minion output
- Board slots and refresh rate upgrades increase mission throughput
- Player focuses on queue optimization and specialty matching
- Department levels unlock higher-tier missions

### Tier 4 — Card-Based Automation [PROPOSED — replaces Tech Tree]

> **Design change:** The Supplies-funded tech tree has been replaced by the card-based rule building system. See [game-design-vision.md](game-design-vision.md) for full details.

- Collect **universal logic cards** (Trigger, Condition, Action, Modifier) through milestones and Influence-purchased packs
- Phase 1 card pool: **29 cards** (8 Triggers, 10 Conditions, 8 Actions, 5 Modifiers). Chain Reaction deferred pending event-driven architecture redesign.
- Arrange cards into **automation rules** (WHEN → IF → THEN templates)
- **Rule evaluation:** All-match + priority claiming. All rules evaluate every event cycle; higher-priority rules claim units first, lower-priority rules get the remainder.
- **Default rule:** Built-in `WHEN Idle → Assign to Work` (equivalent to current auto-assign). Always active, always lowest priority, cannot be removed. Game plays identically before player builds any card rules.
- Unlock **strategic upgrades** with Influence: rule slots, condition depth, Logic Gates (OR/NOT/nested boolean)
- AND-clause multipliers reward stacking conditions: 1x → 1.5x → 2.5x → 5x (base), extending to 8x and 12x with Condition Depth upgrade
- Modifier cards amplify rule output — stacking creates Balatro-style emergent power
- Modifiers only affect the rule's **direct output** at its operating level (no cascading to child levels)
- 12 deterministic milestone card drops ensure minimum viable card set by ~hour 1
- Player-authored automation replaces purchased toggles — you build the rules, not buy them

### Tier 5 — Multi-Phase Scaling [PROPOSED — replaces Empire/Prestige]

> **Design change:** Department managers and prestige system replaced by the roguelike run structure with Division/Region scaling and Infamy Points meta-progression. See [game-design-vision.md](game-design-vision.md).

- Your automated Phase 1 kanban board becomes a **Division** card at Phase 2 scale
- The **same universal cards** work at division level — card logic stays the same, context changes (minion→division)
- Divisions become **Region** units at Phase 3 — same cards again, operating on regions/imperatives
- **Operational upgrades** (Gold) are per-unit — each new division needs its own investment
- **Strategic upgrades** (Influence) are global — rule slots, logic gates apply everywhere
- **Infamy Points** (meta-currency) replace the old prestige system — earned per run, spent on permanent unlocks

---

## Department System [CURRENT + PROPOSED]

### Departments [CURRENT]

| Department | Icon | Passive | Scaling |
|------------|------|---------|---------|
| Research | 🧪 | Covert Ops — reduces notoriety gain | -5% per level above 1 |
| Schemes | 🗝️ | Intel Network — faster board refresh | -8% per level above 1 |
| Heists | 💎 | Loot Bonus — bonus gold from all tasks | +4% per level above 1 |
| Mayhem | 💥 | Intimidation — increased Special Op chance | +3% per level above 1 |

### Department XP & Leveling [CURRENT]

**Formula:** `deptXpForLevel(level) = 20 * (level - 1)^1.8`

| Level | XP to Next | Available Tiers |
|-------|-----------|-----------------|
| 1–2 | 20 | Petty |
| 3–4 | 60–120 | Petty, Sinister |
| 5–7 | 200–420 | Petty, Sinister, Diabolical |
| 8–10 | 560–900 | All tiers including Legendary |

**XP earned per task tier (base):**

| Tier | Dept XP | Modified by Dept Funding upgrade (+15%/level) |
|------|---------|-----------------------------------------------|
| Petty | 5 | Yes |
| Sinister | 12 | Yes |
| Diabolical | 25 | Yes |
| Legendary | 50 | Yes |

### Progressive Unlocking [CURRENT]

Departments use a **two-tier unlock system**:

1. **Department unlock** (Tier 1) — Hire a minion with that department's specialty. The department appears on the kanban board, mobile carousel, and mission board. Persists even if the minion is later lost.
2. **Filter unlock** (Tier 2) — Department reaches **level 2**. The mission board category filter tab changes from a 🔒 lock icon to the department's emoji icon and becomes clickable. Before level 2, the filter tab is visible but locked — nudging the player to level their departments.

This creates a mini-progression within each department: first you see missions from that department on the board, but you can't filter for them until you've invested enough to reach level 2.

### ~~Department Specialization Trees~~ [DROPPED]

> **Design change:** Per-department resource trees were dropped alongside the 4-resource model. Department differentiation comes from passives, tier gating, and specialty bonuses. Automation comes from the card-based rule system, not resource-funded trees. See [game-design-vision.md](game-design-vision.md).

---

## Minion System [CURRENT + PROPOSED]

### Hiring [CURRENT]

Pick-one-of-two choice system. `generateHiringCandidates()` creates 2 minions with random stats/specialties.

**Smart candidate generation:** If any departments are still locked, at least one candidate will have a locked department's specialty — nudging the player toward unlocking new departments.

**Cost formula:** `50 * 1.5^(numMinions)`, reduced by Recruitment Agency upgrade (-8% per level, max 5 levels = -40%).

### Stats [CURRENT]

| Stat | Base Range | Per-Level Bonus | Specialty Bonus |
|------|-----------|-----------------|-----------------|
| Speed | 0.7–1.3 | +2% per level above 1 | +25% when task matches specialty |
| Efficiency | 0.7–1.3 | +3% per level above 1 | +25% when task matches specialty |

### XP & Leveling [CURRENT]

**Formula:** `xpForLevel(level) = 10 * (level - 1)^1.6`

| Level | XP to Next |
|-------|-----------|
| 1→2 | 10 |
| 2→3 | 25 |
| 3→4 | 50 |
| 5→6 | 130 |
| 8→9 | 343 |
| 9→10 | 450 |

**XP per task tier (base):** Petty 3, Sinister 8, Diabolical 15, Legendary 25. Boosted by Fast Learner upgrade (+20%/level).

### Appearances [CURRENT]

- 25 evil names (Grim, Skulk, Mortis, Dread, Vex, Blight, etc.)
- 15 color variants (purples, blues, reds, greens, golds)
- 5 accessory types (goggles, helmet, cape, horns, none)
- 4 specialty categories matching departments

### Rank Titles [PROPOSED — from gameplay-improvements.md]

| Level | Rank | Stars |
|-------|------|-------|
| 1–2 | Lackey | 1 |
| 3–4 | Grunt | 2 |
| 5–6 | Agent | 3 |
| 7–8 | Operative | 4 |
| 9–10 | Elite | 5 |
| 11+ | Mastermind | 6 |

### Minion Traits [PROPOSED]

Randomly assigned personality traits that affect behavior:
- **Greedy** — +10% gold earned, -10% speed
- **Zealous** — +15% speed, +5% notoriety gain
- **Careful** — -20% notoriety gain, -10% efficiency
- **Lucky** — small chance of double rewards

### ~~Promotion to Manager~~ [DROPPED]

> **Design change:** Department managers are superseded by the card-based automation system. Instead of promoting a minion to auto-assign, the player builds automation rules from logic cards that handle assignment. This makes automation a player-authored skill, not a purchased toggle. See [game-design-vision.md](game-design-vision.md).

### Retirement & Legacy [PROPOSED — under review]

> **Note:** Whether retirement fits within a roguelike run (where everything resets) is an open question. May become a within-run sacrifice mechanic or be dropped entirely.

High-level minions can retire for a permanent passive bonus:
- Small permanent stat boost to all future minions in that specialty
- Unlocks the retired minion's name for a "Hall of Infamy" display
- Scales with the minion's level at retirement

---

## Mission System [CURRENT]

### Template Taxonomy

**60 mission templates** in `task-pool.ts` across 4 categories and 4 tiers:
- Each category has 5 petty, 5 sinister, 3 diabolical, 2 legendary = 15 per category
- Plus 4 inline "Cover Your Tracks" templates in `game-state.service.ts` (schemes/mayhem, petty/sinister)

### Special Mission Types [CURRENT]

**Special Operations (Legendary):**
- 15% base spawn rate (increased by Mayhem passive: +3% per level above 1)
- 30-second expiry timer
- +50% gold reward
- Appear with gold glow animation

**Cover Your Tracks:**
- 12% spawn rate when notoriety > 20
- 60% time reduction, 50% click reduction
- Zero gold reward, -15 notoriety on completion

**Breakout Operations:**
- 20% spawn rate when minions are captured
- Difficulty scales with captured minion's level
- Success frees the captured minion

### Mission Board [CURRENT]

- Base capacity: 12 slots (expandable via Expanded Intel upgrade: +3/level)
- Refresh interval: ~3 seconds base
- Reduced by Rapid Intel upgrade (-20%/level) and Schemes passive (-8%/level above 1)
- Active mission limit: 3 base (expandable via Operations Desk upgrade: +1/level)

### Proposed Mission Types [PROPOSED]

**Chain Missions:** Multi-step heists spanning 2–3 tasks across departments. Completing the chain grants a large bonus reward. Failure at any step forfeits the chain.

**Department Legendary Missions:** Unique per-department missions that unlock at department level 10. One-time completion for a major reward + permanent department buff.

**Story Missions:** Narrative-driven missions tied to the campaign arc (see narrative.md). Milestone triggers, not random spawns.

---

## Upgrade System [CURRENT + PROPOSED]

Upgrades fall into two tracks. See [game-design-vision.md](game-design-vision.md) for the full dual track rationale.

**Strategic Upgrades (Influence)** — Global, apply at all levels across the entire run:

| Upgrade | Max Lv | Currency | Effect | L1 | L2 | L3 | L4 | L5 |
|---------|--------|----------|--------|----|----|----|----|-----|
| Rule Slots | 5 | Influence | +1 active automation rule per level | 25 | 60 | 120 | 200 | 350 |
| Condition Depth | 3 | Influence | +1 max AND-clause per rule (higher multiplier ceiling) | 40 | 100 | 200 | — | — |
| Logic Gates | 3 | Influence | Unlock OR (L1), NOT (L2), nested boolean logic (L3) | 50 | 125 | 250 | — | — |
| Pack Insight | 3 | Influence | +1 card shown per pack opening | 30 | 75 | 150 | — | — |
| Card Synergy | 3 | Influence | Modifier effects gain +10% per level | 35 | 90 | 180 | — | — |

*Influence earns at ~15-30/min depending on tier mix. L1 affordable in 5-10 minutes. Max levels compete with pack purchases (15/40/75/100 Influence).*

**Operational Upgrades (Gold)** — Local, scoped to specific unit. At Phase 2+, each new division starts without operational upgrades and must be invested in separately.

### Current Operational Upgrades (10 total) [CURRENT]

**Click Power:**

| Upgrade | Max Lv | Base Cost | Scale | Effect |
|---------|--------|-----------|-------|--------|
| Iron Fingers | 10 | 30g | 1.8x | +1 click power/level |
| Golden Touch | 8 | 50g | 2.0x | +15% gold from manual tasks/level |

**Minion Training:**

| Upgrade | Max Lv | Base Cost | Scale | Effect |
|---------|--------|-----------|-------|--------|
| Speed Drills | 10 | 60g | 1.9x | +8% minion speed/level |
| Profit Training | 10 | 60g | 1.9x | +8% minion efficiency/level |
| Fast Learner | 5 | 100g | 2.2x | +20% minion XP gain/level |
| Recruitment Agency | 5 | 75g | 2.2x | -8% hire cost/level |

**War Room:**

| Upgrade | Max Lv | Base Cost | Scale | Effect |
|---------|--------|-----------|-------|--------|
| Expanded Intel | 5 | 80g | 2.0x | +3 board slots/level |
| Operations Desk | 5 | 120g | 2.5x | +1 active mission slot/level |
| Rapid Intel | 5 | 70g | 2.0x | -20% board refresh time/level |

**Department:**

| Upgrade | Max Lv | Base Cost | Scale | Effect |
|---------|--------|-----------|-------|--------|
| Department Funding | 8 | 90g | 2.0x | +15% dept XP gain/level |

**Cost formula:** `floor(baseCost * costScale^currentLevel)`

### Proposed Notoriety Upgrades [PROPOSED — from gameplay-improvements.md]

| Upgrade | Max Lv | Effect |
|---------|--------|--------|
| Bribe Network | 5 | -10% bribe cost/level |
| Shadow Operations | 5 | -3% notoriety gain from all tasks/level |
| Lay Low Protocol | 5 | Passive notoriety decay: 0.05 base + 0.05/level per tick |

### ~~Tech Tree~~ [DROPPED]

> **Design change:** The Supplies-funded tech tree has been replaced by the card-based rule building system. Auto-bribe, auto-route, and queue prioritization are now built by the player as card-based automation rules. See [game-design-vision.md](game-design-vision.md).

### ~~Equipment System~~ [DROPPED]

> **Design change:** The Loot-funded equipment system was dropped alongside the Loot resource. The card system fills the "make minions more effective" design space — Modifier cards provide bonuses like +20% Gold and -15% Time that previously would have come from equipped items.

---

## Villain Progression [CURRENT]

### Villain Level

**Formula:** `min(20, floor(sqrt(completedCount / 2.5)) + 1)`

Effects:
- +10% base gold per level (compounding)
- Unlocks villain titles
- Indirectly gates content through gold scaling

### Villain Titles [CURRENT]

| Level | Title |
|-------|-------|
| 1–2 | Petty Troublemaker |
| 3–4 | Aspiring Villain |
| 5–6 | Notorious Scoundrel |
| 7–8 | Criminal Mastermind |
| 9–10 | Arch-Villain |
| 11–14 | Dark Overlord |
| 15–20 | Supreme Evil Genius |

---

## Balancing Principles

### Notoriety as Core Tension

Notoriety is the primary balancing lever. Every gold-earning action increases risk. Players must constantly weigh:
- Push harder for gold → risk raids and gold penalties
- Play safe → slower progression
- Invest in Research passive → less notoriety but opportunity cost of leveling other departments

### Automation Should Be Authored, Not Purchased

Each automation tier should remove a manual chore but introduce a new strategic choice:
- Minions remove clicking → player chooses mission routing
- Card-based rules remove routing → player designs and refines automation logic
- Better rules reduce notoriety → slower Government Suspicion → longer runs
- Phase scaling removes micro-management → same universal cards compose into division-level and regional-level automation

### Two-Currency Tension

With Gold + Influence, the core economic tension is:
- **Gold** grows your operation (more minions, better stats, bribe your way out of trouble)
- **Influence** makes your operation smarter (better automation cards = better rules = less manual intervention)
- **Higher-tier tasks** earn more of both but generate more notoriety — the eternal risk/reward
- Every Influence spent on card packs is Influence not saved for Phase 2/3 investments

### Power Curve

- **Linear early** — clear, predictable growth to teach mechanics
- **Exponential mid** — satisfying acceleration as card synergies compound
- **Run clock pressure** — Government Suspicion prevents infinite optimization, pushing toward decisive play
