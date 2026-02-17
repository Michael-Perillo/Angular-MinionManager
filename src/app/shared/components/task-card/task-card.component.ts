import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Task } from '../../../core/models';
import { TierBadgeComponent } from '../tier-badge/tier-badge.component';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [TierBadgeComponent, ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-card p-4 flex flex-col gap-3" [class]="cardClasses()">
      <!-- Header row -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">{{ categoryIcon() }}</span>
            <app-tier-badge [tier]="task().tier" />
          </div>
          <h3 class="text-sm font-semibold text-text-primary truncate">
            {{ task().template.name }}
          </h3>
          <p class="text-xs text-text-secondary mt-0.5 line-clamp-1">
            {{ task().template.description }}
          </p>
        </div>
        <div class="flex items-center gap-1 text-gold font-bold text-sm shrink-0">
          <span>{{ task().goldReward }}g</span>
        </div>
      </div>

      <!-- Status area -->
      @if (task().status === 'queued' && !task().assignedMinionId) {
        <!-- Manual work button -->
        <button
          (click)="workClicked.emit(task().id)"
          class="w-full py-2 px-3 rounded-lg font-semibold text-sm
                 bg-gold/20 text-gold border border-gold/30
                 hover:bg-gold/30 active:scale-95
                 transition-all duration-150 cursor-pointer">
          WORK ({{ task().clicksRemaining }} clicks left)
        </button>
      }

      @if (task().status === 'in-progress' && !task().assignedMinionId) {
        <!-- Player is working it -->
        <div class="flex flex-col gap-2">
          <app-progress-bar
            [progress]="task().clicksRemaining"
            [total]="task().clicksRequired"
            [tier]="task().tier" />
          <button
            (click)="workClicked.emit(task().id)"
            class="w-full py-2 px-3 rounded-lg font-semibold text-sm
                   bg-gold/20 text-gold border border-gold/30
                   hover:bg-gold/30 active:scale-95
                   transition-all duration-150 cursor-pointer">
            CLICK! ({{ task().clicksRemaining }} left)
          </button>
        </div>
      }

      @if (task().status === 'in-progress' && task().assignedMinionId) {
        <!-- Minion is working it -->
        <div class="flex flex-col gap-2">
          <app-progress-bar
            [progress]="task().timeRemaining"
            [total]="task().timeToComplete"
            [tier]="task().tier" />
          <div class="flex items-center justify-between text-xs text-text-secondary">
            <span class="flex items-center gap-1">
              <span class="inline-block w-2 h-2 rounded-full bg-tier-petty animate-pulse"></span>
              Minion working...
            </span>
            <span>{{ task().timeRemaining }}s</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class TaskCardComponent {
  task = input.required<Task>();
  workClicked = output<string>();

  categoryIcon = computed(() => {
    switch (this.task().template.category) {
      case 'schemes': return '🗝️';
      case 'heists': return '💎';
      case 'research': return '🧪';
      case 'mayhem': return '💥';
    }
  });

  cardClasses = computed(() => {
    if (this.task().status === 'in-progress' && this.task().assignedMinionId) {
      return 'animate-card-glow';
    }
    return '';
  });
}
