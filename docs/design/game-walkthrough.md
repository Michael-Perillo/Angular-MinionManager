# Minion Manager — Current Game Walkthrough, Gaps & Improvements

## Part 1: How the Game Works

### Starting a New Game

The player starts as a budding villain managing an evil organization through a corporate-themed kanban board. Initial state:
- **0 gold**, no minions, Year 1 Quarter 1
- **Schemes department** unlocked by default (other 3 locked)
- A **15-card starter scheme deck** is generated (6 Petty, 6 Sinister, 3 Petty Flex) targeting heists/research/mayhem
- The **scheme hand** (mission board) is filled from the deck (up to 8 cards)

### Core Gameplay Loop

```
SCHEME HAND (drawn from your deck)
    ↓ click to execute (costs 1 budget) or dismiss (costs 1 of 5 dismissals)
SCHEME COMPLETES → small direct gold (1-5g) + generates 1-3 Operations
    ↓ operations auto-route to target department queue
DEPARTMENT QUEUES (Heists / Research / Mayhem)
    ↓ minions auto-process (or player clicks in workbench)
OPERATION COMPLETES → gold via Base × Mult formula
```

**Budget** counts only scheme completions (not operations). When budget runs out, the quarter ends.

### Clicking & Task Completion

- **Player clicks** on the active task in the workbench (1 click = 1 progress by default, boosted by click power vouchers)
- **Minions auto-click** every tick (1s) — each minion applies `floor(speed)` clicks per tick to their assigned department's top task
- Tasks complete when `clicksApplied >= clicksRequired`
- Completed tasks award gold + XP to department + XP to assigned minion

### Gold Formula: Base x Mult

All integer, mental-math friendly:

```
Gold = Base × max(1, Mult)

Where:
  Base = TIER_CONFIG[tier].gold  (Petty:2, Sinister:5, Diabolical:12, Legendary:30)
  Mult = 1
       + getDeptMult(level)      (0 at L1, +1 per level above 1)
       + specialtyMatch          (+1 if minion specialty matches task category)
       + specialOp               (+1 if scheme was marked special, 15% chance)
       + activeBreakthroughs     (+1 per research breakthrough this quarter)
       + jokerMult               (additive: Gold Rush +1, Heist Expert +2, etc.)
       + bossMultPenalty          (-1 or -2 from reviewer modifiers in Q4)
```

### Scheme Cards

Each card shows:
- **Tier badge** (Petty/Sinister/Diabolical/Legendary)
- **Target department** icon (which dept gets the operations)
- **Click cost** (3/5/8/12 by tier)
- **Direct gold** (1/2/3/5 by tier)
- **Operation preview** (e.g., "→ 2× Sinister Heist")

Schemes can be **executed** (player clicks or minion-assigned) or **dismissed** (discarded, draws replacement, uses 1 of 5 dismissals per quarter).

### Department Mechanics

Each of the 4 departments has a unique identity:

| Department | Role | Unique Mechanic |
|-----------|------|-----------------|
| **Schemes** | Planner | Generates 1-3 operations per completion; higher level → more high-tier schemes on board |
| **Heists** | Gambler | Gold is variable: rolled in range `[base×0.5, base×2.5]`; higher level raises the floor |
| **Research** | Investor | Every 5th completion (3rd at L5) → Breakthrough: +1 mult to ALL depts for rest of quarter |
| **Mayhem** | Speedster | 40% fewer clicks but 30% less gold; 3 consecutive completions within 8s → 2× gold combo |

Departments also share:
- **Level-based mult:** `+1 mult per level above 1` (additive)
- **Per-dept tier unlocking:** Buy Sinister (15g), Diabolical (80g), Legendary (300g) per dept
- **XP curve:** `floor(25 × (level-1)²)` — L2:25, L3:100, L4:225, L5:400

### Minion System

- **Hiring:** Pick 1 of 2 randomly generated candidates. If locked depts exist, at least one candidate has a locked-dept specialty (incentivizing dept unlocks).
- **Cost:** `floor(75 × 1.5^(count) × (1 - discount))` — escalating with diminishing returns from Hire Discount voucher
- **Assignment:** Drag minions from pool to department worker zones
- **Speed:** Random ~0.7-1.3, determines auto-clicks per tick (`floor(speed)`)
- **Specialty:** Emerges after completing enough tasks in one category → +1 mult when matched
- **Leveling:** XP from task completions (Petty:3, Sinister:8, Diabolical:15, Legendary:25)

### Automation System (Cards + Rules)

22 logic cards in 3 types:
- **5 Triggers:** When Idle, When Task Completed, When Hired, When Quarter Starts, When Assigned
- **10 Conditions:** Dept-specific, tier checks, gold thresholds, specialty match, role check
- **7 Actions:** Assign to Work, Assign to Dept (×4 dept-specific), Level Up, Reroll

Players build **rules** from Trigger → Condition(s) → Action chains. Rules evaluate with priority ordering, highest-priority match claims the minion. Default rule (always lowest priority): "When Idle → Assign to Work."

Rule slots start at 1, expandable to 4 via Rule Mastery voucher.

### Quarterly Structure

Each year has 4 quarters:
- **Q1-Q3:** Normal play. Each has a task budget and gold target.
- **Q4:** Year-End Boss Review with a named reviewer + modifier constraints.

**Quarter flow:**
1. Play until task budget exhausted (only scheme completions count)
2. Evaluate: gross gold earned vs target
3. **Pass:** Earn card pack (quality scales with efficiency rating) → Shop opens → Advance
4. **Fail (Q1-Q3):** No card pack, +1 missed quarter (stacks boss difficulty) → Advance
5. **Fail (Q4):** Game Over — run is ended

**Efficiency ratings** (for pack quality):
| Rating | Budget Remaining | Cards Shown / Pick |
|--------|----------------|--------------------|
| Standard | ≤10% | 3 / 1 |
| Standard+ | 10-25% | 4 / 2 |
| Premium | 25-50% | 5 / 2 |
| Premium+ | >50% | 5 / 3 |

### Year-End Boss Reviews (Q4)

5 named reviewers with escalating difficulty:
- **Margaret Thornton** (Y1+): Only Sinister+ tasks count — gold target 200g
- **Viktor Grimes** (Y1+): Hiring disabled — gold target 150g
- **Patricia Hale** (Y1+): Board frozen — gold target 250g
- **The Auditor** (Y2+): Gold drain (-5g per task) — gold target 300g
- **Director Chen** (Y2+): -1 mult penalty — gold target 350g

Each missed Q1-Q3 draws an extra modifier from the reviewer's pool (up to 3 stacking penalties). 14 total modifiers across task constraints, operational constraints, and economic penalties.

Gold targets scale at 2.2× per year.

### Between-Quarter Shop

Opens after passing Q1-Q3 or after passing Q4:
- **Department unlocks:** Unlock Heists (60g), Research (65g), Mayhem (75g), Schemes (50g)
- **Gameplay vouchers (6):** Iron Fingers (click power), Board Expansion, Operations Desk (task slots), Hire Discount, Dept Funding (XP bonus), Rule Mastery (rule slots) — each 3 levels, year-scaled costs
- **Card packs:** Standard (150g, 3 shown / pick 1) and Premium (350g, 5 shown / pick 2)

### Jokers

10 jokers with passive effects (max 5 equipped):
- **Common:** Gold Rush (+1 mult), Deep Pockets (+1 flat gold), Iron Fist (+2 click power)
- **Uncommon:** Quick Study (×1.3 XP), Heist Expert (+2 mult heists only), Research Grant (×1.5 dept XP for research)
- **Rare:** Speed Demon (×1.25 minion speed), Bargain Hunter (-3 clicks), Lucky Break (+2 mult on specialty match)
- **Legendary:** Overachiever (+3 mult on specialty match)

### Deck Growth

The scheme deck grows through:
1. **Research milestones:** Every 3 research completions → add 1 scheme card (tier scales with Research dept level)
2. **Card packs:** Quarterly efficiency rewards and shop purchases include scheme cards
3. **Deck reshuffles** when empty (all used cards return, re-rolled)

### Persistence

Auto-saves to localStorage (on beforeunload + every ~30 ticks). Save version v15 with cumulative migrations from v1.

---

## Part 2: Identified Gaps

### Critical Gaps (affect core playability)

1. **No tutorial or onboarding.** New players see a kanban board with no explanation of what to do. The scheme deck, department mechanics, dismissals, and operations pipeline are non-obvious. A `tutorial-plan.md` exists in docs but is unimplemented.

2. **Scheme deck management has no UI.** Players can't view their full deck, see card distribution, or plan around what's coming. The deck is invisible — only the hand (board) is shown.

3. **No feedback on department mechanics.** Heist gold variance, research breakthroughs, and mayhem combo are computed in the service but the UI doesn't clearly communicate them:
   - Heist cards don't show gold ranges (variance is invisible)
   - Research breakthrough progress is passed to dept columns but display is minimal
   - Mayhem combo counter is tracked but UI indicator is limited

4. **Missing "game over" recovery path.** When a run ends (Q4 fail), the only option is starting completely over. No meta-progression (Infamy Points, permanent unlocks) exists yet — Phase D of the roadmap.

5. **Dismissal counter not prominently displayed.** The header shows budget/gold progress but dismissals remaining (a key resource) may not be clearly surfaced.

### Moderate Gaps (affect experience quality)

6. **Department unlock flow is awkward.** Players must visit the between-quarter shop to unlock departments, but the shop only opens after passing a quarter. A player stuck in Q1 with only Schemes can't unlock anything to improve their situation.

7. **Scheme-to-operations routing is automatic but opaque.** When a scheme completes, operations silently appear in department queues. There's no animation, transition, or clear visual feedback showing the pipeline flow.

8. **No scheme card detail view.** Cards on the board show basic info but there's no way to inspect a card's full details (operation tiers, special op chance, etc.).

9. **Minion assignment lacks guidance.** No indication of which department needs workers, or optimal minion placement. Players must mentally track queue sizes and minion counts.

10. **Rule editor complexity.** The automation system (22 cards, trigger-condition-action chains, priority ordering) is powerful but potentially overwhelming. No presets, templates, or "suggested rules" exist.

11. **No sound or audio feedback.** Entirely silent — no click feedback, completion sounds, combo notifications, or boss review tension.

12. **Card pack opening is functional but lacks flair.** No reveal animation, rarity highlight, or excitement building for legendary pulls.

### Minor Gaps (polish items)

13. **Dev console accessible in production.** Useful for testing but should be gated or hidden for normal play.

14. **Storybook coverage.** 20/21 components have stories (missing: `game-container`). Some stories may need updating after scheme deck changes.

15. **Mobile experience.** Bottom nav + department carousel works but may feel cramped for the expanded scheme/operation pipeline.

16. **No statistics or history screen.** Players can't review past quarters, total gold earned across runs, or performance trends.

17. **Villain level/title has minimal gameplay impact.** It's computed from total gold but doesn't unlock anything or provide bonuses.

---

## Part 3: Suggested Improvements

### High Priority (next development cycle)

#### 1. Interactive Tutorial (addresses Gap #1)
A guided first-run experience covering:
- Step 1: "Click a scheme card to start working on it" (highlight a card)
- Step 2: "Complete the scheme to generate operations" (show pipeline)
- Step 3: "Hire a minion to automate department work" (when gold allows)
- Step 4: "Unlock new departments in the shop" (after first quarter)
- Can be a sequence of highlight-and-explain overlays, dismissable

#### 2. Deck Viewer Panel (addresses Gap #2)
A slide-out panel showing:
- Full deck composition (count by tier, by target dept)
- Cards in hand vs in deck vs used
- Deck size growth history
- "Next reshuffle in X cards" indicator

#### 3. Department Mechanic Indicators (addresses Gap #3)
Enhance department column headers/footers:
- **Heists:** Show gold range on each operation card (e.g., "2-12g")
- **Research:** Prominent "Breakthrough: 3/5" progress bar with milestone animation
- **Mayhem:** "Combo: 2/3" with countdown timer, flame animation at 3/3
- **Schemes:** Show "next draw" tier probability based on dept level

#### 4. Meta-Progression System (addresses Gap #4, roadmap Phase D)
Between runs:
- **Infamy Points** earned per run (based on years survived, gold earned, quarters passed)
- **Permanent unlocks:** Starting gold bonus, extra starter deck cards, new jokers in drop pool
- **Hall of Fame:** Best runs displayed

### Medium Priority

#### 5. Operation Pipeline Animation (addresses Gap #7)
When a scheme completes:
- Brief animation showing operations "flying" to target department column
- Sound effect (when audio is added)
- Toast notification: "Scheme completed! 2 Heist operations generated"

#### 6. Smart Minion Suggestions (addresses Gap #9)
- Highlight departments with queued tasks but no workers (pulsing border)
- Show "Recommended" badge on optimal department assignment
- Warning when all minions are idle but tasks are queued

#### 7. Rule Templates (addresses Gap #10)
Pre-built rule presets:
- "Focus Heists" — prioritize heist operations
- "Research Rush" — maximize research completions for breakthroughs
- "Balanced" — distribute minions evenly
- One-click apply, then customize

#### 8. Audio System (addresses Gap #11)
Minimal ambient audio:
- Click feedback (subtle tick)
- Task completion chime (varies by tier)
- Combo activation sound
- Breakthrough "ding"
- Boss review tension music
- Run over dramatic sting

### Lower Priority

#### 9. Deck Growth Strategy Cards
Special scheme cards that modify deck behavior:
- "Purge" — remove a card from deck permanently
- "Upgrade" — promote a Petty card to Sinister
- "Clone" — duplicate a card in deck
Adds deckbuilding depth similar to Slay the Spire

#### 10. Statistics Dashboard (addresses Gap #16)
Between-run stats screen:
- Per-quarter breakdown (gold earned, efficiency rating, tasks completed)
- Department performance comparison
- Best combo streak, highest single-task gold
- Run history with reviewer encounters

#### 11. Dynamic Difficulty / Accessibility
- Easy mode: +50% starting budget, -25% gold targets
- Hard mode: -25% budget, +50% targets, additional boss modifiers
- Speed settings: 0.5×, 1×, 2× game speed

#### 12. Events / Random Encounters
Mid-quarter events that add variety:
- "Black Market Contact" — buy a specific scheme card at premium
- "Inside Job" — next 3 heist operations have guaranteed high rolls
- "Brain Drain" — lose a random minion but gain gold
- Adds narrative variety to the quarterly grind
