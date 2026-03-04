import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { Task, TaskCategory, TaskTier, ComboState, createDefaultComboState, previewComboBonus } from '../../../core/models';
import { Department } from '../../../core/models/department.model';
import { TierBadgeComponent } from '../tier-badge/tier-badge.component';

@Component({
  selector: 'app-mission-board',
  standalone: true,
  imports: [TierBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-2 h-full">
      <div class="flex items-center justify-between shrink-0">
        <h2 class="text-sm font-bold text-text-primary font-display uppercase tracking-wider">
          Backlog
        </h2>
        <div class="flex items-center gap-2">
          <button
            (click)="cycleSort()"
            class="text-xs text-text-muted hover:text-text-secondary cursor-pointer
                   px-1.5 py-0.5 rounded border border-transparent hover:border-border transition-colors"
            [title]="'Sort: ' + sortLabel()">
            {{ sortIcon() }} {{ sortLabel() }}
          </button>
          <span class="text-xs text-text-muted">
            {{ missions().length }}
          </span>
        </div>
      </div>

      @if (boardFrozen()) {
        <div class="w-full py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider text-center
                    bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Intel Blackout — Backlog reduced to 1
        </div>
      }

      @if (missions().length === 0) {
        <div class="game-card p-6 text-center">
          <p class="text-text-muted text-xs">📂 Deck empty — no schemes available</p>
        </div>
      } @else {
        <!-- Category filter tabs -->
        <div class="flex gap-1 flex-wrap shrink-0">
          <button
            (click)="filterCategory.set(null)"
            class="px-2 py-1 text-xs rounded cursor-pointer transition-colors"
            [class]="filterCategory() === null ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:text-text-secondary'">
            All
          </button>
          @for (cat of categories(); track cat.key) {
            @if (isFilterUnlocked(cat.key)) {
              <button
                (click)="filterCategory.set(cat.key)"
                class="px-1.5 py-1 text-xs rounded cursor-pointer transition-colors"
                [class]="filterCategory() === cat.key ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:text-text-secondary'">
                {{ cat.icon }}
              </button>
            } @else {
              <span
                class="px-1.5 py-1 text-xs rounded text-text-muted/40 cursor-default"
                title="Reach dept level 2 to unlock this filter">
                🔒
              </span>
            }
          }
        </div>

        <!-- Combo tracker -->
        @if (hasActiveCombo()) {
          <div class="flex gap-2 flex-wrap shrink-0 px-1" data-testid="combo-tracker">
            @if (currentFocusBonus() > 0) {
              <span class="text-xs px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/20 font-semibold">
                🎯 Focus: {{ getCategoryIcon(comboState().deptFocus.dept!) }}
                ×{{ comboState().deptFocus.count }}
                (+{{ currentFocusBonus() }})
              </span>
            }
            @if (currentLadderBonus() > 0) {
              <span class="text-xs px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/20 font-semibold">
                📈 Ladder ×{{ comboState().tierLadder.step }}
                (+{{ currentLadderBonus() }})
              </span>
            }
          </div>
        }

        <!-- Mission list (scrollable) -->
        <div class="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
          @for (mission of filteredMissions(); track mission.id) {
            <div
              class="game-card p-3 flex flex-col gap-2"
              [class]="getMissionCardClass(mission) + ' ' + getExitAnimClass(mission.id)">
              <!-- Header -->
              <div class="flex items-start justify-between gap-1">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1 mb-0.5 flex-wrap">
                    <span class="text-sm">{{ getTargetDeptIcon(mission) }}</span>
                    <app-tier-badge [tier]="mission.tier" />
                    @if (mission.isSpecialOp) {
                      <span class="text-xs px-1 py-0.5 rounded-full bg-gold/20 text-gold font-bold uppercase">
                        Special
                      </span>
                    }
                  </div>
                  <h3 class="text-xs font-semibold text-text-primary truncate">
                    {{ mission.template.name }}
                  </h3>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-xs text-gold font-bold tabular-nums">{{ mission.goldReward }}g</div>
                  @if (getComboPreview(mission).totalComboMult > 0) {
                    <div class="text-[9px] text-accent tabular-nums" data-testid="combo-gold-preview">ops +{{ getComboPreview(mission).totalComboMult }} mult</div>
                  }
                </div>
              </div>

              <!-- Operation preview -->
              <div class="flex items-center gap-1 text-xs text-text-secondary">
                <span>→ {{ getOpCount(mission) }}×</span>
                <span>{{ getTargetDeptIcon(mission) }}</span>
                <span class="text-text-muted">{{ getTargetDeptLabel(mission) }} ops</span>
              </div>

              <!-- Info -->
              <div class="flex items-center justify-between text-xs text-text-muted">
                <span>{{ mission.clicksRequired }} clicks</span>
                @if (mission.isSpecialOp) {
                  <span class="text-gold">+1 mult</span>
                }
              </div>

              <!-- Action buttons -->
              <div class="flex gap-1">
                @if (canAccept() && !exitingCards().has(mission.id)) {
                  <button
                    (click)="onSendToQueue(mission); $event.stopPropagation()"
                    class="flex-1 py-1.5 px-2 rounded text-xs font-bold uppercase tracking-wider
                           bg-accent/10 text-accent border border-accent/20
                           hover:bg-accent/20 active:scale-95
                           transition-all cursor-pointer min-h-[36px]">
                    Execute ▶
                  </button>
                } @else if (!exitingCards().has(mission.id)) {
                  <div class="flex-1 text-xs text-amber-400 font-semibold text-center py-1.5 bg-amber-500/10 rounded border border-amber-500/20">
                    Schemes queue full
                  </div>
                }
                @if (!exitingCards().has(mission.id)) {
                  <button
                    (click)="onDismiss(mission); $event.stopPropagation()"
                    [disabled]="dismissalsRemaining() <= 0"
                    class="py-1.5 px-2 rounded text-xs font-bold uppercase tracking-wider
                           bg-red-500/10 text-red-400 border border-red-500/20
                           hover:bg-red-500/20 active:scale-95
                           transition-all cursor-pointer min-h-[36px]
                           disabled:opacity-40 disabled:cursor-not-allowed"
                    [title]="dismissalsRemaining() > 0 ? 'Dismiss and draw new' : 'No dismissals left'">
                    ✕
                  </button>
                }
              </div>

            </div>
          }
        </div>
      }

      <!-- Budget / Deck / Dismissals footer -->
      <div class="flex items-center justify-between px-2 py-2 border-t border-border/50 text-xs text-text-muted shrink-0">
        <span>Budget: {{ tasksCompleted() }}/{{ taskBudget() }}</span>
        <button
          (click)="showDeckBreakdown.set(!showDeckBreakdown())"
          class="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer
                 hover:text-text-secondary hover:bg-bg-card transition-colors"
          [class]="showDeckBreakdown() ? 'text-accent' : 'text-text-muted'">
          🃏 {{ deckRemaining() }}/{{ deckTotal() }}
          <span class="text-[10px]">{{ showDeckBreakdown() ? '▲' : '▼' }}</span>
        </button>
        <span>Dismissals: {{ dismissalsRemaining() }}/5</span>
      </div>

      <!-- Tier breakdown panel -->
      @if (showDeckBreakdown()) {
        <div class="px-2 pb-2 animate-slide-down shrink-0">
          <div class="rounded-lg bg-bg-card/50 border border-border/30 p-2 flex flex-col gap-1.5">
            @for (tier of tierOrder; track tier) {
              <div class="flex items-center gap-2 text-xs">
                <span class="w-16 capitalize" [class]="tierTextClass(tier)">{{ tier }}</span>
                <div class="flex-1 h-2 rounded-full bg-bg-primary/50 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    [class]="tierBarClass(tier)"
                    [style.width]="tierBarWidth(tier)">
                  </div>
                </div>
                <span class="w-4 text-right text-text-muted">{{ getTierCount(tier) }}</span>
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class MissionBoardComponent {
  missions = input.required<Task[]>();
  schemesQueueFull = input<boolean>(false);
  boardFrozen = input<boolean>(false);
  dismissalsRemaining = input<number>(5);
  tasksCompleted = input<number>(0);
  taskBudget = input<number>(25);
  missionAccepted = output<string>();
  schemeExecuted = output<string>();
  schemeDismissed = output<string>();
  unlockedDepartments = input<TaskCategory[]>([]);
  departments = input<Record<TaskCategory, Department>>({} as Record<TaskCategory, Department>);
  deckRemaining = input<number>(0);
  deckTotal = input<number>(30);
  deckTierCounts = input<Record<TaskTier, number>>({ petty: 0, sinister: 0, diabolical: 0, legendary: 0 });
  comboState = input<ComboState>(createDefaultComboState());

  filterCategory = signal<string | null>(null);
  showDeckBreakdown = signal(false);
  exitingCards = signal(new Map<string, 'dismiss' | 'execute'>());

  readonly sortModes = ['default', 'tier', 'gold', 'clicks'] as const;
  readonly sortIndex = signal(0);
  readonly sortMode = computed(() => this.sortModes[this.sortIndex()]);
  readonly sortLabel = computed(() => {
    switch (this.sortMode()) {
      case 'default': return 'Default';
      case 'tier': return 'Tier';
      case 'gold': return 'Gold';
      case 'clicks': return 'Clicks';
    }
  });
  readonly sortIcon = computed(() => {
    switch (this.sortMode()) {
      case 'default': return '↕';
      case 'tier': return '⭐';
      case 'gold': return '🪙';
      case 'clicks': return '👆';
    }
  });

  readonly allCategories = [
    { key: 'heists', label: 'Heists', icon: '💎' },
    { key: 'research', label: 'Research', icon: '🧪' },
    { key: 'mayhem', label: 'Mayhem', icon: '💥' },
  ];

  categories = computed(() => {
    const unlocked = this.unlockedDepartments();
    if (unlocked.length === 0) return this.allCategories;
    return this.allCategories.filter(c => unlocked.includes(c.key as TaskCategory));
  });

  canAccept = computed(() =>
    !this.schemesQueueFull()
  );

  private readonly TIER_RANK: Record<string, number> = {
    petty: 1, sinister: 2, diabolical: 3, legendary: 4,
  };

  filteredMissions = computed(() => {
    let result = this.missions();
    if (this.filterCategory()) {
      result = result.filter(m => this.getTargetDept(m) === this.filterCategory());
    }
    const mode = this.sortMode();
    if (mode === 'default') return result;
    return [...result].sort((a, b) => {
      switch (mode) {
        case 'tier':
          return (this.TIER_RANK[b.tier] ?? 0) - (this.TIER_RANK[a.tier] ?? 0);
        case 'gold':
          return (b.goldReward ?? 0) - (a.goldReward ?? 0);
        case 'clicks':
          return a.clicksRequired - b.clicksRequired;
        default:
          return 0;
      }
    });
  });

  categoryCount(category: string): number {
    return this.missions().filter(m => m.template.category === category).length;
  }

  getMissionCardClass(mission: Task): string {
    if (mission.isSpecialOp) return 'border-gold/40 animate-card-glow';
    return '';
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'schemes': return '🗝️';
      case 'heists': return '💎';
      case 'research': return '🧪';
      case 'mayhem': return '💥';
      default: return '?';
    }
  }

  cycleSort(): void {
    this.sortIndex.update(i => (i + 1) % this.sortModes.length);
  }

  isFilterUnlocked(catKey: string): boolean {
    const depts = this.departments();
    if (!depts || !depts[catKey as TaskCategory]) return true;
    return depts[catKey as TaskCategory].level >= 2;
  }

  onSendToQueue(mission: Task): void {
    if (this.exitingCards().has(mission.id)) return;
    this.exitingCards.update(m => new Map(m).set(mission.id, 'execute'));
    setTimeout(() => {
      this.exitingCards.update(m => { const n = new Map(m); n.delete(mission.id); return n; });
      this.schemeExecuted.emit(mission.id);
    }, 350);
  }

  onDismiss(mission: Task): void {
    if (this.exitingCards().has(mission.id)) return;
    this.exitingCards.update(m => new Map(m).set(mission.id, 'dismiss'));
    setTimeout(() => {
      this.exitingCards.update(m => { const n = new Map(m); n.delete(mission.id); return n; });
      this.schemeDismissed.emit(mission.id);
    }, 350);
  }

  getExitAnimClass(missionId: string): string {
    const type = this.exitingCards().get(missionId);
    if (type === 'dismiss') return 'animate-card-dismiss';
    if (type === 'execute') return 'animate-card-execute';
    return '';
  }

  /** Get target department key from scheme task metadata */
  getTargetDept(mission: Task): string | null {
    return mission.schemeTargetDept ?? null;
  }

  /** Get the icon for the scheme's target execution department */
  getTargetDeptIcon(mission: Task): string {
    const dept = mission.schemeTargetDept;
    return dept ? this.getCategoryIcon(dept) : '🗝️';
  }

  /** Get the operation count from a scheme task */
  getOpCount(mission: Task): number {
    return mission.schemeOperationCount ?? 0;
  }

  /** Get the target dept label from a scheme task */
  getTargetDeptLabel(mission: Task): string {
    if (!mission.schemeTargetDept) return '';
    return mission.schemeTargetDept.charAt(0).toUpperCase() + mission.schemeTargetDept.slice(1);
  }

  // ─── Deck breakdown helpers ─────────────
  readonly tierOrder: TaskTier[] = ['petty', 'sinister', 'diabolical', 'legendary'];

  getTierCount(tier: TaskTier): number {
    return this.deckTierCounts()[tier];
  }

  tierBarWidth(tier: TaskTier): string {
    const total = this.deckTotal();
    if (total === 0) return '0%';
    return Math.round((this.getTierCount(tier) / total) * 100) + '%';
  }

  tierTextClass(tier: TaskTier): string {
    switch (tier) {
      case 'petty': return 'text-tier-petty';
      case 'sinister': return 'text-tier-sinister';
      case 'diabolical': return 'text-tier-diabolical';
      case 'legendary': return 'text-gold';
    }
  }

  tierBarClass(tier: TaskTier): string {
    switch (tier) {
      case 'petty': return 'bg-tier-petty';
      case 'sinister': return 'bg-tier-sinister';
      case 'diabolical': return 'bg-tier-diabolical';
      case 'legendary': return 'bg-gold';
    }
  }

  // ─── Combo helpers ─────────────
  hasActiveCombo(): boolean {
    const cs = this.comboState();
    return cs.deptFocus.count >= 2 || cs.tierLadder.step >= 2;
  }

  currentFocusBonus(): number {
    const cs = this.comboState();
    if (cs.deptFocus.count < 2) return 0;
    return Math.min(cs.deptFocus.count - 1, 4);
  }

  currentLadderBonus(): number {
    const cs = this.comboState();
    if (cs.tierLadder.step < 2) return 0;
    const BONUS: Record<number, number> = { 2: 2, 3: 5, 4: 10 };
    return BONUS[Math.min(cs.tierLadder.step, 4)] ?? 0;
  }

  getComboPreview(mission: Task): { deptFocusBonus: number; tierEscalationBonus: number; totalComboMult: number } {
    if (!mission.schemeTargetDept) return { deptFocusBonus: 0, tierEscalationBonus: 0, totalComboMult: 0 };
    return previewComboBonus(this.comboState(), mission.schemeTargetDept, mission.tier);
  }
}
