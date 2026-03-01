# Minion Manager — Feature Roadmap

> This roadmap charts the path from the current idle game to the **roguelike management sim** described in [game-design-vision.md](game-design-vision.md). The game reorients around escalating quarterly targets and Year-End boss reviews (Balatro-inspired), with a gold-only economy and card-based automation.
>
> Related docs: [game-design.md](game-design.md) (current mechanics), [game-design-vision.md](game-design-vision.md) (long-term vision), [narrative.md](narrative.md), [art-direction.md](art-direction.md), [../gameplay-improvements.md](../gameplay-improvements.md), [../user-feedback.md](../user-feedback.md)

---

## Feature Pillars

| Pillar | Goal | Key Systems |
|--------|------|-------------|
| **Economy** | Gold-only, one number that matters | Quarterly gold targets (gross gold earned), earning efficiency tension |
| **Automation** | Player-authored rules | Universal logic cards, strategic upgrades (gold-priced), AND/OR chaining |
| **Roguelike** | Escalating runs with loss condition | Quarterly targets, Year-End boss reviews, named reviewers with modifiers |
| **Meta** | Between-run progression | Infamy Points, permanent unlocks, Hall of Fame |
| **Polish** | Juice + accessibility + narrative | Sound, animations, corporate satire, milestone storytelling |

---

## Phase A — Strip & Restructure

**Goal:** Remove accumulated complexity (notoriety, Influence, raids, bribes, cover tracks) and add the quarterly review structure. This simplifies the game to its core — kanban board + minions + gold — and establishes the run structure.

### Remove Systems

- [ ] Remove **notoriety system** entirely
  - `notoriety.model.ts`, `notoriety.model.spec.ts` — delete
  - Notoriety signals in `game-state.service.ts` — remove
  - `awardGold()` notoriety gain path — remove
  - Notoriety bar component + stories — remove
  - Header threat level display — remove
- [ ] Remove **Influence currency**
  - `resource.model.ts` Influence-related exports — remove or repurpose
  - Influence signals in `game-state.service.ts` — remove
  - Influence display in header — remove
  - Influence penalty from notoriety — remove
- [ ] Remove **4 notoriety upgrades**
  - Lay Low Protocol, Shadow Operations, Deep Cover, Bribe Network — remove from `upgrade.model.ts`
  - Update upgrade counts, categories, UI
- [ ] Remove **raids**
  - `checkRaidTrigger()`, `processRaidCountdown()` — remove from `game-state.service.ts`
  - Raid intervals in `game-timer.service.ts` — remove
  - Raid UI (alert, defend button) — remove
  - `RaidStarted`, `RaidEnded` events — remove
- [ ] Remove **bribes**
  - `bribeCost()`, bribe methods — remove
  - Bribe UI — remove
- [ ] Remove **cover tracks missions**
  - `createCoverTracksMission()`, `COVER_TRACKS_CHANCE` — remove
  - Cover tracks templates — remove
- [ ] Remove **breakout missions** (raids are gone, so captures don't happen)
  - `capturedMinions` signal, prison timers — remove
  - Breakout mission logic — remove

### Update Research Passive

- [ ] Research department passive ("Covert Ops — reduced notoriety gain") needs a **new purpose** since notoriety is removed
  - Proposed: "Efficiency Lab — reduced task time" (−5% per level above 1, stacks with Speed Drills)
  - Alternative: "R&D Insights — bonus XP from all tasks"

### Add Quarterly Structure

- [ ] Create `quarter.model.ts` — quarter targets, year/quarter state, task budget tracking
- [x] Add quarterly signals to `game-state.service.ts`: `currentYear`, `currentQuarter`, `quarterTaskBudget`, `quarterTasksCompleted`, `quarterGoldTarget`, `quarterGold`
- [x] Track gross gold earned per quarter (spending not tracked — target is gross gold)
- [x] Quarter completion detection: when `quarterTasksCompleted >= quarterTaskBudget`
- [x] Quarter result: pass (gold earned ≥ target) or miss (gold earned < target)
- [ ] Track missed quarters for boss modifier stacking
- [ ] Year 1 targets: Q1 (30 tasks, 75g), Q2 (40 tasks, 400g), Q3 (60 tasks, 1200g)
- [ ] Year 2+ scaling: +10 tasks/quarter/year, ×1.8 gold targets/year

### Add Quarterly Events

- [ ] New game events: `QuarterCompleted`, `QuarterMissed`, `YearStarted`
- [ ] Quarterly progress UI: header indicator showing tasks remaining + gold progress
- [ ] Drawer panel section: quarterly details, year tracker
- [ ] Card pack placeholder rewards on quarter pass (actual card system is Phase C)

### Update Persistence

- [ ] Bump save data version
- [ ] Add quarterly state to save format (year, quarter, progress, missed count)
- [ ] Migration from prior version (strip notoriety/influence/raids, add quarterly state)
- [ ] Update all affected unit tests
- [ ] Update E2E tests (remove notoriety flows, add quarterly flows)
- [ ] Update Storybook stories (remove notoriety bar, update header, update drawer)

### Text Readability & Accessibility

*Carried forward from prior Phase 0:*

- [ ] Audit small text sizes and low-contrast elements
- [ ] Increase minimum font size on data-dense panels
- [ ] Ensure all text meets WCAG AA contrast ratio (4.5:1)

**Dependencies:** None — this is the foundation phase.

**Deliverables:** Clean gold-only economy, quarterly target tracking, stripped-down game with clear tension mechanic.

---

## Phase B — Year-End Boss Reviews

**Goal:** Add the loss condition that makes this a roguelike. Named corporate reviewers with modifier pools create the "boss blind" challenge at the end of each year.

### Reviewer Data Model

- [ ] `reviewer.model.ts` — reviewer pool with named characters, titles, personalities
- [ ] Base challenge per reviewer (constraint active during review)
- [ ] Missed-quarter modifier pool per reviewer (drawn from all 3 categories)
- [ ] 8-12 reviewers in the initial pool

### Modifier System

- [ ] Modifier types: task constraints, operational constraints, survival challenges
- [ ] Modifier application: temporarily alter game rules during review
- [ ] Modifier removal: restore normal rules when review ends
- [ ] Stacking: 0-3 missed-quarter modifiers added to reviewer's base challenge

### Review Flow

- [ ] Year-End review trigger at Q4
- [ ] Reviewer selection (random from year's available pool)
- [ ] Review is a special quarter with own task budget + gold target + active modifiers
- [ ] Review result: survive (pass target under constraints) → next year, fail → run over
- [ ] Run-over screen with summary stats

### Year Scaling

- [ ] Year 1: 3 reviewers available
- [ ] Year 2: +3 reviewers (6 total)
- [ ] Year 3: +2 reviewers (8 total)
- [ ] Year 4+: full pool available
- [ ] Target multiplier: 1.0× → 1.8× → 3.0× → +1.5×/year

### Review UI

- [ ] Reviewer introduction screen (name, title, personality flavor text)
- [ ] Active modifiers display during review
- [ ] Review progress tracker (task budget + gold target under constraints)
- [ ] Review result screen (survive/fail)

### Example Reviewers

| Reviewer | Title | Base Challenge |
|----------|-------|----------------|
| Margaret Thornton | VP of Compliance | "Only Sinister+ tasks count" |
| Viktor Grimes | Head of Internal Affairs | "No new hires during review" |
| Director Blackwell | Chief Risk Officer | "Raids every 30 seconds" |
| Patricia Hale | SVP Strategic Oversight | "Board refresh frozen" |
| The Auditor | ??? | "Gold drains at 5g/s" |

**Dependencies:** Phase A (quarterly structure must exist).

**Deliverables:** Named boss reviewers, modifier system, Year-End review flow, run termination condition, year scaling.

---

## Phase C — Card System & Rule Engine

**Goal:** The core new system. Players collect logic cards and arrange them into automation rules. This is what transforms the game from a clicker into a management sim.

*Source: [game-design-vision.md](game-design-vision.md) — Card-Based Rule Building*

### Card Data Model

- [ ] Card types: Trigger (Red), Condition (Blue), Action (Green), Modifier (Gold)
- [ ] Card attributes: id, type, name, description, rarity, parameters
- [ ] Card rarity tiers (Common, Uncommon, Rare, Legendary)
- [ ] Card pool: 29 universal cards (8 Triggers, 10 Conditions, 8 Actions, 5 Modifiers)

### Rule Engine

- [ ] Rule model: Trigger + optional Conditions + Action + optional Modifiers
- [ ] Rule evaluation: all-match + priority claiming
- [ ] **Default rule:** built-in `WHEN Idle → Assign to Work` (always lowest priority, cannot be removed)
- [ ] Priority ordering (player-configurable drag to reorder)
- [ ] AND-clause multiplier: 0=1x, 1=1.5x, 2=2.5x, 3=5x, 4=8x, 5=12x
- [ ] Rules subscribe to game events (triggers are event subscriptions)

### Strategic Upgrades (Gold)

- [ ] Rule Slots: +1 active rule per level (max 5) — 25/60/120/200/350g
- [ ] Condition Depth: +1 max AND-clause per rule (max 3) — 40/100/200g
- [ ] Logic Gates: OR (L1), NOT (L2), nested boolean (L3) — 50/125/250g
- [ ] Pack Insight: +1 card shown per pack opening (max 3) — 30/75/150g
- [ ] Card Synergy: +10% modifier effectiveness per level (max 3) — 35/90/180g

### Card Acquisition

**Quarterly rewards** (primary cadence):
- Pass Q1 → card pack (3 shown, pick 1)
- Pass Q2 → card pack (4 shown, pick 1)
- Pass Q3 → card pack (5 shown, pick 2)
- Survive Year-End → card pack (5 shown, pick 2)

**Gold-purchased packs** (competing with upgrades/hires):
- Pack pricing TBD — must be meaningful enough to compete with operational investments

**Milestone drops** — 12 deterministic cards through natural progression:

| Milestone | Card | Type |
|-----------|------|------|
| Complete 5 tasks | When Idle | Trigger |
| Reach VL 2 | Assign to Work | Action |
| First dept L2 | Specialty Match | Condition |
| Complete 25 tasks | Gold Rush | Modifier |
| Hire 5th minion | Tier Check | Condition |
| Reach VL 4 | On Completion | Trigger |
| Any dept L4 | Assign to Highest Tier | Action |
| Complete 75 tasks | Swift Execution | Modifier |
| Reach VL 6 | Every 10s | Trigger |
| Any dept L6 | Level Threshold | Condition |
| Complete 150 tasks | Stealth Op | Modifier |
| Reach VL 8 | On Threat Change | Trigger |

### Boss + Card Interactions

- [ ] "Automation rules disabled" modifier — forces manual play during review
- [ ] "Only 1 rule slot active" modifier — forces prioritization
- [ ] "Modifier cards have no effect" — strips bonus effects

### Rule Builder UI

- [ ] WHEN [trigger] → IF [conditions] → THEN [action] + [modifiers]
- [ ] Drag/slot cards from collection into rule slots
- [ ] Active rules list with enable/disable and priority reordering
- [ ] Rule preview in plain English

### Rolodex UI

- [ ] Corporate rolodex aesthetic for browsing cards
- [ ] Filter/sort by type, rarity
- [ ] Card detail view with stats and flavor text

### Persistence

- [ ] Save data update: card collection + active rules + rule configuration
- [ ] Migration from prior save version

**Dependencies:** Phase A (gold economy + quarterly rewards provide card acquisition cadence), Phase B (boss modifiers interact with rules).

**Deliverables:** Working card system, rule engine, rule builder UI, rolodex, card collection through quarterly rewards + milestones + gold purchases.

### Open Design Questions

- **Rule builder interaction design** — Mockups needed. Mobile touch experience?
- **Card pack gold pricing** — How much should gold-purchased packs cost?
- **Chain Reaction card** — Deferred. Needs redesign for event-driven architecture.

---

## Phase D — Meta-Progression

**Goal:** Add between-run persistence so failure feels productive and each run builds toward something permanent.

### Infamy Points

- [ ] Meta-currency earned per run based on performance
- [ ] Factors: years survived, total gold earned, tasks completed, cards collected
- [ ] Formula TBD — early failures should still earn meaningful Infamy

### Permanent Unlocks

- [ ] New card types added to drop pool
- [ ] New reviewer types
- [ ] Starting bonuses (starting gold, starter card packs)
- [ ] Cosmetics (minion appearances, UI themes)

### Run Management

- [ ] "New Run" flow — reset gold, minions, departments, upgrades, cards
- [ ] Run summary screen (years survived, gold earned, Infamy earned, cards collected)
- [ ] Run history / Hall of Fame

### Persistence

- [ ] Separate run-local state from meta-progression in save data
- [ ] Infamy Points + permanent unlock tracking
- [ ] Run history storage

**Dependencies:** Phase B (runs must have a loss condition for meta-progression to matter).

**Deliverables:** Infamy Points, permanent unlocks, run management flow, Hall of Fame.

---

## Phase E — Narrative, Polish & Full Experience

**Goal:** Weave narrative, audio, and visual polish throughout all phases. Can start partially after Phase A.

### Corporate Satire UI Pass

*Source: [art-direction.md](art-direction.md)*

- [ ] Rename panels with corporate satire alternatives
- [ ] Card flavor text in corporate-speak
- [ ] Reviewer personality dialogue and flavor

### Sound Design v1

*Source: [art-direction.md](art-direction.md)*

- [ ] Core interaction sounds: click, completion, gold earned, hire, upgrade
- [ ] Card-specific sounds: pack opening, card slot, rule activation
- [ ] Boss review sounds: reviewer introduction, modifier activation
- [ ] Volume controls and mute toggle

### Per-Second Metrics (Player Communication)

Stats panel showing:
- [ ] Gold/second — current gold income rate
- [ ] Tasks/minute — task throughput
- [ ] Quarterly progress — X/Y gold toward target, tasks remaining
- [ ] Minion utilization — % of minions currently working
- [ ] Department levels at a glance
- [ ] Active upgrade effects summary

### Minion Depth

- [ ] Personality traits (Greedy, Zealous, Careful, Lucky) with stat effects
- [ ] Minion dialogue bubbles for flavor moments

### Achievement System

- [ ] Achievement tracking across runs (permanent)
- [ ] Categories: progression, challenge, discovery, card collection

### Accessibility & Polish

- [ ] WCAG AA audit across all UIs
- [ ] `prefers-reduced-motion` respect for all animations
- [ ] Screen reader compatibility for card system and rule builder
- [ ] Mobile experience polish

### Stat Visibility (carried forward)

- [ ] Expandable stat breakdown panel on minion cards
- [ ] Specialty match indicator on task cards

**Dependencies:** Can start partially after Phase A. Full integration requires Phase C content.

**Deliverables:** Corporate satire voice, audio, per-second metrics, deeper minions, achievements, accessible UIs.

---

## Completed Work

### Phase 0 — Foundation (Complete)

These items were completed before the quarterly review redesign:

- [x] Event-driven architecture refactor (15 event types, `GameEventService`, `GameTimerService`)
- [x] Passive notoriety decay *(system now being removed)*
- [x] Notoriety management upgrades (Bribe Network, Shadow Ops, Lay Low, Deep Cover) *(being removed)*
- [x] Scaled Cover Your Tracks missions *(being removed)*
- [x] Minion rank titles & star ratings
- [x] Influence currency (merged from Supplies + Intel) *(being removed)*
- [x] Progressive department unlocking
- [x] Storybook testing infrastructure (20/21 components)
- [x] Coverage gates (core + merged thresholds)

**Note:** Several completed items (notoriety, Influence, raids, bribes, cover tracks) are being removed as part of Phase A. The event-driven architecture, rank system, department unlocking, and testing infrastructure carry forward.

---

## Old Roadmap Item Disposition

| Old Item | Status | New Location |
|----------|--------|-------------|
| Notoriety rework (decay, upgrades, cover-tracks) | **Removed** | Entire system dropped (Phase A) |
| Influence currency | **Removed** | Dropped — gold only (Phase A) |
| Cover Tracks, Bribes, Raids | **Removed** | Dropped with notoriety (Phase A) |
| 4 notoriety upgrades | **Removed** | Dropped with notoriety (Phase A) |
| Government Suspicion | **Replaced** | By quarterly targets + boss reviews (Phases A-B) |
| Three-phase zoom-out (Dept→Division→Region) | **Dropped** | Game stays at department scale |
| Rival organizations | **Dropped** | May revisit as Year 3+ content |
| Card system & rule engine | **Preserved** | Phase C (gold-priced instead of Influence) |
| Meta-progression (Infamy Points) | **Preserved** | Phase D |
| Corporate satire UI pass | **Preserved** | Phase E |
| Sound design | **Preserved** | Phase E |
| Minion traits/depth | **Preserved** | Phase E |
| Achievement system | **Preserved** | Phase E |
| Accessibility | **Preserved** | Phase A (basics) + Phase E (full) |
| Stat visibility (expandable panels, specialty indicators) | **Preserved** | Phase E |
| Per-second metrics | **Added** | Phase E |
| Equipment system | **Dropped** | Cards fill the "improve minions" space |
| Department specialization trees | **Dropped** | Depts differentiated by passives only |
| Department managers | **Superseded** | Card-based rules automate departments |
| Prestige system | **Replaced** | Infamy Points + roguelike meta (Phase D) |
| Tech tree | **Superseded** | Card-based automation (Phase C) |

---

## Phase Dependencies

```
Phase A (Strip & Restructure)
  └── Phase B (Boss Reviews) ── adds the loss condition
        └── Phase C (Card System) ── core depth system
              └── Phase D (Meta-Progression) ── between-run persistence
  └── Phase E (Polish/Narrative) ── can start after Phase A, intensifies after Phase C
```

Each phase builds on prior phases. Phase E work (satire, sound, metrics) can be threaded in incrementally starting after Phase A.
