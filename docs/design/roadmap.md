# Minion Manager — Feature Roadmap

> This roadmap charts the path from the current single-phase idle game to the **roguelike management sim** described in [game-design-vision.md](game-design-vision.md). It sequences implementable phases, tracks what still needs design work, and accounts for every item from the prior roadmap.
>
> Related docs: [game-design.md](game-design.md) (current mechanics), [game-design-vision.md](game-design-vision.md) (long-term vision), [narrative.md](narrative.md), [art-direction.md](art-direction.md), [../gameplay-improvements.md](../gameplay-improvements.md), [../user-feedback.md](../user-feedback.md)

---

## Feature Pillars

| Pillar | Goal | Key Systems |
|--------|------|-------------|
| **Balance** | Sustainable core loop | Notoriety rework, scaling curves, stat visibility |
| **Economy** | Gold + Influence two-currency model | Gold for operations/growth, Influence feeds card system and Phase 2/3 investments |
| **Automation** | Player-authored rules | Universal logic cards, dual upgrade tracks (strategic + operational), AND/OR chaining, modifier scoping |
| **Scale** | Fractal phase hierarchy | Dept → Division → Region, each phase's board becomes next phase's unit |
| **Roguelike** | Run structure + meta-progression | Fail states, Government Suspicion clock, Infamy Points, card collection resets |
| **Polish** | Juice + accessibility + narrative | Sound, animations, corporate satire, milestone storytelling |

---

## Phase 0 — Foundation & Balance

**Goal:** Fix the core tension mechanic and complete the economic foundation. These are near-term improvements that apply regardless of vision and unblock everything that follows.

### Notoriety Management Rework
*Source: [gameplay-improvements.md](../gameplay-improvements.md)*

- [x] Passive notoriety decay (0.05/tick base rate)
- [x] New upgrade: **Bribe Network** (5 levels, -10% bribe cost/level, 80g base, 2.0x scale)
- [x] New upgrade: **Shadow Operations** (5 levels, -6% notoriety gain/level, 100g base, 2.2x scale)
- [x] New upgrade: **Lay Low Protocol** (5 levels, 1.5x decay multiplier/level, 120g base, 2.4x scale)
- [x] Scaled Cover Your Tracks missions (tier-scaled reduction: petty/sinister -15, diabolical -25, legendary -40)
- [x] New upgrade: **Deep Cover** (5 levels, +8% cover-tracks spawn rate/level, 90g base, 2.1x scale)

### Minion Rank Titles & Stat Visibility
*Source: [gameplay-improvements.md](../gameplay-improvements.md)*

- [x] Rank title system (Lackey → Grunt → Agent → Operative → Elite → Mastermind)
- [x] Star rating display on minion cards (1–5 stars with color-coded rank)
- [ ] Expandable stat breakdown panel on minion cards
- [ ] Specialty match indicator on task cards (show which minions get bonuses)

### Consolidate Resources → Influence
*Source: [game-design-vision.md](game-design-vision.md) — Economy*

- [x] Merge Supplies + Intel signals into single **Influence** signal in `GameStateService`
- [x] Update `Resources` interface in `resource.model.ts` → single `influence` field
- [x] Award Influence from ALL department task completions (Petty: 1, Sinister: 3, Diabolical: 5, Legendary: 8)
- [x] Update header display: replace ⚗️/🕵️ with 📊 Influence display
- [x] Save data migration: map `{ supplies, intel }` → `{ influence: supplies + intel }`
- [x] Update test factories and specs
- [ ] ~~Loot/Chaos~~ — not building these (design dropped)

### Event-Driven Architecture Refactor
*Source: [game-design-vision.md](game-design-vision.md) — Tick System*

Refactor the monolithic `tickTime()` in `GameStateService` into an event-driven architecture. This must happen before Phase 1 — rule triggers are event subscriptions, not tick polling.

- [x] Define core game events — 15 event types implemented (original 7 + `RaidStarted`, `RaidEnded`, `TaskQueued`, `TaskAssigned`, `MinionHired`, `MinionReassigned`, `UpgradePurchased`, `BreakoutCompleted`)
- [x] Create `GameEventService` event bus with typed event emitters and subscriptions
- [x] Refactor `tickTime()` → `GameTimerService` with event-driven scheduling (board refresh, task completion, raid checks, prison expiry, notoriety decay as independent timers)
- [x] Migrate existing tick steps to event handlers (auto-assign via debounced microtasks, raid checks, prison expiry, board fill, etc.)
- [x] Verify no behavioral changes — same gameplay, different internal architecture
- [x] Update unit tests to test event emission and handler behavior

### Text Readability & Accessibility
*Source: [../user-feedback.md](../user-feedback.md)*

- [ ] Audit small text sizes and low-contrast elements
- [ ] Increase minimum font size on data-dense panels
- [ ] Ensure all text meets WCAG AA contrast ratio (4.5:1)

**Dependencies:** None — this is the foundation phase.

**Deliverables:** Balanced notoriety loop, unified Influence currency, event-driven architecture, improved stat visibility, accessible text.

**Design questions:** Influence emoji/icon selection (📊 is a placeholder).

---

## Phase 1 — Card System & Rule Engine

**Goal:** Build the core new system that the entire vision depends on. Players collect logic cards and arrange them into automation rules that govern how their departments operate. This is what transforms the game from a clicker into a management sim.

*Source: [game-design-vision.md](game-design-vision.md) — Card-Based Rule Building*

### Card Data Model
- [ ] Card types: Trigger (Red), Condition (Blue), Action (Green), Modifier (Gold)
- [ ] Card attributes: id, type, name, description, rarity, parameters (no phase tier — cards are universal)
- [ ] Card rarity tiers (Common, Uncommon, Rare, Legendary)
- [ ] Phase 1 card pool: 29 universal cards (8 Triggers, 10 Conditions, 8 Actions, 5 Modifiers) — Chain Reaction deferred, see game-design-vision.md for full pool

### Rule Engine
- [ ] Rule model: Trigger + optional Conditions + Action + optional Modifiers
- [ ] Rule evaluation: **all-match + priority claiming** — all rules evaluate every event cycle; higher-priority rules claim units first, lower-priority rules get the remainder
- [ ] **Default rule:** built-in `WHEN Idle → Assign to Work` with specialty preference. Always active, always lowest priority, cannot be removed. Replaces current `autoAssignMinions()` — identical behavior, reframed as a rule.
- [ ] Priority ordering between rules (player-configurable, drag to reorder)
- [ ] AND-clause multiplier system: 0 ANDs=1x, 1=1.5x, 2=2.5x, 3=5x (base), 4=8x, 5=12x (with Condition Depth upgrade)
- [ ] Unit claiming: once a unit is claimed by a rule in a given cycle, lower-priority rules can't grab it
- [ ] Rules subscribe to game events from Phase 0's event bus — triggers are event subscriptions

### Strategic Upgrades (Influence)
- [ ] Rule Slots upgrade: +1 active rule per level (max 5) — costs: 25/60/120/200/350
- [ ] Condition Depth upgrade: +1 max AND-clause per rule (max 3 levels) — costs: 40/100/200
- [ ] Logic Gates upgrade: OR (L1), NOT (L2), nested boolean (L3) — costs: 50/125/250
- [ ] Pack Insight upgrade: +1 card shown per pack opening (max 3) — costs: 30/75/150
- [ ] Card Synergy upgrade: +10% modifier effectiveness per level (max 3) — costs: 35/90/180

### Progressive Unlocking
- [ ] First rule slot unlocks at gameplay milestone (~hour 1 of play)
- [ ] Additional rule slots via Rule Slots strategic upgrade (Influence)
- [ ] Trigger/Condition/Action types unlock progressively (start with basic, earn advanced)
- [ ] Matches the "grammar unlocking" design — players learn the system gradually

### Card Acquisition (Dual System)

**Milestone drops** — 12 deterministic cards through natural progression:

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

By ~hour 1, natural play provides enough cards for 2-3 rules. Common early, Uncommon later.

- [ ] **Milestone drop system** — check milestones on relevant events, award deterministic cards
- [ ] **Influence packs** — spend Influence to buy card packs (Standard 15, Jumbo 40, Premium 75, Executive 100 Influence)
- [ ] Pack opening UI (card reveal, pick selection)
- [ ] Collection storage — player's current card inventory
- [ ] This is the **first Influence sink** — gives the Phase 0 currency its purpose

### Rule Builder UI
- [ ] Rule template interface: WHEN [trigger] → IF [conditions] → THEN [action] + [modifiers]
- [ ] Drag/slot cards from collection into rule slots
- [ ] Active rules list with enable/disable and priority reordering
- [ ] Rule preview: show what the rule will do in plain English
- [ ] Modifier scoping indicator: show which level's output the modifier affects (direct only, no cascade)

### Rolodex UI
- [ ] Corporate rolodex aesthetic — tabbed card file for browsing collected cards
- [ ] Filter/sort by type, rarity, phase
- [ ] Card detail view with stats and flavor text

### Persistence
- [ ] Save data update: persist card collection + active rules + rule configuration
- [ ] Migration from prior save version

**Dependencies:** Phase 0 (balanced core loop + event-driven architecture make rule-building meaningful and clean).

**Deliverables:** Working card system, rule engine subscribing to game events, rule builder and rolodex UIs, progressive card collection, strategic upgrade shop.

### Open Design Questions

- **Rule builder interaction design** — Mockups needed. How does drag-to-slot work? Mobile touch experience?
- **Rolodex visual design** — Mockups needed. How does the tabbed card file look and feel?
- **Chain Reaction redesign** — How should this card work in an event-driven architecture? Original "re-evaluate all rules" design deferred.

### Resolved Design Questions

| Question | Answer |
|----------|--------|
| Card pool specifics | 29 cards for Phase 1: 8 Triggers, 10 Conditions, 8 Actions, 5 Modifiers. Chain Reaction deferred. Full pool in game-design-vision.md. |
| Rule slot limits | Base slots + Rule Slots strategic upgrade (Influence). +1 per level, 5 levels max. |
| Policy/Doctrine vs Logic cards | Universal. Same cards at all phase levels — context changes, card logic stays the same. |
| Modifier cascading | Direct output only. Modifiers boost the rule's own level output, not child levels. |
| Upgrade differentiation | Dual tracks: Strategic (Influence, global) and Operational (Gold, per-unit). |
| Rule evaluation order | All-match + priority claiming. All rules evaluate every event cycle. Higher-priority rules claim units first. |
| Auto-assign coexistence | Built-in default rule (`WHEN Idle → Assign to Work`). Always lowest priority, cannot be removed. Game plays identically before player has cards. |
| Chain Reaction (Phase 1) | Deferred. "Skip a tick" meaningless with event-driven architecture. Will be redesigned for event system. |
| Milestone → card mapping | 12 deterministic drops. Specific milestones give specific cards. Common early, Uncommon later. |
| Strategic upgrade Influence costs | Concrete escalation: Rule Slots 25/60/120/200/350, Condition Depth 40/100/200, Logic Gates 50/125/250, Pack Insight 30/75/150, Card Synergy 35/90/180. |
| AND multiplier ceiling | 8x at 4 ANDs, 12x at 5 ANDs. Diminishing returns. Requires Condition Depth upgrade. |

---

## Phase 2 — Run Structure & Roguelike Loop

**Goal:** Transform the game from a single open-ended session into a roguelike with discrete runs. Introduce the Government Suspicion clock, fail states, card packs, and meta-progression between runs.

*Source: [game-design-vision.md](game-design-vision.md) — Run Structure, Government/IRS, Roguelike Meta-Progression*

### Run State Management
- [ ] Run lifecycle: New Run → Active → Failed / Completed
- [ ] "New Run" flow — reset game state (gold, minions, departments, upgrades, cards) while keeping meta-progression
- [ ] Run summary screen on completion/failure (stats, cards collected, Infamy earned)
- [ ] Main menu / run selection screen

### Government Suspicion (Run Clock)
- [ ] Suspicion meter — separate from notoriety, run-wide
- [ ] Formula: `suspicion_rate = base_rate * (1 + avg_notoriety / 100)` — indirect, driven by notoriety management
- [ ] Base rates: Phase 1 = 0.01/tick, Phase 2 = 0.03/tick, Phase 3 = 0.05/tick
- [ ] No direct "spend to reduce" mechanic — good automation rules → low notoriety → slow suspicion
- [ ] Suspicion max → RICO'd → run over
- [ ] Suspicion UI in header or dedicated panel

### Fail States
- [ ] Phase 1 fail conditions (define what ends a run at department scale)
- [ ] Fail screen with run summary and Infamy Points earned
- [ ] Graceful failure — player sees what went wrong, learns for next run

### Card Pack System (if not already built in Phase 1)
- [ ] Pack types: Standard (3 common, pick 1), Jumbo (5 cards, pick 2), Rare (2 uncommon+, pick 1)
- [ ] Pack opening UI (card reveal animation, pick selection)
- [ ] Packs purchased with Influence (costs: 15/40/75) — established as Influence sink in Phase 1
- [ ] Executive packs (100 Influence, 7 cards, pick 3, Rare+ guaranteed) — unlock at Phase 2 as reward for scaling (same universal card pool)

### Meta-Progression
- [ ] **Infamy Points** — meta-currency earned per run (based on distance reached, gold earned, speed, cards collected)
- [ ] Permanent unlocks: new card types added to drop pool, starting bonuses, cosmetics
- [ ] Infamy shop: spend Infamy for better opening conditions (starting gold, starter cards)
- [ ] **Hall of Fame** — run history, best scores, fastest completions

### Persistence
- [ ] Save data restructure: separate run-local state from permanent meta-progression
- [ ] Run history storage
- [ ] Infamy Points + permanent unlock tracking

**Dependencies:** Phase 1 (cards must exist for the roguelike card-collection loop to work).

**Deliverables:** Discrete runs with fail states, Government Suspicion as run clock, card packs, Infamy meta-progression, Hall of Fame.

### Open Design Questions

- **Phase 1 fail conditions** — What specifically ends a run? Suspicion maxed? All minions captured with no gold to hire? Notoriety 100 for X ticks? Cascading failure?
- **Infamy Point formula** — What factors and weights? Should early-game failures still earn meaningful Infamy?
- **Permanent unlock pool** — What's available from the very first run? What do you unlock first?
- **Card pack balance** — How many packs per run? Rarity distribution curve over a multi-hour run?
- **Suspicion cap** — Is 100 the right max? Should it scale with phase?

### Resolved Questions (from prior roadmap)

| Question | Decision |
|----------|----------|
| Suspicion mechanics | Indirect: `base_rate * (1 + avg_notoriety / 100)`. No direct spend. |
| Suspicion vs. notoriety | Notoriety = tactical (per-task). Suspicion = strategic run clock driven by avg notoriety. |
| Legitimate business fronts | Dropped. Suspicion is managed by good automation (low notoriety). |
| Per-run resets | Yes — Gold, Influence, upgrades, cards all reset. Only Infamy persists. |
| Resource sinks | Influence → card packs. 4-resource model dropped entirely. |

---

## Phase 3 — Division Scaling (Game Phase 2)

**Goal:** The first "zoom out" moment. The player's entire Phase 1 kanban board collapses into a single Division card on a higher-level portfolio dashboard. Introduce Initiatives, per-division operational upgrades, and the Evil Monday.com UI.

*Source: [game-design-vision.md](game-design-vision.md) — Phase 2 Division Level*

### Division Model
- [ ] Division data model (encapsulates a full Phase 1 kanban: departments, minions, rules, resources)
- [ ] Division stats: gold output/min, notoriety level, automation level, minion count
- [ ] Division maturity columns: `Establishing → Operational → Scaling → Automated`
- [ ] Division creation trigger/mechanic

### Initiative Model
- [ ] Initiative data model (bundles/streams of tasks for a division to process)
- [ ] Initiative types with different task compositions, durations, and rewards
- [ ] Initiative completion rewards (own payout on top of child task rewards — required by modifier scoping)
- [ ] Initiative assignment: player assigns Initiatives to Divisions
- [ ] Task stream generation: Initiative feeds tasks into its division's kanban

### Portfolio Dashboard UI (Evil Monday.com)
- [ ] Division cards with health, output, and status indicators
- [ ] Maturity column layout (drag divisions between maturity stages? or progression is automatic?)
- [ ] Drill-down: click Division → see its Phase 1 kanban with rules running
- [ ] KPI panels: per-division gold output, regional notoriety, resource production
- [ ] Alert indicators (division needs attention, notoriety spiking, initiative stalled)

### Universal Cards at Division Level
- [ ] Same logic cards (Trigger/Condition/Action/Modifier) evaluate at division level — card logic unchanged, context changes
- [ ] Division-level rule slots: rules here govern initiative assignment and division behavior
- [ ] Executive card packs unlock (100 Influence, 7 cards shown, pick 3 — same universal pool, better rarity odds)
- [ ] Modifier scoping: modifiers on division-level rules boost initiative completion rewards only (no cascade to child tasks)

### Operational Upgrades Per Division
- [ ] New divisions start without operational upgrades
- [ ] Player invests gold to bring each division up to speed (same upgrade set as Phase 1)
- [ ] Per-division upgrade UI: select division → view/purchase its operational upgrades
- [ ] Strategic upgrades (Influence) continue to apply globally to all divisions

### Phase Transition
- [ ] Transition moment: *"Operations Director promotion available"*
- [ ] Kanban board zooms out → becomes one Division card on the portfolio
- [ ] First Initiative appears on the new dashboard

### Infrastructure
- [ ] Tick system scaling: per-division processing (N divisions × departments × minions)
- [ ] Save data: persist multiple divisions, their internal state, initiatives, per-division upgrades, division-level rules
- [ ] Government Suspicion rate increase at Phase 2 scale

**Dependencies:** Phase 2 (run structure must exist — divisions are within a run).

**Deliverables:** Working divisions as Phase 1 boards, Initiatives with own rewards, portfolio dashboard, universal cards at division level, per-division operational upgrades, Phase 1→2 transition moment.

### Open Design Questions

- **Division creation** — Player action? Automatic at milestone? Resource cost? How many max per run?
- **Minion pools** — Shared across divisions or independent recruitment per division?
- **Rule templates** — Do Phase 1 rules carry to new divisions? Copy? Template system? Start fresh?
- **Regional differentiation** — What makes Region A different from Region B? Modifiers? Different task pools? Different available missions?
- **Initiative specifics** — What does a task stream look like concretely? Tasks per minute? Composition (tier mix)? Duration?
- **Initiative reward formula** — What's the completion bonus? How does it scale with initiative tier/difficulty?
- **Per-division upgrade UX** — How does the player select and invest in a specific division's operational upgrades?
- **Dashboard design** — UI mockups needed. What KPIs matter? What's clickable? How does drill-down navigate?
- **Tick scaling** — How does the engine handle N divisions × M departments × K minions per tick without lag?
- **Mobile navigation** — How does portfolio view + drill-down work on mobile? New bottom nav tabs?

---

## Phase 4 — Regional Warfare & Rivals (Game Phase 3 / Endless)

**Goal:** The war room. Regions contain divisions, rival orgs contest territory, and the Government/IRS becomes the primary threat. This phase IS the endless mode — after absorbing rivals, escalating institutional pressure provides infinite depth.

*Source: [game-design-vision.md](game-design-vision.md) — Phase 3 Regional Level, Rival Organizations*

### Region & Imperative Models
- [ ] Region data model (collection of divisions with shared modifiers)
- [ ] Imperative data model (strategic directive: "Aggressive Expansion", "Consolidate", etc.)
- [ ] Imperative effects: shape what Initiatives a region's divisions pursue
- [ ] Region stats: total output, territory control, division count, contested status

### Rival Organization System
- [ ] Rival org generation (randomized personality: aggressive, defensive, espionage-focused, etc.)
- [ ] Rival AI behavior (contest territories, poach minions/divisions, counter strategies)
- [ ] Rival adaptation (repeated player strategies become less effective)
- [ ] Rival defeat → absorb territory + get their card stash (Rival's Stash packs)

### War Room UI (Evil Bloomberg Terminal)
- [ ] Territory control map (regions, contested zones, rival positions)
- [ ] Rival org intel panels (health, strategy, vulnerability assessment)
- [ ] Strategic operations board (assign divisions to operations against rivals)
- [ ] Operation columns: `Intel Gathered → Operation Planned → Deployed → Resolved`

### Universal Cards at Regional Level
- [ ] Same logic cards evaluate at regional level — card logic unchanged, context changes to regions/imperatives
- [ ] Regional-level rule slots: rules here govern imperative assignment and region strategy
- [ ] Modifier scoping: modifiers on regional-level rules boost imperative strategic payouts only (no cascade)
- [ ] Card drops from Phase 3 milestones and rival defeats (same universal pool)

### Operational Upgrades Per Region
- [ ] New regions start without operational upgrades
- [ ] Per-region gold investment for regional-level stat bonuses
- [ ] Strategic upgrades continue to apply globally

### Phase Transition & Endgame
- [ ] Transition moment: division sabotaged → *"INTEL REPORT: External organization detected"* → war room unlocks
- [ ] Government Suspicion rate increase at Phase 3 scale (active investigation)
- [ ] Victory condition: absorb all rivals + survive government investigation
- [ ] Post-victory endless: escalating institutional pressure, new rival waves

### Infrastructure
- [ ] Tick system: regional-level scheduling
- [ ] Save data: regions, rivals, imperatives, per-region upgrades, regional-level rules, territory state
- [ ] Government Suspicion endgame curve

**Dependencies:** Phase 3 (divisions must exist as units to compose into regions).

**Deliverables:** Working regions with imperatives (own strategic payouts), rival org AI, war room UI, universal cards at regional level, per-region operational upgrades, Phase 2→3 transition, victory/endless flow.

### Open Design Questions

- **Rival org AI** — How complex? State machine? Scripted behavior trees? Actual adaptation?
- **Rival count** — How many per run? Fixed? Scaling with player progress?
- **Territory mechanics** — Hex map? Node graph? Abstract board? How is territory contested and captured?
- **Imperative specifics** — "Aggressive Expansion" concretely means what? Changes initiative selection how?
- **Imperative reward formula** — What's the strategic payout? How does it scale with imperative scope?
- **Per-region upgrade UX** — How does the player invest operational upgrades at regional scale?
- **War room visual design** — Bloomberg terminal parody mockups needed. How dense? What's interactive?
- **Endless escalation** — Post-victory, what keeps getting harder? New rival waves? Government tiers? Internal dissent?
- **3D/map visualization** — Three.js for territory map? Or keep it 2D/abstract to match corporate aesthetic?
- **Mobile war room** — How does a data-dense Bloomberg parody work on a phone?

---

## Phase 5 — Narrative, Polish & Full Experience

**Goal:** Weave narrative, audio, and visual polish throughout all phases. This work can start partially after Phase 1 and intensifies once core mechanics are solid.

*Source: [narrative.md](narrative.md), [art-direction.md](art-direction.md)*

### Narrative Integration
- [ ] Milestone event system (trigger dialogue/events at specific run states)
- [ ] Per-run story beats: tutorial prologue, department discoveries, first hero encounter
- [ ] Phase transition narratives (the "oh snap" moments from vision doc)
- [ ] Flavor text on missions, cards, notifications
- [ ] Evil Newsletter system (periodic world-building toasts)

### Corporate Satire UI Pass
*Source: [art-direction.md](art-direction.md) Corporate Renaming*

- [ ] Rename panels with corporate satire alternatives (Intelligence Briefing, Talent Acquisition, etc.)
- [ ] Corporate subtitle additions to department headers
- [ ] Card flavor text in corporate-speak
- [ ] Rolodex and rule builder use corporate form/memo aesthetics

### Sound Design v1
*Source: [art-direction.md](art-direction.md) Sound Design*

- [ ] Core interaction sounds: click, completion, gold earned, hire, upgrade
- [ ] Card-specific sounds: pack opening, card slot, rule activation
- [ ] Raid warning alarm, notification blip
- [ ] Volume controls and mute toggle
- [ ] Ambient office background (optional, off by default)

### Minion Depth
- [ ] Personality traits (Greedy, Zealous, Careful, Lucky) with stat effects
- [ ] Personality events triggered by task completion milestones
- [ ] Minion dialogue bubbles for flavor moments
- [ ] Loyalty system (if it fits roguelike run length)
- [ ] Retirement system (if it fits roguelike run length)

### Achievement System
- [ ] Achievement tracking across runs (permanent)
- [ ] Categories: progression, challenge, discovery, card collection
- [ ] Achievement display panel
- [ ] Cosmetic rewards for milestones

### Accessibility & Polish
- [ ] WCAG AA audit across all UIs
- [ ] `prefers-reduced-motion` respect for all animations
- [ ] Screen reader compatibility for card system and rule builder
- [ ] Mobile experience polish across all phases
- [ ] Visual polish: phase transition animations, card opening effects, pack reveal

**Dependencies:** Can start partially after Phase 1 (satire pass, sound, basic narrative). Full integration requires Phase 4 content.

**Deliverables:** Cohesive narrative voice, audio, corporate satire throughout, deeper minions, achievements, accessible UIs.

### Open Design Questions

- **Narrative in a roguelike** — Per-run story beats? Permanent lore unlocks across runs? Or both?
- **Campaign structure** — Does the old 3-act campaign (narrative.md) translate into runs, or is it replaced by milestone-based storytelling?
- **Minion traits/loyalty/retirement** — Do these systems have enough time to matter within a single run? Or are they meta-progression?

### Resolved Questions (from prior roadmap)

| Question | Decision |
|----------|----------|
| Equipment system (Loot sink) | Dropped with Loot. Cards fill the "improve minions" space via Modifier cards. |
| Resource sinks (Intel/Chaos/Loot) | All dropped. Economy simplified to Gold + Influence. |

---

## Old Roadmap Item Disposition

Every item from the prior roadmap is accounted for below.

| Old Item | Status | New Location |
|----------|--------|-------------|
| Notoriety rework (decay, 3 upgrades, scaled cover-tracks) | **Preserved** | Phase 0 |
| Minion rank titles & stat visibility | **Preserved** | Phase 0 |
| Supplies/Intel resources | **Consolidated** | Merged into Influence (Phase 0) |
| Loot/Chaos resource production | **Dropped** | Economy simplified to Gold + Influence |
| Text readability / accessibility | **Preserved** | Phase 0 |
| Tech tree (Supplies-funded) | **Superseded** | Replaced by card-based automation (Phase 1) |
| Auto-routing rules | **Absorbed** | Into card system rules (Phase 1) |
| Intel sink: mission scouting | **Dropped** | Intel merged into Influence; scouting not in current vision |
| Loot sink: minion equipment | **Dropped** | Loot dropped; cards fill the "improve minions" space |
| Chaos sink: world events | **Dropped** | Chaos dropped; may revisit as card effects |
| Minion traits | **Repositioned** | Phase 5 (polish/depth) |
| Act 1 campaign | **Needs rethinking** | Phase 5 — doesn't map cleanly to roguelike runs |
| Acts 2–3 campaign | **Needs rethinking** | Phase 5 — doesn't map cleanly to roguelike runs |
| Corporate satire UI pass | **Preserved** | Phase 5 |
| Sound design v1 | **Preserved** | Phase 5 |
| Minion personality system | **Repositioned** | Phase 5 (polish/depth) |
| Chain missions | **Repositioned** | Could become Initiative content in Phase 3 |
| Department legendary missions | **Repositioned** | Could be milestone card-drop triggers in Phase 1 |
| Rival villain system | **Expanded** | Phase 4 (full rival org system) |
| Prestige system | **Replaced** | By Infamy Points + roguelike meta-progression (Phase 2) |
| Department managers | **Superseded** | By card-based rules automating departments (Phase 1) |
| Department specialization trees | **Dropped** | Per-department resource trees dropped with 4-resource model |
| Minion retirement & legacy | **Repositioned** | Phase 5 (if it fits run length) |
| Minion loyalty system | **Repositioned** | Phase 5 (if it fits run length) |
| Achievement system | **Preserved** | Phase 5 |
| Difficulty scaling & balancing | **Distributed** | Ongoing across all phases |

---

## Cross-Document References

| Topic | Primary Doc | Roadmap Phase |
|-------|------------|---------------|
| Card system & rule building | [game-design-vision.md](game-design-vision.md) | Phase 1 |
| Run structure & roguelike loop | [game-design-vision.md](game-design-vision.md) | Phase 2 |
| Phase hierarchy (Dept → Division → Region) | [game-design-vision.md](game-design-vision.md) | Phase 3–4 |
| Rival organizations | [game-design-vision.md](game-design-vision.md) | Phase 4 |
| Government/IRS suspicion | [game-design-vision.md](game-design-vision.md) | Phase 2, 4 |
| Gold + Influence economy | [game-design-vision.md](game-design-vision.md), [game-design.md](game-design.md) | Phase 0–1 |
| Notoriety balance proposals | [../gameplay-improvements.md](../gameplay-improvements.md) | Phase 0 |
| Stat visibility proposals | [../gameplay-improvements.md](../gameplay-improvements.md) | Phase 0 |
| Narrative design & campaign arc | [narrative.md](narrative.md) | Phase 5 (rethink needed) |
| Art direction & sound design | [art-direction.md](art-direction.md) | Phase 5 |
| Text readability feedback | [../user-feedback.md](../user-feedback.md) | Phase 0 |

---

## Phase Dependencies

```
Phase 0 (Foundation & Balance)
  └── Phase 1 (Card System) ── core new mechanic, everything depends on this
        ├── Phase 2 (Run Structure) ── needs cards for roguelike collection loop
        │     └── Phase 3 (Divisions) ── needs runs to have failure/success arcs
        │           └── Phase 4 (Regions/Rivals) ── needs divisions as composable units
        └── Phase 5 (Polish/Narrative) ── can start partially after Phase 1
```

Each phase builds on prior phases. No phase requires features from a later phase. Phase 5 work (satire, sound, narrative) can be threaded in incrementally starting after Phase 1 — it doesn't have to wait for Phase 4 to begin.
