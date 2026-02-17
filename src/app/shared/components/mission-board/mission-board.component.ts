import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { Task } from '../../../core/models';
import { TierBadgeComponent } from '../tier-badge/tier-badge.component';

@Component({
  selector: 'app-mission-board',
  standalone: true,
  imports: [TierBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-text-primary font-display uppercase tracking-wider">
          Mission Board
        </h2>
        <span class="text-xs text-text-muted">
          {{ missions().length }} available
        </span>
      </div>

      @if (missions().length === 0) {
        <div class="game-card p-8 text-center">
          <p class="text-text-muted text-sm">No missions available... the underworld is quiet.</p>
        </div>
      } @else {
        <!-- Category filter tabs -->
        <div class="flex gap-1 flex-wrap">
          <button
            (click)="filterCategory.set(null)"
            class="px-2 py-1 text-xs rounded cursor-pointer transition-colors"
            [class]="filterCategory() === null ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:text-text-secondary'">
            All ({{ missions().length }})
          </button>
          @for (cat of categories; track cat.key) {
            <button
              (click)="filterCategory.set(cat.key)"
              class="px-2 py-1 text-xs rounded cursor-pointer transition-colors"
              [class]="filterCategory() === cat.key ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:text-text-secondary'">
              {{ cat.icon }} {{ cat.label }} ({{ categoryCount(cat.key) }})
            </button>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          @for (mission of filteredMissions(); track mission.id) {
            <div
              class="game-card p-3 flex flex-col gap-2 cursor-pointer hover:border-accent/40 transition-all"
              [class]="mission.isSpecialOp ? 'border-gold/40 animate-card-glow' : mission.isCoverOp ? 'border-green-500/40' : ''"
              (click)="canAccept() ? missionAccepted.emit(mission.id) : null">
              <!-- Header -->
              <div class="flex items-start justify-between gap-1">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="text-sm">{{ getCategoryIcon(mission.template.category) }}</span>
                    <app-tier-badge [tier]="mission.tier" />
                    @if (mission.isSpecialOp) {
                      <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold font-bold uppercase tracking-wider">
                        Special Op
                      </span>
                    }
                    @if (mission.isCoverOp) {
                      <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold uppercase tracking-wider">
                        Cover Op
                      </span>
                    }
                  </div>
                  <h3 class="text-xs font-semibold text-text-primary truncate">
                    {{ mission.template.name }}
                  </h3>
                </div>
                @if (mission.isCoverOp) {
                  <span class="text-green-400 font-bold text-xs shrink-0">-Heat</span>
                } @else {
                  <span class="text-gold font-bold text-sm shrink-0">{{ mission.goldReward }}g</span>
                }
              </div>

              <p class="text-[10px] text-text-secondary line-clamp-1">
                {{ mission.template.description }}
              </p>

              <!-- Footer -->
              <div class="flex items-center justify-between text-[10px] text-text-muted">
                <span>{{ mission.timeToComplete }}s / {{ mission.clicksRequired }} clicks</span>
                @if (mission.isSpecialOp && mission.specialOpExpiry) {
                  <span class="text-gold">
                    Expires soon
                  </span>
                }
              </div>

              @if (!canAccept()) {
                <div class="text-[10px] text-text-muted text-center">
                  Active slots full
                </div>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class MissionBoardComponent {
  missions = input.required<Task[]>();
  activeCount = input.required<number>();
  activeSlots = input.required<number>();
  missionAccepted = output<string>();

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

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'schemes': return '🗝️';
      case 'heists': return '💎';
      case 'research': return '🧪';
      case 'mayhem': return '💥';
      default: return '?';
    }
  }
}
