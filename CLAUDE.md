# Minion Manager — Project Conventions

## Project Overview

Angular 20 idle/management game. Single-page app deployed to Cloudflare Pages. Players manage an evil organization through a corporate-themed kanban board — hiring minions, completing missions, expanding departments, and climbing the villain ranks.

## Quick Reference Commands

```bash
npm start                    # Dev server on :4200
npm run build                # Production build
npm run test:ci              # Headless unit tests with coverage (Karma + Jasmine, ChromeHeadless)
npm run e2e                  # Playwright end-to-end tests
npm run e2e:headed           # Playwright with visible browser
npm run storybook            # Storybook dev server on :6006
npm run test:storybook       # Run Storybook play() tests with coverage
npm run coverage:check:core  # Check core (models/services) coverage thresholds
npm run coverage:check       # Check merged (Karma + Storybook) coverage thresholds
npm run test:storybook:viewport  # Playwright viewport smoke tests against Storybook
```

Targeted test subsets:
```bash
npm run test:models      # Model unit tests only
npm run test:services    # Service unit tests only
npm run test:components  # Component unit tests only
```

## Architecture

**State management:** Signals-based. `GameStateService` holds all game state via private writable signals, exposed as read-only. Computed signals derive villain level, threat level, idle minions, etc. No RxJS subjects for game state.

**Game loop:** `TimerService` calls `GameStateService.tickTime()` every 1000ms (1 tick/second). Started in `GameContainerComponent.ngOnInit()`.

**Directory structure:**
```
src/app/
├── core/
│   ├── models/       # Data models (task, minion, department, save-data, notoriety, upgrade, resource)
│   └── services/     # Singletons (game-state, timer, save)
├── shared/
│   ├── components/   # Reusable UI components (20+)
│   └── directives/   # Custom directives (tooltip)
└── features/
    └── game/         # Game container orchestrator
```

**Persistence:** `SaveService` saves to `localStorage` key `'minion-manager-save'`. Auto-saves on `beforeunload` and every ~30 ticks.

## Coding Conventions

- **All components are standalone** with `ChangeDetectionStrategy.OnPush`
- **State via Angular signals** — `input.required<T>()`, `input<T>(default)`, `output<T>()`, `computed()` for component I/O
- **TailwindCSS 4 utility classes** for all styling — no separate CSS files per component. Global styles only in `src/styles.scss` (theme variables, animations, scrollbar)
- **Emoji-based iconography** — gold 🪙, notoriety 🔥, departments 🗝️💎🧪💥, minion accessories 🥽⛑️🦹😈. No icon libraries.
- **Drag-and-drop** via Angular CDK (`CdkDropList`, `CdkDrag`, `CdkDragPreview`)
- **Component imports** — each standalone component explicitly declares its dependencies in `imports: [...]`

## Git Workflow

- **Linear commit history** — always rebase onto `main`, never merge. Use `git rebase origin/main` before pushing.
- **Always branch off `main`** — new feature branches start from the latest `main`.
- **Force push after rebase** — use `git push --force-with-lease` to update rebased branches.
- **Run all test suites before committing** — unit tests (`npm run test:ci`), E2E (`npm run e2e`), Storybook build + tests (`npm run build-storybook` then `npx test-storybook`).

## Testing Expectations

### Unit Tests

Karma + Jasmine, `ChromeHeadless`. ~240 tests across models, services, and components.

- Unit tests are for **models, services, and core logic** — pure functions, state management, formulas, game math
- Component behavior testing should use **Storybook `play()` functions** (see CDD section below)
- Existing component unit tests can remain, but new component tests should be Storybook `play()` functions
- `npm run test:ci` runs all existing tests; `npm run test:models` and `npm run test:services` are the primary targeted commands

**Test factories:** `src/testing/factories/` — `makeMinion()`, `makeWorkingMinion()`, `makeCapturedMinion()`, task and game-state factories.

**Test helpers:** `src/testing/helpers/game-test-helpers.ts` — `setupGameWithMinions()`, `completeTaskByClicking()`, `tickUntilComplete()`, `acceptFirstMission()`.

### E2E Tests (Playwright)

**Directory structure:**
```
e2e/
├── specs/                    # Test specifications
│   ├── game.spec.ts               (shared — desktop + mobile)
│   ├── features.spec.ts           (shared — desktop + mobile)
│   ├── drag-drop.spec.ts          (desktop-only)
│   ├── mobile-nav.spec.ts         (mobile-only)
│   └── storybook-viewport.spec.ts (separate config — playwright-storybook.config.ts)
├── pages/                    # Page Object Model
│   ├── navigation.page.ts         (NavigationPage interface + Desktop/Mobile implementations)
│   ├── header.page.ts
│   ├── kanban.page.ts
│   ├── mission-board.page.ts
│   ├── workbench.page.ts
│   ├── hire.page.ts
│   └── game-actions.ts            (composite helper combining header + missionBoard + workbench)
├── fixtures/
│   └── index.ts                   (custom fixtures: nav, header, missionBoard, workbench, hire, kanban, game)
└── tsconfig.json
```

**Dual-project architecture** (defined in `playwright.config.ts`):
- `chromium` (Desktop Chrome) and `mobile-chrome` (Pixel 5)
- Shared specs (`game.spec.ts`, `features.spec.ts`) run on **both** platforms automatically
- Desktop-only: `drag-drop.spec.ts` excluded from mobile via `testIgnore: /drag-drop\.spec/`
- Mobile-only: `mobile-nav.spec.ts` excluded from desktop via `testIgnore: /mobile-nav\.spec/`
- The `nav` fixture auto-provides `DesktopNavigation` or `MobileNavigation` based on project name

**Key patterns for writing specs:**
- `test.skip(nav.isMobile, 'reason')` for conditional skipping within shared specs
- `nav.seedState(overrides)` to inject test state via localStorage (merges with valid v3 `baseSaveData()`)
- `nav.resetGame()` in `beforeEach` to clear state
- Page objects abstract platform differences (e.g., desktop nav is no-op, mobile nav clicks bottom nav buttons)
- `GameActions.earnGold()` for common multi-step flows
- Prefer shared specs (run on both platforms) unless the feature is platform-specific

**Before committing game logic changes:** Run `npm run test:ci`.

## Planning & Verification

Every feature plan must include verification steps across the relevant layers:

**1. Unit tests (models + services only)**
- Run `npm run test:ci` or targeted subset (`test:models`, `test:services`)
- Update existing `*.spec.ts` when modifying model/service behavior
- Add new specs alongside new models and services
- Component behavior → test via Storybook `play()` functions instead (see CDD section)

**2. E2E tests**
- Run `npm run e2e` (both desktop and mobile projects)
- Update existing specs in `e2e/specs/` when changing user-facing behavior
- New features: add cases to shared specs (preferred) or create platform-specific specs
- New page object methods go in `e2e/pages/`, not inline in specs
- Use `npm run e2e:headed` or `npm run e2e:ui` for debugging

**3. Storybook**
- Run `npm run storybook` to verify component rendering after UI changes
- Create stories for new components (see CDD section)
- Update story args when component inputs change
- Add/update `play()` interaction tests for behavioral changes

**4. Spec maintenance rules**
- Shared specs (`game.spec.ts`, `features.spec.ts`) → both platforms (preferred for new tests)
- `drag-drop.spec.ts` → desktop-only
- `mobile-nav.spec.ts` → mobile-only
- Add page object methods to `e2e/pages/` — don't duplicate locator logic in specs

## Component Driven Development

### Storybook Status

- Storybook 10.2.8, `@storybook/angular`
- 20/21 components have stories (missing: `game-container`)
- Hierarchy: `Minion Manager/{Atoms|Molecules|Organisms}/ComponentName`
- All stories use `tags: ['autodocs']`
- Addons: `@storybook/addon-a11y`, `@storybook/addon-docs` (with Compodoc), `@storybook/addon-coverage`
- Interaction testing: `storybook/test` (built-in to SB 10), `@storybook/test-runner` for CI
- Commands: `npm run storybook` (dev :6006), `npm run build-storybook`, `npm run test:storybook`

### CDD Workflow

- When creating new components: write the story first, then implement
- Story file co-located with component: `component-name.stories.ts`
- Always include `tags: ['autodocs']` in meta
- Title format: `'Minion Manager/{Atoms|Molecules|Organisms}/ComponentName'`
- Minimum 2 story variants: default/happy path + edge case
- Use inline factory helpers in story files (NOT `src/testing/factories/` — those depend on Jasmine)
- Add `parameters: { viewport: { defaultViewport: 'mobile1' } }` for mobile-specific variants

### Four Testing Layers

| Layer | Scope | Tool | What it catches |
|-------|-------|------|-----------------|
| Karma unit tests | Models, services, core logic | Karma + Jasmine | Formula correctness, state transitions, pure function behavior |
| Storybook `play()` | Component behavior in isolation | `storybook/test` | Input/output contracts, click handlers, rendering logic, a11y |
| Playwright viewport | Component responsive layout | Playwright against Storybook | Layout breakage at desktop vs mobile widths |
| Playwright e2e | Full integrated gameplay | Playwright against running app | Integration bugs, real game flows, persistence, cross-component interactions |

These four layers are **complementary, not redundant**:
- **Karma** = fast, pure logic (models/services). No DOM, no rendering.
- **Storybook `play()`** = component isolation with mocked inputs. Replaces component unit tests.
- **Playwright viewport** = responsive layout verification against Storybook stories (`e2e/specs/storybook-viewport.spec.ts`).
- **Playwright e2e** = integrated game with real `GameStateService`, timers, persistence.

### Coverage Gates

Split thresholds enforced in CI via `nyc check-coverage`:

| Gate | Scope | Lines | Stmts | Branches | Functions |
|------|-------|-------|-------|----------|-----------|
| **Core** (Karma only) | all instrumented code | 60% | 60% | 45% | 50% |
| **Merged** (Karma + Storybook) | all instrumented code | 60% | 60% | 45% | 50% |

Config files: `.nycrc.json` (merged thresholds), `karma.conf.js` (coverage reporters: html, json, lcovonly).
CI workflow: `unit-tests` → `coverage:check:core`, `storybook-tests` → coverage artifact, `coverage-gate` → merge + check.

### Storybook Testing Conventions

**Interaction testing (`play()` functions):**
- Import from `storybook/test` (built-in to Storybook 10 — no separate install)
- `@storybook/addon-interactions` is built-in to Storybook 10 core
- Write `play()` functions in stories for components with interactive behavior
- Use `userEvent` for clicks/typing, `expect` for assertions, `within` for scoping, `fn()` for output spies
- Run via `@storybook/test-runner` in CI (`npm run test:storybook`)
- Coverage via `@storybook/addon-coverage` (Istanbul instrumentation configured in `.storybook/main.ts`)

**Components with `play()` functions:** mission-board (sort cycling + card verification), drawer-panel (tab switching), notification-toast (rendering), hire-minion-panel (recruit button), mission-router (queue selection with `fn()` spy), mobile-bottom-nav (tab output with `fn()` spy), header (stat rendering), kanban-board (column + workbench verification), department-column (minion/queue rendering), player-workbench (click output with `fn()` spy), notoriety-bar (raid warning).

**Viewport smoke tests:**
- Playwright specs in `e2e/specs/storybook-viewport.spec.ts`
- Separate config: `playwright-storybook.config.ts` (targets Storybook on :6006)
- Run: `npm run test:storybook:viewport`
- Tests: kanban-board, mission-board, drawer-panel, mobile-bottom-nav, mission-router at desktop (1280x720) and mobile (393x851) viewports

**Note:** Vitest addon unsupported for Angular/webpack — `@storybook/test-runner` (Jest+Playwright) is the path until Storybook adds Angular+Vite builder support.

**Next steps:**
5. Evaluate Chromatic for visual regression if manual review becomes burdensome

## Save Data Protocol

Save format is versioned. Current version tracked by `CURRENT_VERSION` in `src/app/core/services/save.service.ts`.

**When changing save format:**
1. Bump `CURRENT_VERSION` in `save.service.ts`
2. Update the `SaveData` interface
3. Add a migration in `src/app/core/services/save.service.ts` (migrations are cumulative — check `version < X`)
4. Ensure backward compatibility with older saves

**Migration history:** v1→v2 added `capturedMinions`, v2→v3 added kanban queues (`departmentQueues`, `playerQueue`) + `resources` + minion `assignedDepartment`.

## Key Files

| File | Purpose |
|------|---------|
| `src/app/features/game/game-container.component.ts` | Main UI orchestrator — wires game state to all child components |
| `src/app/core/services/game-state.service.ts` | Central state (1200+ lines) — all game logic, signals, tick processing |
| `src/app/core/services/timer.service.ts` | Game loop — 1s interval driving `tickTime()` |
| `src/app/core/services/save.service.ts` | localStorage persistence with version migrations |
| `src/app/core/models/task.model.ts` | Task types, tiers, categories, TIER_CONFIG |
| `src/app/core/models/task-pool.ts` | 60 mission templates (+ 4 cover-tracks templates in game-state.service) |
| `src/app/core/models/minion.model.ts` | Minion stats, XP/leveling, names, appearances, specialties |
| `src/app/core/models/department.model.ts` | Department types, XP/levels, tier gating, passive abilities |
| `src/app/core/models/notoriety.model.ts` | Threat levels, gold penalty curve, bribe costs, raid triggers |
| `src/app/core/models/upgrade.model.ts` | 10 upgrades with cost formulas and scaling |
| `src/app/core/models/save-data.model.ts` | Save format interface with version tracking |
| `src/styles.scss` | Global theme — Tailwind config, color palette, all CSS animations |

## Gotchas

- **Timer drives everything** — `TimerService` must be started for any game progression. All state changes flow through `tickTime()`.
- **Department unlock persists** — once a department is unlocked (by hiring a minion for it), it stays unlocked even if that minion is lost.
- **Task tier gating** — departments only receive missions for tiers they've unlocked (level 1–2: petty, 3–4: +sinister, 5–7: +diabolical, 8+: +legendary).
- **Notoriety penalty is nonlinear** — 0% penalty below 35, then linear to 30% at 100. Raids trigger at 60+ notoriety.
- **Special Operations expire** — 30-second window to accept before they vanish from the board.
- **Captured minions expire** — 5 minutes in prison, then permanently lost if not rescued via breakout mission.
- **Gold formula has many multipliers** — base × villain level bonus × minion efficiency × heists passive × notoriety penalty. All must be accounted for in balance changes.
- **Save migrations are cumulative** — each migration checks `version < X`, so new migrations must handle all prior versions.
