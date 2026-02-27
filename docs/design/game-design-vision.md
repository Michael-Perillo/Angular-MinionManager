# Minion Manager — Game Design Document (High-Level)

## Context

Minion Manager is currently a single-phase idle/clicker game with an Evil Jira kanban board aesthetic. The goal is to evolve it into a **roguelike management sim** with multi-phase scaling, card-based automation building, and an evil corporate software parody that deepens at every layer. The core identity shift: from clicker to **automation/management sim with roguelike run structure**.

---

## Core Identity

- **Genre:** Roguelike Management Sim
- **Aesthetic:** Evil corporate software parody (evolves per phase)
- **Core loop:** Build automation rules from collectible logic cards, scale your criminal empire across three phases, survive the run
- **Inspirations:** Balatro (card collection/synergy), Factorio/Satisfactory (automation-as-progression), Slay the Spire (roguelike structure), corporate software (Jira, Monday, Bloomberg — parodied)

---

## Run Structure

Each run is a full playthrough across three phases. You can fail at any phase. Winning = absorbing all rival orgs + surviving government investigation. Optional endless mode continues post-victory.

```
New Run → Phase 1 (Departments) → Phase 2 (Divisions) → Phase 3 (Regions/Rivals)
    → Absorb all rivals → Survive Government → Win → [Optional Endless]
```

Pacing: each phase should take **hours** without great optimization. Progression should feel earned — clicking can assist but automation is the real engine.

---

## Economy — Gold + Influence

The economy uses **two currencies** that scale across all three phases, plus a threat system that acts as the run clock.

### Why Two Currencies, Not Four

The original design had per-department resources (Supplies, Intel, Loot, Chaos). This doesn't scale — once you zoom out to Divisions and Regions, per-department currencies lose meaning. Instead, departments are differentiated by **passives, tier gating, specialty bonuses, and task flavor** — not separate resource types.

### Currencies

| Currency | Purpose | Earned From | Spent On |
|----------|---------|-------------|----------|
| **Gold** 🪙 | Operations & growth | Task completion (tier-scaled, existing formula) | Hiring minions, operational upgrades (per-unit stat bonuses), bribing authorities, Phase 2/3 expansion |
| **Influence** 📊 | Automation & strategy | Task completion (tier-scaled, all departments) | Card packs, strategic upgrades (rule slots, logic gates, card synergy), Phase 2/3 strategic investments |

**Gold** is your operations budget — spend it to grow. **Influence** is your strategic currency — spend it to get smarter.

The core player tension: higher-tier tasks earn more of both, but also generate more notoriety. You're always weighing growth vs. risk.

### Influence Production

Every completed task earns Influence regardless of department:

| Tier | Influence Earned |
|------|-----------------|
| Petty | 1 |
| Sinister | 3 |
| Diabolical | 5 |
| Legendary | 8 |

### How Influence Scales Across Phases

- **Phase 1:** Influence buys card packs and strategic upgrades (rule slots, logic gates). You're building your automation toolkit.
- **Phase 2:** Influence funds initiative investments and higher-tier packs (Executive packs unlock). At division scale, Influence represents organizational learning.
- **Phase 3:** Influence funds strategic operations and further strategic upgrades. At regional scale, Influence represents institutional power.

The *amount* of Influence flowing increases as you scale (more departments × more divisions × more regions), but the *costs* scale too. You're never sitting on a pile of unspendable currency.

### Card Pack Costs

Higher-tier packs give **more cards and better selection**, not different card types. All packs draw from the same universal card pool.

| Pack Type | Cost | Cards Shown | Pick | Rarity Weighting |
|-----------|------|-------------|------|-----------------|
| Standard | 15 Influence | 3 cards | Pick 1 | Mostly Common |
| Jumbo | 40 Influence | 5 cards | Pick 2 | Common + Uncommon mix |
| Premium | 75 Influence | 5 cards | Pick 2 | Uncommon+ guaranteed |
| Executive | 100 Influence (Phase 2+) | 7 cards | Pick 3 | Rare+ guaranteed |
| Rival's Stash | From defeated rivals | Rival's card collection | Pick N | — |

The Executive pack unlocks at Phase 2 as a reward for scaling, not because its cards are different.

### Per-Run Reset

Gold, Influence, and card collections **reset each run**. Upgrades reset each run. Only **Infamy Points** and permanent unlocks persist between runs.

### Threat System (Not Economy)

Threats are mechanics, not currencies — they're consequences you manage, not resources you spend.

| Threat | Scope | Mechanic |
|--------|-------|----------|
| **Notoriety** | Phase 1 tactical | Per-task gains, managed by bribes (gold cost), cover-tracks missions, Research passive. Unchanged from current implementation. |
| **Government Suspicion** | Run-wide clock | Rises based on how well you manage notoriety. Not directly purchasable away — see Government/IRS section. |

---

## Phase & Unit Hierarchy

The fractal pattern: **what you master and automate in one phase becomes a single unit in the next.**

### Phase 1 — Department Level (Evil Jira)

| Element | Description |
|---|---|
| **Your unit** | Minion (does the work) |
| **Work unit** | Task (individual job on the board) |
| **Container** | Department column (Research, Schemes, Heists, Mayhem) |
| **Board view** | Kanban board — drag minions onto task cards |
| **Threat** | Notoriety → Hero raids → Minion capture |
| **Automation** | Logic cards arranged into department rules |
| **UI parody** | Evil Jira — task board, tickets, sprints |

Player is a hands-on manager. Manually assigning minions to tasks, hiring, handling raids. As logic cards are collected and rules are built, departments begin running themselves.

A department is "automated" when the player's rules handle it without manual intervention — a player skill achievement, not a purchase.

### Phase 2 — Division Level (Evil Monday/Portfolio)

| Element | Description |
|---|---|
| **Your unit** | Division (= an entire Phase 1 board, running on its rules) |
| **Work unit** | Initiative (= a bundle/stream of related tasks assigned to a division) |
| **Container** | Region slot on the map |
| **Board view** | Portfolio dashboard — division health, output, status |
| **Threat** | Regional heat + resource scarcity across divisions |
| **Automation** | Universal logic cards applied at division level |
| **UI parody** | Evil Monday.com — roadmaps, KPIs, resource dashboards |

Player is a VP/director. Divisions are the units you move. Each division is a full Phase 1 kanban running on its own rules. You assign Initiatives to Divisions — an Initiative generates a stream of tasks that flow into the division's board. Initiatives have their own completion rewards (on top of child task rewards) that scale with initiative tier and division maturity.

Drill-down: click any Division card → see its Phase 1 kanban. Your rules are running. You can intervene, but shouldn't need to.

Division maturity columns: `Establishing → Operational → Scaling → Automated`

### Phase 3 — Regional Level / Endless (Evil War Room)

| Element | Description |
|---|---|
| **Your unit** | Region (= a collection of divisions) |
| **Work unit** | Imperative (= a strategic directive for a region, e.g. "Aggressive Expansion", "Consolidate") |
| **Container** | Empire / World map |
| **Board view** | War room — rival orgs, territory control, strategic operations |
| **Threat** | Rival organizations + Government/IRS suspicion |
| **Automation** | Universal logic cards applied at regional level |
| **UI parody** | Evil Bloomberg Terminal — competitive intel, M&A, ops |

Player is the shadow emperor. Regions are the units. Each Region contains divisions running on rules, which contain departments running on rules. Imperatives shape what kinds of initiatives a region's divisions pursue. Imperatives have their own strategic payouts (on top of child initiative rewards) that scale with imperative scope and regional power.

Rival orgs contest your regions, poach your talent, and counter your strategies. Each rival has a personality/strategy requiring different approaches.

This phase IS the endless mode — after absorbing rivals, new threats emerge, government pressure intensifies, and the complexity of managing your own empire provides infinite depth.

### Unit Mapping Summary

```
Phase 1 board    →  becomes →  Phase 2 "Division" card
Phase 2 divisions →  becomes →  Phase 3 "Region" unit

Minion does Task        (Phase 1)
Division does Initiative (Phase 2) — an Initiative = stream of Tasks
Region does Imperative   (Phase 3) — an Imperative = strategy shaping Initiatives
```

---

## Card-Based Rule Building

### Overview

Automation rules are built by collecting and arranging **logic cards**. Cards are NOT played like Balatro hands — they are **slotted into rule templates** to define automation behavior. The player builds their card collection throughout a run by hitting milestones, completing initiatives, defeating rivals, and other achievements.

Cards sit **alongside the dual upgrade system**, not replacing it. Upgrades provide stat bonuses and unlock capabilities. Cards provide the automation logic.

### Card Types

Four card types, each color-coded. All cards are **universal** — the same cards work at Phase 1 (minion/task), Phase 2 (division/initiative), and Phase 3 (region/imperative) levels.

| Type | Role | Examples |
|---|---|---|
| **Trigger** (Red) | When does the rule fire? | `When Idle`, `When Task Appears`, `On Completion`, `Every 10s`, `On Threat Change` |
| **Condition** (Blue) | What must be true? | `IF Specialty Match`, `IF Tier = Sinister`, `IF Level > X`, `IF Threat Below 30`, `IF Queue Full` |
| **Action** (Green) | What happens? | `Assign to Work`, `Assign to Highest Tier`, `Hold`, `Reassign`, `Bribe` |
| **Modifier** (Gold) | Bonus effects (direct output only) | `+20% Gold`, `-15% Time`, `+25% XP`, `Double Down` |

### Universal Cards — Same Logic, Different Context

Cards don't change between phases — the **context** changes. A card's logic is the same whether it's evaluating minions or regions:

| Card | Phase 1 (Minion/Task) | Phase 2 (Division/Initiative) | Phase 3 (Region/Imperative) |
|------|----------------------|------------------------------|----------------------------|
| `When Idle` | Minion has no assignment | Division has unused capacity | Region has idle divisions |
| `IF Specialty Match` | Minion specialty matches task category | Division focus matches initiative type | Region strength matches imperative |
| `Assign to Highest Tier` | Assigns minion to highest-tier task | Assigns division to highest-tier initiative | Assigns region to highest-tier imperative |
| `+20% Gold` | +20% gold from that task completion | +20% on initiative completion bonus | +20% on imperative strategic payout |

This is the "small simple cards composing into larger systems" principle — the same handful of cards create emergent complexity as the system they operate on scales up.

### Card Pool (29 Cards for Phase 1)

**Triggers (Red) — 8 Cards:**

| Name | Rarity | Behavior |
|------|--------|----------|
| When Idle | Common | Fires when a unit has no assignment |
| When Task Appears | Common | Fires when new work enters a queue |
| On Completion | Common | Fires when a unit finishes work |
| Every 10s | Uncommon | Fires on a timed interval |
| On Threat Change | Uncommon | Fires when notoriety crosses a threshold |
| On Capture | Uncommon | Fires when a unit is lost (captured/sabotaged) |
| On Level Up | Rare | Fires when a unit or container gains a level |
| On Special Event | Rare | Fires when a special opportunity appears |

**Conditions (Blue) — 10 Cards:**

| Name | Rarity | Checks | Why It's Interesting |
|------|--------|--------|---------------------|
| Specialty Match | Common | Unit's specialty matches work category | The foundation — stacking with others creates precision rules |
| Tier Check | Common | Work is at a specific tier (parameterized) | Route units to specific tiers — "only legendary" = high risk/reward |
| Level Threshold | Common | Unit's level ≥ X (parameterized) | "Only veterans" — prevents wasting high-level units on low-tier work |
| Threat Below | Uncommon | Notoriety/heat below X | Safety valve — "only when under the radar." Pairs dangerously with high-tier triggers |
| Threat Above | Uncommon | Notoriety/heat above X | Crisis response — "when heat is high, switch to cover ops" |
| Queue Empty | Uncommon | A container's queue has no work | Enables cross-department routing and overflow handling |
| Queue Full | Uncommon | A container's queue is at capacity | "If overloaded, redirect work" — efficiency optimization |
| Gold Above | Rare | Gold reserves exceed threshold | Enables conditional spending rules (auto-bribe when flush) |
| Gold Below | Rare | Gold reserves below threshold | Survival mode — switch to safe/high-gold work when broke |
| Unit Count | Rare | Number of units meets threshold (parameterized: >, <, =) | "If 5+ idle minions..." — batch operations, workforce management |

**Conditions are rich because they intersect in non-obvious ways:**
- `Specialty Match` + `Tier Check (Legendary)` + `Level Threshold (≥8)` = "Only max-level specialists do legendary work" (5x multiplier, rare but devastating)
- `Threat Below (30)` + `Tier Check (Diabolical)` = "Push hard while safe" — but if notoriety spikes past 30, the rule stops and tasks pile up
- `Gold Below (100)` + `Specialty Match` = "When broke, optimize for gold" — the desperation play
- `Queue Full` + `Unit Count (idle > 2)` = "If bottlenecked with spare hands, reassign" — the efficiency optimizer

**Actions (Green) — 8 Cards:**

| Name | Rarity | Effect |
|------|--------|--------|
| Assign to Work | Common | Assign unit to available work (respects conditions as filter) |
| Assign to Highest Tier | Common | Assign unit to highest-tier available work |
| Assign to Lowest Tier | Common | Assign unit to lowest-tier available work (safe grinding) |
| Hold | Uncommon | Prevent unit from being auto-assigned (reserve for manual use) |
| Reassign | Uncommon | Move unit to a different container (parameterized) |
| Bribe | Rare | Spend gold to reduce threat (auto-bribe when conditions met) |
| Prioritize Queue | Rare | Reorder work queue (move matching work to front) |
| Emergency Rescue | Legendary | Immediately start rescue/recovery operation |

**Modifiers (Gold) — 5 Cards (Phase 1):**

| Name | Rarity | Effect | Why It's Interesting |
|------|--------|--------|---------------------|
| Gold Rush | Common | +20% gold from this rule's direct output | Worth having at every level — boosts task gold at Phase 1, initiative bonuses at Phase 2 |
| Swift Execution | Common | -15% completion time for work assigned by this rule | Faster completion = more throughput. Compounds with Gold Rush. |
| XP Surge | Uncommon | +25% XP from this rule's completions | Snowball card — faster leveling unlocks higher tiers sooner |
| Stealth Op | Uncommon | -30% notoriety/heat from this rule's completions | The counterbalance. Makes high-tier rules viable without suicidal notoriety. |
| Double Down | Legendary | All modifier effects on this rule are doubled | Gold Rush → +40%. Stealth Op → -60%. The multiplicative ceiling card. |

> **Deferred: Chain Reaction** (Rare, "when this rule fires, re-evaluate all rules"). Originally designed as a cascade/combo card, but its value proposition ("skip a tick delay between rule evaluations") becomes meaningless once the tick architecture is replaced with event-driven in Phase 0. Will be redesigned for the event system — likely as an event-amplifier or multi-fire mechanic instead.

### Modifier Scoping: Direct Output Only

**Critical design rule: modifiers only affect the rule's direct output at the level it operates — no cascading down.**

- `+20% Gold` on a Phase 1 rule → boosts gold from that individual task completion
- `+20% Gold` on a Phase 2 rule → boosts the initiative-level completion bonus, NOT every task inside the division
- `+20% Gold` on a Phase 3 rule → boosts the imperative-level strategic payout, NOT every initiative or task below it

**Why this matters:** Without this rule, players would always hoard modifiers for the highest-phase rules where they'd cascade across the most volume. Direct-output-only scoping means you want modifiers at EVERY level — Phase 1 modifiers optimize micro (high frequency, small per-hit), Phase 2 optimizes meso (medium frequency, medium per-hit), Phase 3 optimizes macro (low frequency, large per-hit).

**Design implication:** Initiatives and Imperatives need their own reward structures beyond just the sum of child tasks. An initiative has a completion bonus; an imperative has a strategic payout. Modifiers at each level boost THAT level's rewards.

### Rule Construction

A rule = Trigger + (optional Conditions) + Action + (optional Modifiers)

```
[When Idle] + [IF Specialty Match] + [Assign to Highest Tier]
= Basic automation rule

[When Idle] + [IF Specialty Match] + [AND Level > 3] + [AND Tier = Diabolical] + [Assign] + [Gold Rush] + [Stealth Op]
= Advanced rule with stacked conditions and multiple modifiers
```

### Rule Evaluation: All-Match + Priority Claiming

All rules evaluate every event cycle. Rules are player-ordered by priority (drag to reorder in the rule list).

**How it works:**
1. A game event fires (e.g., `MinionIdle`)
2. All rules with a matching trigger evaluate their conditions
3. Matching rules fire in priority order — highest priority first
4. Each rule "claims" the units it acts on. Once a minion is assigned by Rule 1, Rule 2 can't grab the same minion in that cycle.
5. Lower-priority rules get the remaining unclaimed units

**Why all-match, not first-match:** With only 1-6 active rule slots, first-match would make most rules dead weight. All-match with priority-based claiming creates "cascading assignment" — your best minions go to Rule 1's tasks, leftovers flow to Rule 2, etc.

### Default Rule: Built-In Fallback

The game ships with a **permanent default rule** that cannot be removed:

```
WHEN Idle → Assign to Work (with specialty preference)
```

This is equivalent to the current `autoAssignMinions()` behavior — idle minions grab the next queued task in their department, preferring specialty matches.

**The default rule is always lowest priority.** Player-built card rules fire first; the default catches any idle units that no card rule claimed. This means:
- Before the player has any cards: game plays exactly like today
- After building rules: card rules handle most assignments, default catches stragglers
- No minions are ever stranded because of a gap in card rule coverage

### AND Clause Multipliers

Stacking conditions is risk/reward — more conditions means the rule triggers less often, but effects are amplified when it does:

| ANDs | Multiplier | Requires |
|------|-----------|----------|
| 0 | 1x | Base |
| 1 | 1.5x | Base |
| 2 | 2.5x | Base |
| 3 | 5x | Condition Depth L1 |
| 4 | 8x | Condition Depth L2 |
| 5 | 12x | Condition Depth L3 |

Diminishing returns at the top (5x → 8x → 12x) prevents stacking cheese while still rewarding investment in the Condition Depth strategic upgrade. This creates meaningful deckbuilding decisions: consistent low-value rules vs. volatile high-value ones.

### AND/OR Condition Chaining

Base rules only support AND conditions. The **Logic Gates** strategic upgrade (purchased with Influence) unlocks structural complexity:

- **Level 1 — OR operator:** Conditions can be grouped as `(A AND B) OR (C AND D)`
- **Level 2 — NOT operator:** Conditions can be negated: `IF NOT Threat Above 60`
- **Level 3 — Nested logic:** Full boolean: `(A AND (B OR C)) AND D`

**Why this is an upgrade, not a card:** Logic operators change the rule *structure*, not the rule *content*. They're a permanent capability expansion that applies to all rules at all levels.

**Emergent complexity:** OR branching turns simple cards into complex logic:
- `(Specialty Match AND Tier = Legendary) OR (Level ≥ 8 AND Threat Below 30)` = "Send specialists to legendary work OR send veterans when it's safe"
- With Double Down modifier: the multiplier applies to the AND depth of the *longest branch*

Combined with OR conditions and multiple interacting rules, the automation can get beautifully chaotic — the Balatro-style "wait, what is my system DOING?" moments.

### Card Collection

Cards are acquired through two complementary systems:

**1. Milestone drops (guaranteed)** — Specific milestones award deterministic cards, ensuring every run has a minimum viable card set by ~hour 1:

| Milestone | Card Reward | Type |
|-----------|------------|------|
| Complete 5 tasks | When Idle | Trigger (Common) |
| Reach Villain Level 2 | Assign to Work | Action (Common) |
| First dept reaches Level 2 | Specialty Match | Condition (Common) |
| Complete 25 tasks | Gold Rush | Modifier (Common) |
| Hire 5th minion | Tier Check | Condition (Common) |
| Reach Villain Level 4 | On Completion | Trigger (Common) |
| Any dept reaches Level 4 | Assign to Highest Tier | Action (Common) |
| Complete 75 tasks | Swift Execution | Modifier (Common) |
| Reach Villain Level 6 | Every 10s | Trigger (Uncommon) |
| Any dept reaches Level 6 | Level Threshold | Condition (Common) |
| Complete 150 tasks | Stealth Op | Modifier (Uncommon) |
| Reach Villain Level 8 | On Threat Change | Trigger (Uncommon) |

12 guaranteed cards through natural progression — enough for 2-3 well-constructed rules. Common cards drop early, Uncommon later. All milestone drops are deterministic (same card every run). Packs provide the variance and strategic hunting.

**2. Influence packs (purchased)** — Spend Influence to buy card packs for strategic card hunting. All packs draw from the same universal card pool — higher-tier packs give more cards and better rarity odds, not different card types. See Economy section for pack costs.

**Key properties:**
- **No opening hand** — you start with minimal/no cards and build your collection through the run
- **Milestones ensure baseline** — even without buying packs, milestones provide enough cards to build basic rules
- **Packs enable strategy** — buying packs lets you hunt for specific card types or stack your collection for powerful combos
- **Losing a run = lose all cards.** Fresh collection each run. The roguelike variance comes from different pack pulls and milestone timing.

### Card UI — The Rolodex

Cards are stored and browsed in a **corporate rolodex** — an old-school tabbed card file. Flip through your collected logic cards, pull them out, slot them into rule templates. Fits the retro-corporate aesthetic perfectly.

---

## Government / IRS — The Run Clock

**Government Suspicion** is a run-wide meter, separate from notoriety. It creates urgency — you can't optimize forever.

### Suspicion Formula

Suspicion rises as a function of how well you manage notoriety — it's an **indirect consequence**, not a directly purchasable problem.

```
suspicion_rate_per_tick = base_rate * (1 + avg_notoriety / 100)
```

| Phase | Base Rate | At 0 Notoriety | At 50 Notoriety | At 100 Notoriety |
|-------|-----------|----------------|-----------------|------------------|
| Phase 1 | 0.01/tick | ~167 min to max | ~111 min to max | ~83 min to max |
| Phase 2 | 0.03/tick | ~56 min to max | ~37 min to max | ~28 min to max |
| Phase 3 | 0.05/tick | ~33 min to max | ~22 min to max | ~17 min to max |

### Why Indirect?

There's no "spend X to reduce suspicion" mechanic. Instead:

- **Good automation rules → low notoriety → slow suspicion rise.** The card system IS your defense against the run clock.
- **Bad rules / no rules → high notoriety → fast suspicion → run ends.** This creates the pressure to build better automation.
- Suspicion can never be stopped completely — even at 0 notoriety, it still rises at the base rate.

This means the card system has real stakes: your automation rules aren't just convenience — they're survival.

### Run Tension

If suspicion maxes out → empire gets RICO'd → **run over**.

Thematic joke: "You fought heroes, rival crime lords, and shadow organizations. But nobody beats the IRS."

The clock creates run tension: rush expansion (more gold/territory, but more notoriety = faster suspicion) vs. play careful (less notoriety = slower suspicion, but rivals consolidate and you earn less). Every run has a natural arc and time pressure.

---

## Rival Organizations (Phase 3)

- Rival orgs are revealed when the player reaches regional scale
- Each rival has a randomized personality/strategy (aggressive, defensive, espionage-focused, etc.)
- Rivals contest territories, poach minions/divisions, counter player strategies
- Defeating a rival = absorb their territory + get their card stash
- Rivals adapt — repeated strategies become less effective
- **Transition moment (2→3):** One of your divisions gets sabotaged. Investigation reveals external organization. Curtain pulls back — you're not alone. War room unlocks.

---

## Roguelike Meta-Progression

### Within a Run
- Card collection grows through milestones and drops
- Phases unlock as you scale
- Randomized: regions, passives, rival orgs, card drops, regional modifiers

### Between Runs (Permanent)
- **Infamy Points** — meta-currency based on run performance (how far, how fast, score)
- **Permanent unlocks:** New card types added to the drop pool, new region types, new rival org types, cosmetics
- **Starting bonuses:** Spend infamy for better opening conditions (more starting gold, a few starter cards, etc.)
- **Hall of Fame:** Best runs, highest scores, fastest completions

---

## Transition Moments

Each phase transition should feel like a revelation:

- **1→2:** Departments are running on your rules. You haven't touched the board in minutes. Notification: *"Operations Director promotion available. Your management skills have attracted attention."* The map zooms out. Your entire kanban becomes one card on a bigger board.

- **2→3:** Divisions humming on your automation rules. Then one goes dark — sabotaged. Investigation reveals a rival org. *"INTEL REPORT: External organization detected. They've been operating in your territories for months."* War room unlocks.

- **Post-victory:** Last rival absorbed. Message from your own organization: the government has taken notice. IRS investigation accelerates. Endless mode begins — survive and optimize against escalating institutional pressure.

---

## Existing Systems — How They Evolve

### Tick System → Event-Driven Architecture (Phase 0)

The current monolithic `tickTime()` function runs 10 sequential steps every second. This is being refactored in Phase 0 into an **event-driven architecture** before the card system builds on top.

**Current (tick-based):** Timer fires → run all 10 steps sequentially → wait 1 second → repeat.

**Target (event-driven):** Timer fires → detect state changes → emit events → subscribers react.

**Core game events:**
- `TaskCompleted` — a task finishes (triggers reward calculation, minion freeing)
- `MinionIdle` — a minion becomes available for assignment
- `ThreatChanged` — notoriety crosses a threshold (35 penalty start, 60 raid risk)
- `BoardRefreshed` — new missions appear on the board
- `MinionCaptured` — a minion is lost to a hero raid
- `LevelUp` — a minion, department, or villain level increases
- `SpecialOpSpawned` — a time-limited special operation appears

**Why this matters for the card system:** Rule triggers (When Idle, On Completion, On Threat Change, etc.) map directly to game events. In the event-driven model, a trigger card is literally an event subscription — the rule engine doesn't poll, it reacts. This is cleaner, more performant, and scales naturally to Phase 2/3 where multiple divisions/regions generate events independently.

**Migration path:** Timer still ticks at 1s, but instead of running sequential logic, it detects what changed and emits the appropriate events. Existing behavior is preserved — the refactor changes the internal architecture, not the player experience.

### Upgrade System — Dual Tracks

Upgrades split into two tracks that create meaningful spending decisions between the two currencies:

**Strategic Upgrades (Influence) — Global, Persistent:**

These apply at ALL levels across the entire run. Purchasing a strategic upgrade improves your automation capabilities everywhere.

| Upgrade | Max Lv | Effect | L1 | L2 | L3 | L4 | L5 |
|---------|--------|--------|----|----|----|----|-----|
| Rule Slots | 5 | +1 active automation rule per level | 25 | 60 | 120 | 200 | 350 |
| Condition Depth | 3 | +1 max AND-clause per rule (higher multiplier ceiling) | 40 | 100 | 200 | — | — |
| Logic Gates | 3 | Unlock OR (L1), NOT (L2), nested boolean logic (L3) | 50 | 125 | 250 | — | — |
| Pack Insight | 3 | +1 card shown per pack opening (better selection) | 30 | 75 | 150 | — | — |
| Card Synergy | 3 | Modifier effects gain +10% per level | 35 | 90 | 180 | — | — |

*Influence earns at ~15-30/min depending on tier mix. Level 1 of each upgrade is affordable in 5-10 minutes. Max levels require significant accumulation, competing with pack purchases (15/40/75/100 Influence).*

**Operational Upgrades (Gold) — Local, Per-Unit:**

These apply only to the unit they're purchased for. At Phase 1, this is your single operation. At Phase 2+, new divisions start without operational upgrades — you must invest gold to bring each one up to speed.

The existing 10 upgrades (Iron Fingers, Speed Drills, Profit Training, etc.) are all Operational. See `game-design.md` for full list.

**The complement:** Strategic upgrades make your automation smarter (cards + rules). Operational upgrades make your units stronger (stats + throughput). Both are necessary — smart automation on weak units underperforms, and strong units without automation require manual management.

### Notoriety
- Stays as Phase 1 and Phase 2 per-division/per-region threat
- At Phase 3 scale, Government Suspicion becomes the primary run-wide threat
- Notoriety still matters per-region but is managed by your automation rules, not manually

---

## Open Design Questions (For Future Sessions)

- Chain Reaction redesign — how should this card work in an event-driven architecture? (Original "re-evaluate all rules" design deferred)
- Event system design — which events exist beyond the core 7, payload shapes, subscription model
- Initiative and Imperative specifics — what do these look like concretely?
- Initiative/Imperative reward formulas — what are the completion bonuses at each level? (Required by modifier scoping design)
- Rival org AI behavior and adaptation mechanics
- Endless mode depth — what keeps escalating post-victory?
- Visual design for the rolodex, rule builder, portfolio dashboard, and war room UIs
- 3JS integration possibilities for world map / region visualization
- Balancing card power curve across a multi-hour run
- Influence production rate balancing (current proposed values are starting estimates)
- Operational upgrade scoping UX — how does the player choose which division/region to invest in?
- Mobile experience for the evolving UI phases
- Influence emoji/icon — what represents the unified strategic currency? (📊 is a placeholder)

### Resolved Questions

| Question | Decision |
|----------|----------|
| Per-department resources (Supplies/Intel/Loot/Chaos)? | **Dropped.** Consolidated to Gold + Influence. Departments differentiated by passives, not currencies. |
| Government suspicion reduction mechanics? | **Indirect only.** Suspicion rate scales with avg notoriety. No direct spend. Good automation = slow suspicion. |
| Legitimate business fronts? | **Not a mechanic.** Suspicion is managed indirectly through notoriety management. |
| Card acquisition model? | **Dual system.** Milestones give guaranteed cards + Influence buys packs. |
| Do resources reset per-run? | **Yes.** Gold, Influence, cards all reset. Only Infamy Points persist. |
| Equipment system (old Loot sink)? | **Dropped.** Cards fill the "make minions smarter" design space. |
| Policy/Doctrine vs Logic cards? | **Universal.** Same cards at all phase levels. Context changes (minion→division→region), card logic stays the same. |
| Rule slot limits? | **Base slots + Rule Slots strategic upgrade** (Influence). +1 per level, max 5 levels. |
| Modifier cascading across phases? | **Direct output only.** Modifiers boost the rule's own level output, not child levels. Prevents hoarding for highest phase. |
| Upgrade differentiation? | **Dual tracks.** Strategic (Influence) = global/persistent. Operational (Gold) = local/per-unit. |
| Rule evaluation order? | **All-match + priority claiming.** All rules evaluate every event cycle. Higher-priority rules claim units first; lower-priority rules get remainder. |
| Auto-assign coexistence? | **Built-in default rule.** Current auto-assign becomes permanent lowest-priority fallback rule (`WHEN Idle → Assign to Work`). Cannot be removed. |
| Chain Reaction (Phase 1)? | **Deferred.** "Skip a tick" value meaningless with event-driven architecture. Will be redesigned. Phase 1 ships with 29 cards. |
| Milestone → card mapping? | **12 deterministic drops.** Specific milestones give specific cards. Common early, Uncommon later. See Card Collection section. |
| Strategic upgrade Influence costs? | **Concrete escalation curve.** L1 affordable in 5-10 min, max levels compete with pack purchases. See Upgrade System table. |
| AND multiplier ceiling? | **8x at 4 ANDs, 12x at 5 ANDs.** Diminishing returns prevent stacking cheese. Requires Condition Depth upgrade. |
| Tick architecture refactoring? | **Phase 0.** Event-driven refactor happens before card system. Rule triggers = event subscriptions. |
