import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, CdkDragPreview } from '@angular/cdk/drag-drop';
import { Task, TaskCategory } from '../../../core/models/task.model';
import { Minion } from '../../../core/models/minion.model';
import { Department, DEPARTMENT_LABELS, DEPARTMENT_PASSIVES, getPassiveBonus } from '../../../core/models/department.model';
import { TierBadgeComponent } from '../tier-badge/tier-badge.component';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
  selector: 'app-department-column',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragPreview, TierBadgeComponent, ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full" [class]="fullWidth() ? 'w-full' : 'min-w-[280px] max-w-[320px]'">
      <!-- Column header -->
      <div class="flex items-center justify-between px-3 py-2 rounded-t-lg border border-border bg-bg-secondary/80">
        <div class="flex items-center gap-2">
          <span class="text-lg">{{ deptLabel().icon }}</span>
          <div>
            <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">
              {{ deptLabel().label }}
            </h3>
            <span class="text-xs text-text-muted">Dept Lv.{{ department().level }}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs text-text-muted">
            {{ assignedMinions().length }} minion{{ assignedMinions().length !== 1 ? 's' : '' }}
          </span>
          @if (passiveBonus() > 0) {
            <div class="text-xs text-green-400">
              {{ passiveName() }} +{{ passiveBonus() }}%
            </div>
          }
        </div>
      </div>

      <!-- Drop zone -->
      <div
        class="flex-1 flex flex-col gap-1 p-2 border border-t-0 border-border rounded-b-lg bg-bg-card/30 min-h-[200px] overflow-y-auto"
        cdkDropList
        [id]="category()"
        [cdkDropListData]="category()"
        [cdkDropListConnectedTo]="connectedDropLists()"
        (cdkDropListDropped)="onDrop($event)">

        <!-- Minion sub-lanes: in-progress tasks -->
        @for (minion of assignedMinions(); track minion.id) {
          @if (minionTask(minion); as task) {
            <div class="mb-1">
              <div class="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary uppercase tracking-wider">
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0"
                  [style.background-color]="minion.appearance.color">
                  {{ getAccessoryEmoji(minion) }}
                </div>
                <span class="font-semibold text-text-secondary">{{ minion.name }}</span>
                <span>{{ getCategoryIcon(minion.specialty) }}</span>
              </div>
              <div class="game-card p-2 animate-card-glow">
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span class="text-xs font-semibold text-text-primary truncate">{{ task.template.name }}</span>
                  @if (task.goldReward) {
                    <span class="text-xs text-gold font-bold shrink-0">{{ task.goldReward }}g</span>
                  }
                </div>
                <app-progress-bar
                  [progress]="task.timeRemaining"
                  [total]="task.timeToComplete"
                  [assignedAt]="task.assignedAt ?? null"
                  [completesAt]="task.completesAt ?? null"
                  [tier]="task.tier" />
                <div class="flex items-center justify-between text-xs text-text-secondary mt-1">
                  <span>{{ getProgressPercent(task) }}%</span>
                  <span>{{ getTimeRemaining(task) }}s</span>
                </div>
              </div>
            </div>
          } @else {
            <div class="flex items-center gap-1.5 px-2 py-1 text-xs text-text-muted">
              <div
                class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 animate-minion-idle"
                [style.background-color]="minion.appearance.color">
                {{ getAccessoryEmoji(minion) }}
              </div>
              <span class="text-text-secondary">{{ minion.name }}</span>
              <span class="italic">idle</span>
            </div>
          }
        }

        <!-- Queued section -->
        @if (queuedTasks().length > 0) {
          <div class="flex items-center gap-1 px-2 py-1 mt-1 text-xs text-text-secondary uppercase tracking-wider border-t border-border/50">
            <span>Queued</span>
            <span>({{ queuedTasks().length }})</span>
          </div>
        }

        @for (task of queuedTasks(); track task.id) {
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
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-text-muted">
                {{ task.timeToComplete }}s / {{ task.clicksRequired }} clicks
              </span>
              @if (dragDisabled()) {
                <div class="flex items-center gap-1">
                  <button
                    [disabled]="$index === 0"
                    (click)="onMoveUp(task.id); $event.stopPropagation()"
                    class="text-xs text-text-muted hover:text-text-primary cursor-pointer px-1 py-0.5 disabled:opacity-30 disabled:cursor-default"
                    aria-label="Move up">&#x25B2;</button>
                  <button
                    [disabled]="$last"
                    (click)="onMoveDown(task.id); $event.stopPropagation()"
                    class="text-xs text-text-muted hover:text-text-primary cursor-pointer px-1 py-0.5 disabled:opacity-30 disabled:cursor-default"
                    aria-label="Move down">&#x25BC;</button>
                  <button
                    (click)="onMoveRequest(task.id); $event.stopPropagation()"
                    class="text-xs text-accent hover:text-gold cursor-pointer px-1.5 py-0.5 rounded
                           border border-accent/20 hover:border-accent/40 transition-colors">
                    Move...
                  </button>
                </div>
              }
            </div>

            <!-- Drag preview -->
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
            <p>Drop missions here</p>
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
    .cdk-drop-list-dragging .game-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `,
})
export class DepartmentColumnComponent {
  category = input.required<TaskCategory>();
  tasks = input.required<Task[]>();
  department = input.required<Department>();
  assignedMinions = input.required<Minion[]>();
  connectedDropLists = input<string[]>([]);
  dragDisabled = input<boolean>(false);
  fullWidth = input<boolean>(false);
  allMinions = input<Minion[]>([]);
  currentTime = input<number>(Date.now());

  taskDropped = output<CdkDragDrop<any>>();
  taskReordered = output<string[]>();
  taskMoveRequested = output<{ taskId: string; fromQueue: string }>();

  protected readonly Math = Math;

  deptLabel = computed(() => DEPARTMENT_LABELS[this.category()]);

  passiveBonus = computed(() => getPassiveBonus(this.category(), this.department().level));
  passiveName = computed(() => DEPARTMENT_PASSIVES[this.category()].name);

  inProgressTasks = computed(() =>
    this.tasks().filter(t => t.status === 'in-progress' && t.assignedMinionId)
  );

  queuedTasks = computed(() =>
    this.tasks().filter(t => t.status === 'queued' || (t.status === 'in-progress' && !t.assignedMinionId))
  );

  minionTask(minion: Minion): Task | undefined {
    if (minion.status !== 'working' || !minion.assignedTaskId) return undefined;
    return this.tasks().find(t => t.id === minion.assignedTaskId);
  }

  getAccessoryEmoji(minion: Minion): string {
    switch (minion.appearance.accessory) {
      case 'goggles': return '🥽';
      case 'helmet': return '⛑️';
      case 'cape': return '🦹';
      case 'horns': return '😈';
      case 'none': return '👾';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'schemes': return '🗝️';
      case 'heists': return '💎';
      case 'research': return '🧪';
      case 'mayhem': return '💥';
      default: return '';
    }
  }

  getTimeRemaining(task: Task): number {
    if (task.completesAt) {
      return Math.max(0, Math.ceil((task.completesAt - this.currentTime()) / 1000));
    }
    return task.timeRemaining;
  }

  getProgressPercent(task: Task): number {
    if (task.assignedAt && task.completesAt) {
      const totalMs = task.completesAt - task.assignedAt;
      if (totalMs <= 0) return 100;
      const elapsed = this.currentTime() - task.assignedAt;
      return Math.min(100, Math.max(0, Math.round((elapsed / totalMs) * 100)));
    }
    if (task.timeToComplete <= 0) return 0;
    return Math.round((1 - this.getTimeRemaining(task) / task.timeToComplete) * 100);
  }

  onMoveUp(taskId: string): void {
    const queued = this.queuedTasks();
    const idx = queued.findIndex(t => t.id === taskId);
    if (idx <= 0) return;
    const reordered = [...queued];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    const inProgress = this.tasks().filter(t => t.status === 'in-progress' && t.assignedMinionId);
    this.taskReordered.emit([...inProgress, ...reordered].map(t => t.id));
  }

  onMoveDown(taskId: string): void {
    const queued = this.queuedTasks();
    const idx = queued.findIndex(t => t.id === taskId);
    if (idx < 0 || idx >= queued.length - 1) return;
    const reordered = [...queued];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    const inProgress = this.tasks().filter(t => t.status === 'in-progress' && t.assignedMinionId);
    this.taskReordered.emit([...inProgress, ...reordered].map(t => t.id));
  }

  onMoveRequest(taskId: string): void {
    this.taskMoveRequested.emit({ taskId, fromQueue: this.category() });
  }

  onDrop(event: CdkDragDrop<any>): void {
    this.taskDropped.emit(event);
  }
}
