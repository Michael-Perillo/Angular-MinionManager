# Minion Manager — v1 Implementation Roadmap

Last updated: 2026-03-03

This roadmap is the execution document for the v1 vertical slice and documentation reconciliation workstream.

## v1 Objective
Ship a stable, testable loop:
`scout -> route -> execute -> quarter progression -> basic automation`

## Success Criteria
1. Build/type checks pass.
2. Core loop is fully playable without hidden supply mechanics.
3. Automation is useful by Year 1 Quarter 3.
4. Tutorial is first-run, skippable, replayable, and deterministic.
5. Documentation is synchronized with repo reality and known blockers.

---

## Phase 0 — Baseline Stability

### Goal
Eliminate compile/type and schema drift blockers before extending behavior.

### Entry Criteria
1. Active branch contains mixed committed + WIP deltas.
2. Build/type failures exist from model and save-schema shifts.

### Work
1. Resolve regressions from required `Minion.role` across stories/specs/dev tooling.
2. Resolve regressions from expanded voucher IDs.
3. Resolve Save v12 field drift (`lastBoardRefresh` removal, new scout/task state handling).
4. Remove stale board-refresh-era references in support files.

### Exit Criteria
1. `ng build` passes.
2. `npx tsc -p tsconfig.app.json --noEmit` passes.
3. Core test suites covering touched models/services are updated and passing.

---

## Phase 1 — Scouting Loop Completion

### Goal
Make scouting the canonical mission intake path.

### Entry Criteria
1. Baseline stability gate is green.
2. Scouting primitives exist but are not fully validated end-to-end.

### Work
1. Keep mission generation scouting-driven; no passive timed board refill.
2. Finalize manual workbench scouting path (`scoutClick`, progress, mission spawn, feedback).
3. Finalize scout minion task path (spawn mission, no direct gold/xp payout, release scout).
4. Enforce Intel Blackout across all scouting pathways.
5. Ensure `TaskScouted` and `BacklogLow` events are consistently emitted and consumed.

### Exit Criteria
1. Manual scouting produces board supply reliably.
2. Scout minions produce board supply reliably.
3. Blackout state blocks scouting behavior deterministically.
4. Event-based tests for scouting triggers are green.

---

## Phase 2 — Rule and Role Automation Completion

### Goal
Make automation coherent for assignment, routing, and role changes.

### Entry Criteria
1. Scouting loop is functional.
2. Rule engine can evaluate baseline actions.

### Work
1. Complete rule engine support for backlog/queue/role conditions.
2. Complete role switch and route actions.
3. Keep `defaultAutoAssign` fallback only for automation-disabled modifier states.
4. Centralize side-effect execution via `executeRuleActions`.
5. Ensure routing rules evaluate task context; assignment rules evaluate idle minion context.

### Exit Criteria
1. No rule-action context collisions between routing and assignment paths.
2. Role-switch rules operate only on valid minion states.
3. Automation-disabled modifier always falls back to default behavior.
4. Rule engine tests cover new trigger/condition/action matrix.

---

## Phase 3 — Core UI Completion

### Goal
Expose the new loop clearly on desktop and mobile.

### Entry Criteria
1. Core mechanics from Phases 1-2 are stable in services.

### Work
1. Complete scout/worker operational surfaces in workbench, department columns, kanban, and container wiring.
2. Finalize mission board empty/blackout messaging for scouting-first flow.
3. Finalize shop grouping: Departments, Upgrades, Card Packs with dynamic max-level display.
4. Ensure mobile parity for role/dept/scouting actions without desktop-only assumptions.

### Exit Criteria
1. Desktop and mobile both support full core loop.
2. Players can understand supply state from empty/blackout messaging.
3. Shop layout reflects unlock-first progression clearly.

---

## Phase 4 — Balance Overhaul: Transparent Base x Mult Economy

### Goal
Make the economy transparent and head-mathable. Every number is discrete, visible, and easy to reason about.

### Entry Criteria
1. Core mechanics and UI are functional.

### Work (6 stages)
1. **Gold formula + dept simplification:** New TIER_CONFIG (2/5/12/30 base gold), integer additive mult (+1/dept level, +1 specialty, +1 special op, +N joker). Remove VL scaling and dept passives.
2. **Scouting budget + tier gating:** Each scout costs 1 budget (instant), board pre-seeded with 6 tasks at quarter start. Per-department tier unlocking as gold sinks (Sinister 15g, Diabolical 80g, Legendary 300g).
3. **Joker conversion:** All jokers use integer additive mult values (+1, +2, +3). Remove percentage-based joker effects.
4. **Voucher rebalance:** Remove rapid-intel/scout-expansion. Year-scaled costs (×year). Show 3 random vouchers per shop visit. Flatten minion cost curve (1.6→1.5).
5. **Quarter targets + efficiency:** Rebalanced targets for new base gold. Par system: budget remaining determines card pack quality. Leftover budget bonus (+1g per unspent).
6. **Save migration + tests:** Bump save version, add migration for dept tier unlocks and stripped vouchers.

### Exit Criteria
1. Gold formula is transparent: Base x Mult with integer additive bonuses.
2. All joker/voucher/dept effects are discrete integers.
3. Scouting creates meaningful budget tension.
4. Quarter targets are tuned for new economy.
5. All test suites pass.

---

## Phase 5 — v1 Bug and UX Cleanup

### Goal
Address high-impact clarity and defect issues before release.

### Entry Criteria
1. Features and balance behavior are complete enough for final polish.

### Work
1. Remove redundant tier badges on department cards.
2. Improve readability for dense states and warning states.
3. Defer broad redesign work that is not required for v1 loop quality.

### Exit Criteria
1. Known high-impact UX defects in v1 scope are resolved.
2. No new regressions in core loop behavior.

---

## Phase 6 — Release Validation

### Goal
Ship only when technical and gameplay acceptance gates are met.

### Entry Criteria
1. All previous phases marked complete.

### Work
1. Execute full quality gate.
2. Execute deterministic tutorial path validation.
3. Execute scripted manual playthrough from fresh run.

### Exit Criteria
1. Build/type checks pass.
2. Core tests for scouting/routing/roles/rules/save migration pass.
3. Tutorial deterministic path passes.
4. Manual flow passes:
`fresh run -> tutorial completion -> quarter flow -> first useful rule -> review transition`.

---

## Parallel Track — Tutorial Delivery

### T0 Spec and Script Authoring
Entry:
1. v1 loop defined.

Work:
1. Author `tutorial-plan.md` step table and copy architecture.
2. Define skip/replay behavior and persistence semantics.

Exit:
1. Step-by-step mechanical and narrative script approved.

### T1 Runtime Tutorial State
Entry:
1. T0 complete.

Work:
1. Add tutorial progression model and service API.
2. Add save fields for tutorial activity/completion/skips.
3. Wire first-run start and replay entrypoint.

Exit:
1. Tutorial state survives reload and run transitions.

### T2 Seeded Determinism Layer
Entry:
1. T1 complete.

Work:
1. Implement targeted tutorial script overrides for RNG-sensitive beats.
2. Force deterministic outcomes for first mission, first hire candidates, first reward choices.

Exit:
1. Tutorial path is reproducible by seed/config.

### T3 Overlay and Guidance UI
Entry:
1. T2 complete.

Work:
1. Add guided overlay with anchors, directive copy, skip/next controls.
2. Gate progression off explicit gameplay events and state checks.

Exit:
1. First-run tutorial can be completed start-to-finish in production UI.

### T4 Validation and Tuning
Entry:
1. T3 complete.

Work:
1. Add deterministic tutorial E2E coverage.
2. Add stories for overlay states and blocked states.
3. Tune pacing and text after playtests.

Exit:
1. Tutorial meets acceptance criteria and passes deterministic test path.

---

## Non-goals for this Roadmap Window
1. Full menu-system redesign.
2. Full notification/toast visual overhaul.
3. Large speculative feature additions outside the v1 loop.
