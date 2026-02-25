import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, CdkDragPreview } from '@angular/cdk/drag-drop';
import { Task } from '../../../core/models/task.model';
import { TierBadgeComponent } from '../tier-badge/tier-badge.component';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
  selector: 'app-player-workbench',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragPreview, TierBadgeComponent, ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full" [class]="fullWidth() ? 'w-full' : 'min-w-[280px] max-w-[320px]'">
      <!-- Column header -->
      <div class="flex items-center justify-between px-3 py-2 rounded-t-lg border border-border bg-bg-secondary/80">
        <div class="flex items-center gap-2">
          <span class="text-lg">👆</span>
          <div>
            <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">
              Your Workbench
            </h3>
            <span class="text-[10px] text-text-muted">Click Power: {{ clickPower() }}</span>
          </div>
        </div>
        <span class="text-xs text-text-muted">
          {{ tasks().length }} task{{ tasks().length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Drop zone -->
      <div
        class="flex-1 flex flex-col gap-1 p-2 border border-t-0 border-border rounded-b-lg bg-bg-card/30 min-h-[200px] overflow-y-auto"
        cdkDropList
        id="player"
        [cdkDropListData]="'player'"
        [cdkDropListConnectedTo]="connectedDropLists()"
        (cdkDropListDropped)="onDrop($event)">

        <!-- Active task (first in queue) -->
        @if (activeTask(); as task) {
          <div class="game-card p-3 border-gold/30">
            <div class="flex items-center justify-between gap-1 mb-2">
              <div class="flex items-center gap-1 min-w-0">
                <app-tier-badge [tier]="task.tier" />
                <span class="text-xs font-semibold text-text-primary truncate">{{ task.template.name }}</span>
              </div>
              @if (task.goldReward) {
                <span class="text-xs text-gold font-bold shrink-0">{{ task.goldReward }}g</span>
              }
            </div>

            @if (task.status === 'in-progress') {
              <app-progress-bar
                [progress]="task.clicksRemaining"
                [total]="task.clicksRequired"
                [tier]="task.tier" />
            }

            <button
              (click)="taskClicked.emit(task.id)"
              class="w-full mt-2 py-3 px-4 rounded-lg font-bold text-sm
                     bg-gold/20 text-gold border border-gold/30
                     hover:bg-gold/30 active:scale-95
                     transition-all duration-150 cursor-pointer
                     min-h-[48px]">
              CLICK! ({{ task.clicksRemaining }} left)
            </button>
          </div>
        }

        <!-- Queued tasks (remaining) -->
        @if (remainingTasks().length > 0) {
          <div class="flex items-center gap-1 px-2 py-1 mt-1 text-[10px] text-text-muted uppercase tracking-wider border-t border-border/50">
            <span>Next Up</span>
          </div>
        }

        @for (task of remainingTasks(); track task.id) {
          <div
            class="game-card p-2 cursor-grab active:cursor-grabbing"
            cdkDrag
            [cdkDragData]="task"
            [cdkDragDisabled]="dragDisabled()">
            <div class="flex items-center justify-between gap-1">
              <div class="flex items-center gap-1 min-w-0">
                <app-tier-badge [tier]="task.tier" />
                <span class="text-xs font-semibold text-text-primary truncate">{{ task.template.name }}</span>
              </div>
              @if (task.goldReward) {
                <span class="text-xs text-gold font-bold shrink-0">{{ task.goldReward }}g</span>
              }
            </div>
            <div class="text-[10px] text-text-muted mt-0.5">
              {{ task.clicksRequired }} clicks
            </div>

            <div *cdkDragPreview class="game-card p-2 w-[200px] opacity-90 shadow-lg shadow-gold/20">
              <div class="flex items-center gap-1">
                <app-tier-badge [tier]="task.tier" />
                <span class="text-xs font-semibold text-text-primary truncate">{{ task.template.name }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Empty state -->
        @if (tasks().length === 0) {
          <div class="flex-1 flex items-center justify-center text-text-muted text-xs p-4 text-center">
            <p>Drop missions here for manual clicking</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .cdk-drag-preview {
      z-index: 1000;
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
  `,
})
export class PlayerWorkbenchComponent {
  tasks = input.required<Task[]>();
  clickPower = input.required<number>();
  connectedDropLists = input<string[]>([]);
  dragDisabled = input<boolean>(false);
  fullWidth = input<boolean>(false);

  taskClicked = output<string>();
  taskDropped = output<CdkDragDrop<any>>();

  activeTask = computed(() => {
    const t = this.tasks();
    return t.length > 0 ? t[0] : null;
  });

  remainingTasks = computed(() => {
    const t = this.tasks();
    return t.length > 1 ? t.slice(1) : [];
  });

  onDrop(event: CdkDragDrop<any>): void {
    this.taskDropped.emit(event);
  }
}
