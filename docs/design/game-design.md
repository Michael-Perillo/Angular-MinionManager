# Minion Manager — Game Design Document

> Sections marked **[CURRENT]** describe implemented mechanics with exact values from code.
> Sections marked **[PROPOSED]** describe future designs — not yet built.
>
> **See also:** [game-design-vision.md](game-design-vision.md) for the high-level roguelike vision, including the quarterly review structure, card-based automation, and meta-progression. This document covers current mechanics and near-term proposals; the vision doc covers the long-term strategic direction.

---

## Core Game Loop [CURRENT]

### Event-Driven Architecture

The game uses an **event-driven architecture** powered by `GameEventService` (15 event types) and `GameTimerService`.

Instead of a single tick function, each game system runs on its own independent timer or event subscription:

- **Task completion** — per-task timers scheduled on assignment, awards gold/XP on completion
- **Board refresh** — dynamic interval (~3s base, reduced by upgrades/passives), fills empty mission board slots
- **Auto-assign** — debounced microtask triggered by `MinionIdle`, `TaskQueued`, `MinionHired`, and `MinionReassigned` events
- **Special Op expiry** — per-task 30s timer scheduled on spawn
- **Notification cleanup** — 1s interval, removes notifications older than 4s
- **Auto-save** — 30s interval

`GameEventService` emits typed events (`TaskCompleted`, `MinionIdle`, `BoardRefreshed`, `LevelUp`, `SpecialOpSpawned`, `TaskQueued`, `TaskAssigned`, `MinionHired`, `MinionReassigned`, `UpgradePurchased`) that any system can subscribe to. This architecture unblocks the rules engine — rule triggers are event subscriptions, not tick polling.

### The Core Progression

```
Click manually to complete tasks
  → Earn gold to hire minions
    → Minions automate task completion
      → Upgrade minions (speed, efficiency, XP)
        → Unlock harder tiers (more gold per task)
          → Need more minions to handle volume
            → Expand departments for passive bonuses
              → Hit quarterly gold targets → earn card packs
                → Build automation rules from cards
                  → Survive Year-End boss reviews
```

**Key tension:** Each quarter has a task budget and a gold target. Players must earn enough gross gold from tasks to meet the target. Spending on upgrades and hires doesn't count against the target — so the tension is purely about earning efficiency.

### Player Actions

- **Click tasks** in the player workbench (manual completion)
- **Drag missions** from the mission board to department queues or player workbench
- **Hire minions** (pick one of two candidates)
- **Purchase upgrades** from the upgrade shop
- **Monitor quarterly progress** (tasks remaining, gold earned vs target)

---

## Resource Economy

### Gold [CURRENT]

The **only** currency. Earned from completing tasks, spent on everything.

**Earning formula:**
```
finalGold = floor(
  floor(baseGold * (1 + (villainLevel - 1) * 0.07))  // +7% per villain level
  * minionEfficiencyMultiplier                         // minion stat bonus
  * (1 + (heistsLevel - 1) * 0.04)                    // Heists dept passive
)
```

**Base values by tier (all scale by +7%/villain level):**

| Tier | Base Gold | Base Time (s) | Base Clicks |
|------|-----------|---------------|-------------|
| Petty | 5 | 10 | 12 |
| Sinister | 15 | 25 | 25 |
| Diabolical | 40 | 55 | 40 |
| Legendary | 100 | 90 | 55 |

Special Operations grant +50% bonus gold (1.5x multiplier).

**Spending sinks:**
- Hiring minions: `75 * 1.6^(numMinions)` base cost (reduced by Recruitment Agency upgrade)
- Upgrades: 10 operational upgrades with scaling costs (`baseCost * costScale^currentLevel`)
- Card packs (when available — see Quarterly Rewards)
- Strategic upgrades (gold-priced, see Card System)

### Quarterly Targets [PROPOSED]

The game's run structure is built around **quarterly performance reviews**. Each quarter has:

1. **Task budget** — the quarter ends after N task completions
2. **Gold target** — gross gold earned from tasks must meet this threshold

**Gold target = total gold earned from completed tasks this quarter.** Spending on upgrades/hires does NOT count against the target. The tension is purely about earning efficiency: can your build generate enough gold per task?

**Year 1 targets:**

| Quarter | Task Budget | Gold Target | Pacing Notes |
|---------|------------|-----------------|-------------|
| Q1 | 30 tasks | 75g | Tutorial quarter. Mostly petty. First hire costs 75g. |
| Q2 | 40 tasks | 400g | Sinister unlocking. 1-2 minions on sinister. |
| Q3 | 60 tasks | 1,200g | Mid-game. VL scaling + efficiency needed. 3-4 minions. |
| Q4 | Boss Review | — | Survive the reviewer's challenge. |

**Year 2+ scaling:**
- Task budgets: +10 tasks/quarter/year
- Gold targets: ×1.8 per year

---

## Quarterly Review System [PROPOSED]

### Year-End Boss Reviews

Q4 is a **boss review** — a named corporate manager evaluates your operation under constraints.

Each reviewer has:
1. **A base challenge** (a target or survival condition active during the review)
2. **A personality** (determines modifier types)
3. **Extra modifiers** for each missed quarterly target (0-3 stacking)

**Example Reviewers:**

| Reviewer | Title | Base Challenge | Missed-Q Modifier |
|----------|-------|----------------|-------------------|
| Margaret Thornton | VP of Compliance | "Only Sinister+ tasks count" | "Schemes dept under audit (locked)" |
| Viktor Grimes | Head of Internal Affairs | "No new hires during review" | "Minion speed halved" |
| Director Blackwell | Chief Risk Officer | "Raids every 30 seconds" | "Random minion quits each raid" |
| Patricia Hale | SVP Strategic Oversight | "Board refresh frozen" | "Upgrade shop locked" |
| The Auditor | ??? | "Gold drains at 5g/s. Earn 500g net." | "Only petty tasks available" |

**Modifier categories:** Task constraints (restrict what works), Operational constraints (restrict how you work), Survival challenges (active threats during review).

### Review Mechanics

- The review is a special quarter with its own task budget and gold target, played under the reviewer's modifiers
- Miss the target → **run over**. This is the loss condition.
- Survive → next year begins with escalated targets
- Each missed Q1-Q3 target adds a modifier to the boss, stacking difficulty

### Rewards

| Event | Reward |
|-------|--------|
| Pass Q1 | Card pack (3 shown, pick 1) |
| Pass Q2 | Card pack (4 shown, pick 1) + upgrade discount |
| Pass Q3 | Card pack (5 shown, pick 2) |
| Survive Year-End | Card pack (5 shown, pick 2) + next year |
| Miss Q1/Q2/Q3 | No card pack, extra boss modifier |

---

## Department System [CURRENT]

### Departments

| Department | Icon | Passive | Scaling |
|------------|------|---------|---------|
| Research | 🧪 | Covert Ops — reduced task time | -5% per level above 1 |
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

| Tier | Dept XP | Modified by Dept Funding upgrade |
|------|---------|--------------------------------|
| Petty | 5 | Yes |
| Sinister | 12 | Yes |
| Diabolical | 25 | Yes |
| Legendary | 50 | Yes |

### Progressive Unlocking [CURRENT]

Departments use a **two-tier unlock system**:

1. **Department unlock** — Hire a minion with that department's specialty. Persists even if the minion is later lost.
2. **Filter unlock** — Department reaches **level 2**. The mission board category filter becomes clickable.

---

## Minion System [CURRENT]

### Hiring [CURRENT]

Pick-one-of-two choice system. If any departments are still locked, at least one candidate will have a locked department's specialty.

**Cost formula:** `75 * 1.6^(numMinions)`, reduced by Recruitment Agency upgrade.

### Stats [CURRENT]

| Stat | Base Range | Per-Level Bonus | Specialty Bonus |
|------|-----------|-----------------|-----------------|
| Speed | 0.7–1.3 | +2% per level above 1 | +25% when task matches specialty |
| Efficiency | 0.7–1.3 | +3% per level above 1 | +25% when task matches specialty |

### XP & Leveling [CURRENT]

**Formula:** `xpForLevel(level) = 10 * (level - 1)^1.6`

**XP per task tier (base):** Petty 3, Sinister 8, Diabolical 15, Legendary 25. Boosted by Fast Learner upgrade.

### Rank Titles [CURRENT]

| Level | Rank | Stars |
|-------|------|-------|
| 1–2 | Lackey | 1 |
| 3–4 | Grunt | 2 |
| 5–6 | Agent | 3 |
| 7–8 | Operative | 4 |
| 9–10 | Elite | 5 |
| 11+ | Mastermind | 6 |

---

## Mission System [CURRENT]

### Template Taxonomy

**60 mission templates** in `task-pool.ts` across 4 categories and 4 tiers:
- Each category has 5 petty, 5 sinister, 3 diabolical, 2 legendary = 15 per category

### Special Operations [CURRENT]

- 15% base spawn rate (increased by Mayhem passive: +3% per level above 1)
- 30-second expiry timer
- +50% gold reward
- Appear with gold glow animation

### Mission Board [CURRENT]

- Base capacity: 12 slots (expandable via Expanded Intel upgrade)
- Refresh interval: ~3 seconds base (reduced by Rapid Intel upgrade and Schemes passive)
- Active mission limit: 3 base (expandable via Operations Desk upgrade)

---

## Upgrade System [CURRENT + PROPOSED]

### Operational Upgrades (Gold) — 10 total [CURRENT]

**Click Power:**

| Upgrade | Base Cost | Scale | Effect Type |
|---------|-----------|-------|-------------|
| Iron Fingers | 30g | 1.8x | Additive: +clicks per click |
| Golden Touch | 50g | 2.0x | Percentage: +% gold from clicked tasks (max 150%) |

**Minion Training:**

| Upgrade | Base Cost | Scale | Effect Type |
|---------|-----------|-------|-------------|
| Speed Drills | 60g | 1.9x | Percentage: +% minion speed (max 100%) |
| Profit Training | 60g | 1.9x | Percentage: +% minion efficiency (max 100%) |
| Fast Learner | 100g | 2.2x | Percentage: +% minion XP (max 200%) |
| Recruitment Agency | 75g | 2.2x | Percentage: -% hire cost (max 60%) |

**War Room:**

| Upgrade | Base Cost | Scale | Effect Type |
|---------|-----------|-------|-------------|
| Expanded Intel | 80g | 2.0x | Additive: +board slots |
| Operations Desk | 120g | 2.5x | Additive: +active mission slots |
| Rapid Intel | 70g | 2.0x | Refresh multiplier: reduces board refresh interval |

**Department:**

| Upgrade | Base Cost | Scale | Effect Type |
|---------|-----------|-------|-------------|
| Department Funding | 90g | 2.0x | Percentage: +% dept XP (max 150%) |

**Cost formula:** `floor(baseCost * costScale^currentLevel)`

### Strategic Upgrades (Gold) [PROPOSED — Card System]

| Upgrade | Max Lv | Effect | Costs |
|---------|--------|--------|-------|
| Rule Slots | 5 | +1 active automation rule per level | 25/60/120/200/350 |
| Condition Depth | 3 | +1 max AND-clause per rule | 40/100/200 |
| Logic Gates | 3 | OR (L1), NOT (L2), nested boolean (L3) | 50/125/250 |
| Pack Insight | 3 | +1 card shown per pack opening | 30/75/150 |
| Card Synergy | 3 | +10% modifier effectiveness per level | 35/90/180 |

---

## Villain Progression [CURRENT]

### Villain Level

**Formula:** `min(20, floor(sqrt(completedCount / 5)) + 1)`

**Symmetric scaling:** Everything scales at +7% per villain level — gold, time, and clicks. Gold/minute per minion stays roughly flat; growth comes from more minions and upgrades, not raw VL progression.

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

## Card-Based Automation [PROPOSED]

See [game-design-vision.md](game-design-vision.md) for full details on the card system. Summary:

- **29 universal logic cards** (8 Triggers, 10 Conditions, 8 Actions, 5 Modifiers)
- Cards compose into **automation rules** (WHEN → IF → THEN)
- **Default rule:** `WHEN Idle → Assign to Work` (always active, lowest priority)
- AND-clause multipliers reward stacking conditions (1x/1.5x/2.5x/5x/8x/12x)
- Cards acquired through **quarterly rewards** (hitting targets) and **gold-purchased packs**
- 12 deterministic milestone drops ensure minimum viable card set
- Boss modifiers can interact with rules ("automation disabled", "only 1 rule slot")

---

## Balancing Principles

### Quarterly Targets as Core Tension

The quarterly review system replaces notoriety as the primary balancing lever. Every decision weighs investment against accumulation:
- Spend gold on upgrades → higher gold/task going forward (spending doesn't count against target)
- Hire more minions → expensive upfront, but more tasks completed within the budget
- Higher-tier tasks → more gold per task, but fewer total tasks possible if manually clicking

### Automation Should Be Authored, Not Purchased

Each automation tier removes a manual chore but introduces a new strategic choice:
- Minions remove clicking → player chooses mission routing
- Card-based rules remove routing → player designs automation logic
- Better rules → more efficient gold/task → easier quarterly targets → harder year-end bosses

### Power Curve

- **Linear early** — clear, predictable growth to teach mechanics (Q1-Q2 Year 1)
- **Exponential mid** — satisfying acceleration as card synergies compound (Q3+ Year 1)
- **Boss pressure** — Year-End reviews with modifiers prevent infinite optimization, pushing toward decisive play
- **Escalating targets** — Year 2+ demands better builds, creating natural roguelike difficulty ramp
