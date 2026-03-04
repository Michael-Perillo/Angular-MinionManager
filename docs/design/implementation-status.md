# Minion Manager — Implementation Status Ledger

Last updated: 2026-03-03

This file records the reality snapshot used for documentation reconciliation. It is intentionally operational and timestamped.

## Snapshot Metadata
- Branch: `feature/scouting-dept-unlocks-card-wiring`
- HEAD at snapshot start: `195508e`
- Working tree drift at snapshot start: `35` modified files (non-doc)
- Source policy: committed history plus active WIP considered together

## Timeline (Recent Milestones)
| Commit | Summary |
|---|---|
| `195508e` | Card/joker/rule system and dev-console additions |
| `dc7545b` | Workbench click polish and task UX fixes |
| `45515de` | Voucher shop and between-quarter upgrade loop |
| `baf60e4` | Balance/scoring overhaul and click-based completion |
| `b160628` | Year-end boss review and modifier framework |
| `fe316a3` | Quarterly redesign and queue reordering focus |
| `90e46af` | Progressive department unlock foundations |

## Current Workstream State

### 1) Core Loop (`scout -> route -> execute -> quarter -> automation`)
- Status: `In Progress`
- Notes:
  1. Scouting-driven supply architecture is being integrated.
  2. Legacy assumptions from board-refresh era still appear in adjacent tooling/tests/docs.

### 2) Data Model and Save Schema
- Status: `In Progress`
- Notes:
  1. Model changes (`Minion.role`, scout-task flags, voucher expansion, save v12) are underway.
  2. Migration and downstream consumers must remain aligned with schema changes.

### 3) Automation Rules
- Status: `In Progress`
- Notes:
  1. Card/rule foundations are present.
  2. Role-switch and routing action behavior is still in integration/validation cycle.

### 4) UI Surfaces
- Status: `In Progress`
- Notes:
  1. Rules and collection surfaces exist.
  2. Scouting-first interaction surfaces and role ergonomics are still being finalized.

### 5) Tutorial
- Status: `Planned`
- Notes:
  1. Design and phased plan exist in `tutorial-plan.md`.
  2. Runtime system, persistence, deterministic seed path, and overlay are pending.

## Drift Categories Identified
1. **Model-to-consumer drift**
   - Required model fields and expanded IDs not yet reflected everywhere.
2. **Schema-to-tooling drift**
   - Save format changes need full coverage in dev utilities/stories/tests.
3. **Mechanics-to-UI drift**
   - Service-level behavior shifts require matching interaction surfaces and messaging.
4. **Docs-to-runtime drift**
   - Some docs still describe board-refresh and pre-refactor assumptions.

## Known Blocker Themes (Snapshot)
1. Build/type stability requires completion of model/save/tooling alignment.
2. Core-loop acceptance depends on consistent scouting/event behavior under modifiers.
3. Automation quality depends on conflict-safe routing-vs-assignment context handling.
4. Tutorial cannot start until deterministic hooks and event gating are available.

## Unresolved Deltas to Track
1. Department unlock model migration: hire-based assumptions to voucher-based unlock intent.
2. Scouting accounting behavior in quarter math:
   - Default locked for v1: no quarter credit.
   - Experiment path: budget-only mode for tuning.
3. Role UX parity across desktop and mobile.
4. Transparency surfaces (roadmap preview, VL panel, payout math) not yet complete.

## Definition of “Reconciled” Documentation
Docs are considered reconciled when all are true:
1. `game-design.md` uses explicit status tags (`Implemented`, `In Progress`, `Planned`).
2. `roadmap.md` maps to current execution sequence with entry/exit criteria.
3. `tutorial-plan.md` contains a decision-complete script and delivery phases.
4. This ledger is updated whenever branch status materially changes.

## Update Procedure
When major implementation status changes:
1. Update snapshot metadata.
2. Append or revise milestone timeline.
3. Move systems between `Implemented`, `In Progress`, `Planned`.
4. Reconfirm blocker themes and unresolved deltas.
5. Update linked docs in the same change set.
