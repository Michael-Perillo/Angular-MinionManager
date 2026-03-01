# Minion Manager — Game Design Vision

## Core Identity

- **Genre:** Roguelike Management Sim
- **Aesthetic:** Evil corporate software parody (Evil Jira)
- **Core loop:** Build automation rules from collectible logic cards, hit escalating quarterly gold targets, survive Year-End boss reviews
- **Inspirations:** Balatro (escalating blinds, named bosses, card collection/synergy), Factorio/Satisfactory (automation-as-progression), corporate software parody (Jira tickets, performance reviews, quarterly targets)

---

## Run Structure

Each run is an escalating series of **fiscal years**. Each year has 4 quarters. You play until you fail a Year-End review.

```
New Run → Year 1
  Q1: Complete 30 tasks, earn 75g net → card pack reward
  Q2: Complete 40 tasks, earn 400g net → card pack reward
  Q3: Complete 60 tasks, earn 1200g net → card pack reward
  Q4: Year-End Boss Review (named reviewer + modifiers)
→ Survive? → Year 2 (escalated targets, harder bosses)
→ ... → Eventually fail → Infamy Points → Meta-progression → New Run
```

**Play is continuous.** No pauses between quarters. The kanban board runs constantly. When the task budget for a quarter is exhausted, the quarter ends and you get your results.

**Score = years survived.** The game gets harder each year until your build can't keep up.

---

## Economy — Gold Only

### Why One Currency

Previous designs used Gold + Influence (two currencies) with notoriety as a punishment mechanic. This created too many interlocking systems that were hard to balance and hard for players to reason about. The redesign consolidates everything into **gold** — the one number that matters.

### Gold

| Earned From | Spent On |
|-------------|----------|
| Task completion (tier-scaled) | Hiring minions |
| Special Operations (+50% bonus) | Operational upgrades (10 total) |
| | Strategic upgrades (card system) |
| | Card packs |

**Core tension:** Gross gold earned from tasks must meet the quarter's gold target. Spending on upgrades/hires is free — the tension is purely about earning efficiency per task.

### No Notoriety

Notoriety has been removed entirely. No heat meter, no penalties, no decay, no cover tracks, no bribes, no notoriety upgrades.

**Where does tension come from?** The quarterly targets and boss modifiers. You don't need a punishment system when the game already has escalating demands. The pressure is: "can your build hit the number?"

### No Influence

The separate Influence currency has been removed. Card packs and strategic upgrades cost gold, competing directly with operational investments. This makes every gold decision meaningful.

---

## Quarterly Review System

### How Quarters Work

Each quarter has two parameters:
1. **Task budget** — the quarter ends after N task completions
2. **Gold target** — gross gold earned from tasks must meet this threshold

The task budget creates natural pacing without using wall-clock time. Faster minions complete more tasks per minute, but the efficiency challenge is the same: earn enough gold per task.

### Missing a Quarter

If your gold earned is below the target when the task budget runs out, you **miss** the quarter:
- No card pack reward
- One extra modifier stacks onto the Year-End boss review
- Play continues immediately into the next quarter

Missing a quarter isn't instantly fatal — but it compounds. Each miss makes the boss harder AND means fewer cards for your automation build.

### Year-End Boss Reviews

The Q4 review is a **named character** — an evil corporate manager with a personality and modifier pool. Think Balatro's named boss blinds.

**Each reviewer has:**
1. A base challenge (constraint active during the review)
2. A personality (determines what kinds of modifiers they use)
3. Extra modifiers for each missed quarterly target (0-3 stacking)

**Modifier categories:**
- **Task constraints:** Restrict what counts ("Only Sinister+ tasks", "Schemes dept locked")
- **Operational constraints:** Restrict how you work ("No new hires", "Minion speed halved", "Upgrades disabled")
- **Survival challenges:** Active threats ("Raids every 30s", "Gold drains at 5g/s", "Random minion quits")

**Review structure:** The review is a special quarter with its own task budget and gold target, played under all active modifiers. Fail = run over. Survive = next year begins.

### Example Reviewers (pool of 8-12, randomly selected each year)

| Reviewer | Title | Personality | Base Challenge |
|----------|-------|-------------|----------------|
| Margaret Thornton | VP of Compliance | Task constraints | "Only Sinister+ tasks count" |
| Viktor Grimes | Head of Internal Affairs | Operational | "No new hires during review" |
| Director Blackwell | Chief Risk Officer | Survival | "Raids every 30 seconds" |
| Patricia Hale | SVP Strategic Oversight | Mixed | "Board refresh frozen" |
| The Auditor | ??? | Extreme | "Gold drains at 5g/s" |

Each reviewer also has a pool of missed-quarter modifiers drawn from all three categories.

### Year Scaling

| Year | Target Multiplier | Boss Pool | Feel |
|------|------------------|-----------|------|
| 1 | 1.0× | 3 reviewers | Teaching year — first cards, first rules |
| 2 | 1.8× | +3 reviewers | Harder targets demand better automation |
| 3 | 3.0× | +2 reviewers | Top-tier tasks required, full optimization |
| 4+ | +1.5× per year | Full pool | Endurance — how far can your build go? |

---

## Card-Based Rule Building

### Overview

Automation rules are built by collecting and arranging **logic cards**. Cards are slotted into rule templates to define automation behavior. The card system is the heart of the game — it's what transforms a clicker into a management sim.

Cards sit **alongside operational upgrades**. Upgrades provide stat bonuses. Cards provide automation logic. Both are necessary.

### Card Types

| Type | Color | Role | Examples |
|------|-------|------|----------|
| **Trigger** | Red | When does the rule fire? | `When Idle`, `When Task Appears`, `On Completion`, `Every 10s` |
| **Condition** | Blue | What must be true? | `IF Specialty Match`, `IF Tier = Sinister`, `IF Level > X` |
| **Action** | Green | What happens? | `Assign to Work`, `Assign to Highest Tier`, `Hold`, `Reassign` |
| **Modifier** | Gold | Bonus effects | `+20% Gold`, `-15% Time`, `+25% XP`, `Double Down` |

### Card Pool (29 Cards)

**Triggers (8):** When Idle, When Task Appears, On Completion, Every 10s, On Threat Change, On Capture, On Level Up, On Special Event

**Conditions (10):** Specialty Match, Tier Check, Level Threshold, Threat Below, Threat Above, Queue Empty, Queue Full, Gold Above, Gold Below, Unit Count

**Actions (8):** Assign to Work, Assign to Highest Tier, Assign to Lowest Tier, Hold, Reassign, Bribe, Prioritize Queue, Emergency Rescue

**Modifiers (5):** Gold Rush (+20% gold), Swift Execution (-15% time), XP Surge (+25% XP), Stealth Op (-30% heat), Double Down (double all modifier effects)

### Rule Construction

A rule = Trigger + (optional Conditions) + Action + (optional Modifiers)

```
[When Idle] + [IF Specialty Match] + [Assign to Highest Tier]
= Specialists always grab the hardest available work

[On Completion] + [IF Gold Below 100] + [Assign to Lowest Tier] + [Gold Rush]
= When broke, grind safe tasks for maximum gold
```

### Rule Evaluation

- **All-match + priority claiming:** All rules evaluate every event cycle. Higher-priority rules claim units first.
- **Default rule:** Built-in `WHEN Idle → Assign to Work` (always lowest priority, cannot be removed). Game plays identically before player has any cards.
- **AND multipliers:** More conditions = triggers less often but stronger effects (1x/1.5x/2.5x/5x/8x/12x)

### Card Acquisition

**Dual system:**
1. **Quarterly rewards** — pass a quarterly target → earn a card pack. First card pack = teaching moment for the card system.
2. **Gold purchases** — buy additional card packs with gold (competing with upgrades/hires).
3. **Milestone drops** — 12 deterministic cards through natural progression, ensuring minimum viable card set.

**Key properties:**
- No opening hand — build your collection through the run
- Milestones ensure baseline — even without buying packs, milestones provide enough for basic rules
- Losing a run = lose all cards. Fresh collection each run.

### Boss + Card Interactions

Boss modifiers can target the rule system:
- "Automation rules disabled" → forces manual play during review
- "Only 1 rule slot active" → forces prioritization of your best rule
- "Modifier cards have no effect" → strips bonus effects

This creates runs where your carefully optimized automation is suddenly constrained, forcing improvisation.

---

## Strategic Upgrades (Gold)

These expand your automation capabilities:

| Upgrade | Max Lv | Effect | Costs |
|---------|--------|--------|-------|
| Rule Slots | 5 | +1 active automation rule | 25/60/120/200/350 |
| Condition Depth | 3 | +1 max AND-clause per rule | 40/100/200 |
| Logic Gates | 3 | OR (L1), NOT (L2), nested boolean (L3) | 50/125/250 |
| Pack Insight | 3 | +1 card shown per pack opening | 30/75/150 |
| Card Synergy | 3 | +10% modifier effectiveness | 35/90/180 |

These cost gold (no separate currency), competing with operational upgrades and hires. The tension: spend gold on better automation or stronger minions?

---

## Roguelike Meta-Progression

### Within a Run
- Card collection grows through milestones and quarterly rewards
- Years escalate targets and boss difficulty
- Randomized: boss reviewer selection, card pack contents, task board composition

### Between Runs (Permanent)
- **Infamy Points** — meta-currency based on run performance (years survived, gold earned)
- **Permanent unlocks:** New card types added to drop pool, new reviewer types, starting bonuses
- **Hall of Fame:** Best runs, highest years survived, most gold earned

### Per-Run Reset
Gold, upgrades, cards, minions — all reset each run. Only Infamy Points and permanent unlocks persist.

---

## What This Design Drops

| Old System | Why Dropped |
|------------|-------------|
| Notoriety (heat meter) | Too many mitigation systems (4 upgrades + bribes + cover tracks + decay). Trivializable. Quarterly targets provide tension without punishment meters. |
| Influence (second currency) | Added complexity without proportional depth. Gold-only is cleaner. |
| Cover Tracks missions | Existed to manage notoriety. No notoriety = no need. |
| Bribes | Same — notoriety management tool. |
| Raids (continuous) | Become a boss modifier instead of constant background noise. |
| Three-phase zoom-out | Dept → Division → Region was massive scope. The game is fun at department scale with cards + quarterly structure. |
| Government Suspicion | Run clock replaced by escalating quarterly targets. |
| Rival organizations | Removed with Phase 3. May revisit as Year 3+ content. |
| 4 notoriety upgrades | Lay Low, Shadow Ops, Deep Cover, Bribe Network — all removed with notoriety. |

---

## Open Design Questions

- **Raid mechanics during boss reviews** — How exactly do boss-modifier raids work? Same as old raids (capture minions) or simplified?
- **Card pack gold pricing** — How much should gold-purchased packs cost? Must compete with upgrades/hires.
- **Review task budget** — How many tasks in the Year-End review quarter?
- **Infamy Point formula** — What factors and weights?
- **Permanent unlock pool** — What's available from the first run? What do you unlock?
- **Per-second metrics UI** — Stats panel design for player communication
- **Research department passive** — Currently "reduces notoriety gain." Needs a new passive since notoriety is removed.

### Resolved Questions

| Question | Decision |
|----------|----------|
| Number of currencies | Gold only. Influence dropped. |
| Notoriety system | Removed entirely. Quarterly targets provide tension. |
| Run structure | Escalating fiscal years with quarterly targets + boss reviews. |
| Card acquisition | Quarterly rewards + gold purchases + milestone drops. |
| Phase hierarchy | Dropped. Game stays at department scale. |
| Quarter measurement | Task budget (not wall clock). Quarter ends after N tasks. |
| Gold accounting | Net income (earned minus spent). Investment vs. accumulation tension. |
| Boss modifiers | Mix of task constraints, operational constraints, and survival challenges. Named reviewers with personalities. |
| Raids | Not continuous. Boss modifier only. |
