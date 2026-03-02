import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragPreview } from '@angular/cdk/drag-drop';
import { Task, QueueTarget, TaskCategory } from '../../../core/models';
import { Department } from '../../../core/models/department.model';
import { TierBadgeComponent } from '../tier-badge/tier-badge.component';

@Component({
  selector: 'app-mission-board',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragPreview, TierBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-2 h-full">
      <div class="flex items-center justify-between shrink-0">
        <h2 class="text-sm font-bold text-text-primary font-display uppercase tracking-wider">
          Mission Board
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
                    bg-red-500/10 text-red-400 border border-red-500/20">
          🚫 Board Frozen
        </div>
      }

      @if (missions().length === 0) {
        <div class="game-card p-6 text-center">
          <p class="text-text-muted text-xs">No missions available...</p>
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

        <!-- Mission list (scrollable, drop list source) -->
        <div
          class="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0"
          cdkDropList
          id="mission-board"
          [cdkDropListData]="'mission-board'"
          [cdkDropListConnectedTo]="connectedDropLists()"
          cdkDropListSortingDisabled>
          @for (mission of filteredMissions(); track mission.id) {
            <div
              class="game-card p-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing"
              [class]="getMissionCardClass(mission)"
              cdkDrag
              [cdkDragData]="mission"
              [cdkDragDisabled]="dragDisabled()">
              <!-- Header -->
              <div class="flex items-start justify-between gap-1">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1 mb-0.5 flex-wrap">
                    <span class="text-sm">{{ getCategoryIcon(mission.template.category) }}</span>
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
                <span class="text-gold font-bold text-xs shrink-0">{{ mission.goldReward }}g</span>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-between text-xs text-text-muted">
                <span>{{ mission.clicksRequired }} clicks</span>
                @if (mission.isSpecialOp) {
                  <span class="text-gold">Expires soon</span>
                }
              </div>

              <!-- Send to queue button -->
              @if (canAccept()) {
                <button
                  (click)="onSendToQueue(mission); $event.stopPropagation()"
                  class="w-full py-1.5 px-2 rounded text-xs font-bold uppercase tracking-wider
                         bg-accent/10 text-accent border border-accent/20
                         hover:bg-accent/20 active:scale-95
                         transition-all cursor-pointer min-h-[36px]">
                  Send to Queue ▶
                </button>
              } @else {
                <div class="text-xs text-amber-400 font-semibold text-center py-1.5 bg-amber-500/10 rounded border border-amber-500/20">
                  Queue slots full
                </div>
              }

              <!-- Drag preview -->
              <div *cdkDragPreview class="game-card p-2 w-[200px] opacity-90 shadow-lg shadow-accent/20">
                <div class="flex items-center gap-1">
                  <span class="text-sm">{{ getCategoryIcon(mission.template.category) }}</span>
                  <app-tier-badge [tier]="mission.tier" />
                  <span class="text-xs font-semibold text-text-primary truncate">{{ mission.template.name }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .cdk-drag-preview {
      z-index: 1000;
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
  `,
})
export class MissionBoardComponent {
  missions = input.required<Task[]>();
  activeCount = input.required<number>();
  activeSlots = input.required<number>();
  connectedDropLists = input<string[]>([]);
  dragDisabled = input<boolean>(false);
  boardFrozen = input<boolean>(false);
  missionAccepted = output<string>();
  missionRouteRequested = output<Task>();
  unlockedDepartments = input<TaskCategory[]>([]);
  departments = input<Record<TaskCategory, Department>>({} as Record<TaskCategory, Department>);

  filterCategory = signal<string | null>(null);

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
    { key: 'schemes', label: 'Schemes', icon: '🗝️' },
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
    this.activeCount() < this.activeSlots()
  );

  private readonly TIER_RANK: Record<string, number> = {
    petty: 1, sinister: 2, diabolical: 3, legendary: 4,
  };

  filteredMissions = computed(() => {
    let result = this.missions();
    if (this.filterCategory()) {
      result = result.filter(m => m.template.category === this.filterCategory());
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
    this.missionRouteRequested.emit(mission);
  }
}
