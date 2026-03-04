# Minion Manager — Tutorial Plan (v1)

Last updated: 2026-03-03

## Purpose
Define the first-run guided tutorial as a mechanically reliable and thematically consistent onboarding path for the v1 vertical slice.

## Experience Contract
1. Tutorial starts automatically on first fresh run.
2. Tutorial is skippable at every step.
3. Tutorial is replayable from menu/help.
4. Tutorial text uses in-world corporate-villain manager satire.
5. Tutorial-critical outcomes are deterministic via seed/scripted overrides.

## Player Outcome Goals
By tutorial completion, a player must be able to:
1. Explain quarter success criteria (task budget + gross gold target).
2. Generate mission supply through scouting.
3. Route and complete missions manually.
4. Understand minion roles (`worker` vs `scout`).
5. Build and observe one useful automation rule.
6. Understand quarter pass/miss and review pressure escalation.

---

## Step Architecture

### Event/State Gating Model
Each step includes:
1. Trigger condition.
2. Required player action.
3. Success condition.
4. Timeout/fail nudge behavior.
5. Anchored UI target.
6. Copy IDs for `Directive`, `Rationale`, `Outcome`.

### Step Table

| Step ID | Trigger | Required Action | Success Condition | Fail/Timeout Handling | UI Anchor | Copy IDs |
|---|---|---|---|---|---|---|
| `TUT_01_ORIENTATION` | First fresh run initialized | Read/acknowledge intro | Player clicks `Continue` | Nudge after 20s | Quarter HUD | `tut.01.directive`, `tut.01.rationale`, `tut.01.outcome` |
| `TUT_02_SCOUT_INTEL` | Step 1 complete | Use workbench scout action | First `TaskScouted` from workbench | Highlight scout control every 15s | Workbench scout panel | `tut.02.*` |
| `TUT_03_ROUTE_MISSION` | Step 2 complete | Route discovered mission to player queue | Mission appears in player queue | Highlight route affordance | Mission board + router | `tut.03.*` |
| `TUT_04_MANUAL_COMPLETE` | Step 3 complete | Click-complete routed task | Task completion event + gold gain | Pulse task card until complete | Player workbench task card | `tut.04.*` |
| `TUT_05_REPEAT_CAPACITY` | Step 4 complete | Repeat scout-route-complete once | Second completion + backlog explanation shown | Remind queue and board counts | Board/queue counters | `tut.05.*` |
| `TUT_06_SHOP_MOMENT` | Quarter checkpoint modal path | Buy first department unlock voucher | Unlock voucher level increases | Highlight cheapest unlock option | Shop modal | `tut.06.*` |
| `TUT_07_HIRE_MOMENT` | Step 6 complete | Hire first minion | Minion count increases | Highlight recruit CTA | Hire panel | `tut.07.*` |
| `TUT_08_ROLE_ASSIGN` | Step 7 complete | Set a scout and a worker role | At least one minion each role (or role explanation fallback) | Suggest default split | Department/roster role controls | `tut.08.*` |
| `TUT_09_FIRST_RULE` | Step 8 complete | Create one practical rule | New non-default rule saved | Highlight minimal card combo | Rule editor | `tut.09.*` |
| `TUT_10_AUTONOMY_CHECK` | Step 9 complete | Observe automation effect | Automation action executed at least once | Explain fallback/default if disabled | Kanban + rule summary | `tut.10.*` |
| `TUT_11_QUARTER_REVIEW` | First quarter result shown | Advance through result modal | Player acknowledges pass/miss implications | Show missed-quarter warning if relevant | Quarter review modal | `tut.11.*` |

---

## Thematic Script Style

### Voice
- Framing: "Corporate onboarding memo for newly promoted villain manager."
- Tone: dry, directive, KPI-focused, satirical.
- Length: short, scannable lines.

### Message Pattern Per Step
1. `Directive`: what to do now.
2. `Rationale`: why operations require it.
3. `Outcome`: what changed and how to read it.

### Sample Pattern
- Directive: "Acquire intelligence. Click Scout Intel now."
- Rationale: "No intel, no tasks. No tasks, no quarterly bonus."
- Outcome: "Mission board updated. Route discovered work to execution."

### Failure/Nudge Tone
- Use compliance-style nudges, not punitive alarms.
- Example style: "Reminder: strategic inactivity is still inactivity."

---

## Determinism and Seeding Plan

### Tutorial Seed Contract
1. Tutorial mode runs under a fixed seed (default internal seed for first-run path).
2. Dev/test can force tutorial seed via explicit config/debug hook.
3. Determinism targets only tutorial-critical outcomes, not full-run RNG replacement.

### Deterministic Targets
1. First discovered mission profile.
2. Early hire candidate set.
3. First tutorial reward/choice surfaces used in script.

### Fallback Rule
If deterministic constraints cannot be met by normal generation:
1. Apply scripted override for the current tutorial step.
2. Emit diagnostic event for test traceability.

---

## Runtime and Persistence Design

### Tutorial Runtime State
Required fields:
1. `active`: boolean.
2. `completed`: boolean.
3. `skipped`: boolean.
4. `currentStepId`: enum/string.
5. `stepStartedAt`: timestamp.
6. `seed`: number/string.

### Save Integration Requirements
Persist tutorial state across reloads:
1. Active progression state.
2. Completion and skip state.
3. Seed used for current tutorial run.

### Entry/Replay Rules
1. Auto-start only on true fresh run with no completed tutorial flag.
2. Replay allowed from menu/help without resetting full player profile by default.
3. Replay uses deterministic seed path unless user explicitly chooses freeform.

---

## Implementation Phases

### T0 — Spec and Script Authoring
Deliver:
1. This document plus copy ID registry.
2. Step gating matrix validated against existing UI anchors.

Exit:
1. No ambiguous step transitions remain.

### T1 — Runtime Tutorial State
Deliver:
1. Tutorial state model and service API.
2. Save schema integration for tutorial flags/progress.
3. First-run start + replay entrypoint wiring.

Exit:
1. Tutorial progression survives reload and app restart.

### T2 — Seeded Determinism Layer
Deliver:
1. Deterministic overrides for tutorial-critical randomness.
2. Dev/test forcing mechanism for tutorial seed.

Exit:
1. Tutorial run is reproducible in automated tests.

### T3 — Overlay and Guidance UI
Deliver:
1. Guided overlay component (spotlight, directive text, controls).
2. Per-step event/state gating.
3. In-world copy integration.

Exit:
1. End-to-end first-run guided completion path works in UI.

### T4 — Validation and Tuning
Deliver:
1. Deterministic tutorial E2E path.
2. Story scenarios for overlay states and blocked states.
3. Copy/pacing tuning pass.

Exit:
1. Tutorial acceptance checks pass and no gating dead-ends remain.

---

## Telemetry and QA Requirements

### Tutorial Events
Emit structured events for:
1. `tutorial_started`
2. `tutorial_step_started`
3. `tutorial_step_completed`
4. `tutorial_step_timeout_nudge`
5. `tutorial_skipped`
6. `tutorial_completed`

### QA Scenarios
1. Fresh-run full completion.
2. Skip at each step and continue core game.
3. Replay from menu/help.
4. Save/reload during each major step.
5. Deterministic seed replay parity.
6. Modifier edge case (automation disabled during tutorial-adjacent quarter flow).

---

## Acceptance Criteria
1. First-run tutorial always starts in valid conditions.
2. Tutorial can be completed without deadlocks.
3. Skip and replay behaviors are consistent.
4. Deterministic tutorial E2E test is green.
5. Players can demonstrate the v1 loop after tutorial completion.
