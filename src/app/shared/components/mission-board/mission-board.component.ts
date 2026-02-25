import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragPreview } from '@angular/cdk/drag-drop';
import { Task, QueueTarget } from '../../../core/models';
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
        <span class="text-[10px] text-text-muted">
          {{ missions().length }} avail
        </span>
      </div>

      @if (missions().length === 0) {
        <div class="game-card p-6 text-center">
          <p class="text-text-muted text-xs">No missions available...</p>
        </div>
      } @else {
        <!-- Category filter tabs -->
        <div class="flex gap-1 flex-wrap shrink-0">
          <button
            (click)="filterCategory.set(null)"
            class="px-2 py-1 text-[10px] rounded cursor-pointer transition-colors"
            [class]="filterCategory() === null ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:text-text-secondary'">
            All
          </button>
          @for (cat of categories; track cat.key) {
            <button
              (click)="filterCategory.set(cat.key)"
              class="px-1.5 py-1 text-[10px] rounded cursor-pointer transition-colors"
              [class]="filterCategory() === cat.key ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:text-text-secondary'">
              {{ cat.icon }}
            </button>
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
                      <span class="text-[10px] px-1 py-0.5 rounded-full bg-gold/20 text-gold font-bold uppercase">
                        Special
                      </span>
                    }
                    @if (mission.isCoverOp) {
                      <span class="text-[10px] px-1 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold uppercase">
                        Cover
                      </span>
                    }
                    @if (mission.isBreakoutOp) {
                      <span class="text-[10px] px-1 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold uppercase">
                        Breakout
                      </span>
                    }
                  </div>
                  <h3 class="text-xs font-semibold text-text-primary truncate">
                    {{ mission.template.name }}
                  </h3>
                </div>
                @if (mission.isCoverOp || mission.isBreakoutOp) {
                  <span class="font-bold text-[10px] shrink-0" [class]="mission.isCoverOp ? 'text-green-400' : 'text-orange-400'">
                    {{ mission.isCoverOp ? '-Heat' : 'Rescue' }}
                  </span>
                } @else {
                  <span class="text-gold font-bold text-xs shrink-0">{{ mission.goldReward }}g</span>
                }
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-between text-[10px] text-text-muted">
                <span>{{ mission.timeToComplete }}s / {{ mission.clicksRequired }} clicks</span>
                @if (mission.isSpecialOp) {
                  <span class="text-gold">Expires soon</span>
                }
              </div>

              <!-- Send to queue button -->
              @if (canAccept()) {
                <button
                  (click)="onSendToQueue(mission); $event.stopPropagation()"
                  class="w-full py-1.5 px-2 rounded text-[10px] font-bold uppercase tracking-wider
                         bg-accent/10 text-accent border border-accent/20
                         hover:bg-accent/20 active:scale-95
                         transition-all cursor-pointer min-h-[36px]">
                  Send to Queue ▶
                </button>
              } @else {
                <div class="text-[10px] text-text-muted text-center py-1">
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
  missionAccepted = output<string>();
  missionRouteRequested = output<Task>();

  filterCategory = signal<string | null>(null);

  categories = [
    { key: 'schemes', label: 'Schemes', icon: '🗝️' },
    { key: 'heists', label: 'Heists', icon: '💎' },
    { key: 'research', label: 'Research', icon: '🧪' },
    { key: 'mayhem', label: 'Mayhem', icon: '💥' },
  ];

  canAccept = computed(() =>
    this.activeCount() < this.activeSlots()
  );

  filteredMissions = computed(() => {
    const all = this.missions();
    if (!this.filterCategory()) return all;
    return all.filter(m => m.template.category === this.filterCategory());
  });

  categoryCount(category: string): number {
    return this.missions().filter(m => m.template.category === category).length;
  }

  getMissionCardClass(mission: Task): string {
    if (mission.isBreakoutOp) return 'border-orange-500/40 animate-card-glow';
    if (mission.isSpecialOp) return 'border-gold/40 animate-card-glow';
    if (mission.isCoverOp) return 'border-green-500/40';
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

  onSendToQueue(mission: Task): void {
    this.missionRouteRequested.emit(mission);
  }
}
