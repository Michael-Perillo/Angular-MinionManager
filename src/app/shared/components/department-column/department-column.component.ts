import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, CdkDragPreview } from '@angular/cdk/drag-drop';
import { Task, TaskCategory } from '../../../core/models/task.model';
import { Minion, MinionRole, MINION_ARCHETYPES, getMinionDisplay, getRarityColor, getActivePassives, aggregatePassiveFlat } from '../../../core/models/minion.model';
import {
  Department, DEPARTMENT_LABELS, getDeptMult,
} from '../../../core/models/department.model';
import { TaskTier } from '../../../core/models/task.model';
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
      <div class="px-3 py-2 rounded-t-lg border border-border bg-bg-secondary/80">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ deptLabel().icon }}</span>
            <div>
              <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">
                {{ deptLabel().label }}
              </h3>
              <span class="text-xs text-text-muted">Lv.{{ department().level }}</span>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs text-text-muted">
              {{ assignedMinions().length }} minion{{ assignedMinions().length !== 1 ? 's' : '' }}
            </span>
            <div class="text-[10px] text-text-muted">
              ⚒️ {{ workerMinions().length }}/{{ department().workerSlots }}
              · 👔 {{ department().hasManager ? '✓' : '—' }}
            </div>
          </div>
        </div>

        <!-- Tier badges -->
        <div class="flex items-center justify-end mt-1">
          <div class="flex items-center gap-0.5">
            @for (tier of allTiers; track tier) {
              <span class="text-[9px] px-1 py-0.5 rounded"
                    [class]="isTierUnlocked(tier) ? tierBadgeClass(tier) : 'text-text-muted/40 bg-white/5'">
                {{ tierShortLabel(tier) }}
              </span>
            }
          </div>
        </div>

        <!-- Dept mult display -->
        <div class="text-[10px] mt-0.5 flex items-center gap-1">
          <span class="text-green-400 font-bold">&times;{{ deptEffectiveMult() }}</span>
          @if (deptMult() > 0 || activeBreakthroughs() > 0) {
            <span class="text-text-muted">(dept +{{ deptMult() }}<!--
              -->@if (activeBreakthroughs() > 0) { <span class="text-yellow-400">⚡+{{ activeBreakthroughs() }}</span>}<!--
            -->)</span>
          } @else {
            <span class="text-text-muted">(Lv.2 for &times;2)</span>
          }
        </div>

        <!-- Department mechanic indicator -->
        @if (category() === 'heists') {
          <div class="text-[10px] text-text-muted mt-0.5">🎲 Variable gold</div>
        }
        @if (category() === 'research') {
          <div class="text-[10px] text-purple-400 mt-0.5">
            ⚡ Breakthrough: {{ researchCompleted() }}/{{ breakthroughThreshold() }}
          </div>
        }
        @if (category() === 'mayhem' && mayhemComboCount() > 0) {
          <div class="text-[10px] text-orange-400 mt-0.5">
            🔥 Combo: {{ mayhemComboCount() }}/3
          </div>
        }
      </div>

      <!-- Manager slot -->
      <div class="px-2 py-1.5 border border-t-0 border-border bg-bg-card/40">
        <div class="flex items-center gap-1 mb-1">
          <span class="text-xs">👔</span>
          <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Manager</span>
        </div>
        @if (manager(); as mgr) {
          <div class="flex items-center justify-between gap-1 px-2 py-1 rounded bg-gold/10 border border-gold/20">
            <div class="flex items-center gap-1.5 text-xs">
              <span class="text-sm" [style.color]="getArchetypeColor(mgr)">{{ getArchetypeIcon(mgr) }}</span>
              <div>
                <span class="text-text-primary font-semibold">{{ getArchetypeName(mgr) }}</span>
                <span class="text-[9px] text-text-muted block">{{ getArchetypePassive(mgr) }}</span>
              </div>
            </div>
            <button
              (click)="onDemoteManager(mgr.id); $event.stopPropagation()"
              class="text-[10px] text-text-muted hover:text-red-400 cursor-pointer px-1 py-0.5 rounded
                     border border-border/30 hover:border-red-500/40 transition-colors">
              Demote
            </button>
          </div>
        } @else if (department().hasManager) {
          <div class="text-[10px] text-text-muted italic px-1">Promote a worker to manage</div>
        } @else {
          <div class="text-[10px] text-text-muted italic px-1">🔒 Buy manager slot in shop</div>
        }
      </div>

      <!-- Worker zone (CdkDropList for minion network) -->
      <div
        class="p-2 border border-t-0 border-border bg-bg-card/20 min-h-[40px]"
        cdkDropList
        [id]="workerDropListId()"
        [cdkDropListData]="workerDropListId()"
        [cdkDropListConnectedTo]="minionConnectedDropLists()"
        (cdkDropListDropped)="onMinionDrop($event, 'worker')">
        <div class="flex items-center gap-1 mb-1">
          <span class="text-xs">⚒️</span>
          <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Workers</span>
          <span class="text-xs text-text-muted">({{ workerMinions().length }})</span>
        </div>
        @for (minion of workerMinions(); track minion.id) {
          @if (minionTask(minion); as task) {
            <div class="mb-1">
              <div class="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary">
                <span class="text-sm">{{ getArchetypeIcon(minion) }}</span>
                <span class="font-semibold text-text-secondary">{{ getArchetypeName(minion) }}</span>
              </div>
              <div [class]="getTaskCardClasses(task)"
                   [class.animate-card-glow]="!isRecentlyCompleted(minion.id) && !isRecentlyStarted(minion.id)"
                   [class.animate-task-complete]="isRecentlyCompleted(minion.id)"
                   [class.animate-task-enter]="isRecentlyStarted(minion.id)">
                <div class="flex items-center justify-between gap-1 mb-1">
                  <div class="flex items-center gap-1 min-w-0">
                    @if (task.isOperation) {
                      <span class="text-cyan-400 mr-0.5">⚙</span>
                    }
                    <span class="text-xs font-semibold text-text-primary truncate">{{ task.template.name }}</span>
                  </div>
                  @if (task.goldReward) {
                    <div class="text-right shrink-0">
                      @if (getTaskMult(task, minion.id) > 1) {
                        <div class="text-[9px] text-text-muted tabular-nums">{{ task.goldReward }}g &times;{{ getTaskMult(task, minion.id) }}</div>
                      }
                      <div class="text-xs text-gold font-bold tabular-nums">~{{ getExpectedGold(task, minion.id) }}g</div>
                    </div>
                  }
                </div>
                <app-progress-bar
                  [progress]="task.clicksRemaining"
                  [total]="task.clicksRequired"
                  [tier]="task.tier" />
                <div class="flex items-center justify-between text-xs text-text-secondary mt-1">
                  <span>{{ getProgressPercent(task) }}%</span>
                  <span>{{ task.clicksRemaining }} clicks</span>
                </div>
              </div>
            </div>
          } @else {
            <div class="flex items-center justify-between gap-1.5 px-2 py-1 text-xs text-text-muted">
              <div class="flex items-center gap-1.5">
                <span class="text-sm animate-minion-idle">{{ getArchetypeIcon(minion) }}</span>
                <span class="text-text-secondary">{{ getArchetypeName(minion) }}</span>
                <span class="italic">idle</span>
              </div>
              <div class="flex items-center gap-1">
                @if (!manager() && department().hasManager) {
                  <button
                    (click)="onPromoteToManager(minion.id); $event.stopPropagation()"
                    class="text-[10px] text-gold hover:text-gold-dark cursor-pointer px-1 py-0.5 rounded
                           border border-gold/20 hover:border-gold/40 transition-colors">
                    👔 Manage
                  </button>
                }
                <button
                  (click)="minionUnassigned.emit(minion.id); $event.stopPropagation()"
                  class="text-[10px] text-text-muted hover:text-red-400 cursor-pointer px-1 py-0.5 rounded border border-border/30 hover:border-red-500/40 transition-colors">
                  ← Pool
                </button>
              </div>
            </div>
          }
        }
        @if (department().workerSlots === 0) {
          <div class="text-[10px] text-text-muted italic px-1">🔒 Buy worker slots in shop</div>
        } @else if (workerMinions().length === 0) {
          <div class="text-[10px] text-text-muted italic px-1">Drop minion to work</div>
        } @else if (workerMinions().length >= department().workerSlots) {
          <div class="text-[10px] text-text-muted italic px-1">Slots full — buy more in shop</div>
        }
      </div>

      <!-- Queue capacity indicator -->
      <div class="flex items-center justify-between px-2 py-1 border border-t-0 border-border bg-bg-card/20 text-xs text-text-muted">
        <span>Queue</span>
        <span>{{ tasks().length }}/{{ queueCapacity() }}</span>
      </div>

      <!-- Task queue drop zone (existing task network) -->
      <div
        class="flex-1 flex flex-col gap-1 p-2 border border-t-0 border-border rounded-b-lg bg-bg-card/30 min-h-[120px] overflow-y-auto"
        cdkDropList
        [id]="category()"
        [cdkDropListData]="category()"
        [cdkDropListConnectedTo]="connectedDropLists()"
        (cdkDropListDropped)="onDrop($event)">

        <!-- Active clickable task -->
        @if (clickableTask(); as active) {
          <div [class]="getTaskCardClasses(active, 'border-accent/30')"
               [class.animate-card-glow]="!isRecentlyGrabbed(active.id)"
               [class.animate-queue-grab]="isRecentlyGrabbed(active.id)">
            <div class="flex items-center justify-between gap-1 mb-1">
              <div class="flex items-center gap-1 min-w-0">
                <app-tier-badge [tier]="active.tier" />
                @if (active.isOperation) {
                  <span class="text-[9px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">OP</span>
                }
                <span class="text-xs font-semibold text-text-primary truncate">{{ active.template.name }}</span>
              </div>
              @if (active.goldReward) {
                <div class="text-right shrink-0">
                  @if (getTaskMult(active) > 1) {
                    <div class="text-[9px] text-text-muted tabular-nums">{{ active.goldReward }}g &times;{{ getTaskMult(active) }}</div>
                  }
                  <div class="text-xs text-gold font-bold tabular-nums">~{{ getExpectedGold(active) }}g</div>
                </div>
              }
            </div>
            <app-progress-bar
              [progress]="active.clicksRemaining"
              [total]="active.clicksRequired"
              [tier]="active.tier" />
            <div class="flex items-center justify-between mt-1">
              <span class="text-xs text-text-secondary">{{ getProgressPercent(active) }}%</span>
              <span class="text-xs text-text-muted">{{ active.clicksRemaining }} clicks</span>
            </div>
            @if (!isRecentlyGrabbed(active.id)) {
              <button
                (click)="taskClicked.emit(active.id)"
                class="w-full mt-1.5 py-2 rounded-lg bg-accent/20 text-accent text-sm font-bold uppercase tracking-wider
                       hover:bg-accent/30 active:bg-accent/40 cursor-pointer transition-colors select-none"
                data-testid="click-task-btn">
                Click! (+{{ clickPower() }})
              </button>
            }
          </div>
        }

        <!-- Queued section (remaining tasks after the active one) -->
        @if (queuedTasks().length > 1) {
          <div class="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary uppercase tracking-wider border-b border-border/50">
            <span>Queued</span>
            <span>({{ queuedTasks().length - 1 }})</span>
          </div>
        }

        @for (task of queuedTasks(); track task.id; let i = $index) {
          @if (i > 0) {
            <div
              [class]="getTaskCardClasses(task, 'cursor-grab active:cursor-grabbing')"
              [class.animate-queue-grab]="isRecentlyGrabbed(task.id)"
              cdkDrag
              [cdkDragData]="task"
              [cdkDragDisabled]="dragDisabled()">
              <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1 min-w-0">
                  <app-tier-badge [tier]="task.tier" />
                  @if (task.isOperation) {
                    <span class="text-[9px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">OP</span>
                  }
                  <span class="text-xs font-semibold text-text-primary truncate">{{ task.template.name }}</span>
                </div>
                @if (task.goldReward) {
                  <div class="text-right shrink-0">
                    @if (getTaskMult(task) > 1) {
                      <div class="text-[9px] text-text-muted tabular-nums">{{ task.goldReward }}g &times;{{ getTaskMult(task) }}</div>
                    }
                    <div class="text-xs text-gold font-bold tabular-nums">~{{ getExpectedGold(task) }}g</div>
                  </div>
                }
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <span class="text-xs text-text-muted">
                  {{ task.clicksRequired }} clicks
                </span>
                @if (dragDisabled()) {
                  <div class="flex items-center gap-1">
                    <button
                      [disabled]="i === 1"
                      (click)="onMoveUp(task.id); $event.stopPropagation()"
                      class="text-xs text-text-muted hover:text-text-primary cursor-pointer px-1 py-0.5 disabled:opacity-30 disabled:cursor-default"
                      aria-label="Move up">&#x25B2;</button>
                    <button
                      [disabled]="$last"
                      (click)="onMoveDown(task.id); $event.stopPropagation()"
                      class="text-xs text-text-muted hover:text-text-primary cursor-pointer px-1 py-0.5 disabled:opacity-30 disabled:cursor-default"
                      aria-label="Move down">&#x25BC;</button>
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
        }

        <!-- Empty state -->
        @if (tasks().length === 0 && workerMinions().length === 0) {
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
      height: 100%;
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
  minionConnectedDropLists = input<string[]>([]);
  clickPower = input<number>(1);
  dragDisabled = input<boolean>(false);
  fullWidth = input<boolean>(false);
  allMinions = input<Minion[]>([]);
  activeBreakthroughs = input<number>(0);
  researchCompleted = input<number>(0);
  breakthroughThreshold = input<number>(6);
  mayhemComboCount = input<number>(0);
  deptEffectiveMult = input<number>(1);
  bossPenalty = input<number>(0);
  queueCapacity = input<number>(2);

  taskClicked = output<string>();
  taskDropped = output<CdkDragDrop<any>>();
  taskReordered = output<string[]>();
  minionRoleChanged = output<{ minionId: string; role: MinionRole }>();
  minionDropped = output<{ event: CdkDragDrop<any>; zone: 'worker' }>();
  minionUnassigned = output<string>();

  // Track recently-completed minion tasks for brief 100% display
  private previousMinionTasks = new Map<string, Task>();
  private recentlyCompletedTasks = signal(new Map<string, Task>());
  private recentlyStartedMinions = signal(new Set<string>());
  private recentlyGrabbedTasks = signal(new Set<string>());

  constructor() {
    effect(() => {
      const tasks = this.tasks();
      const minions = this.assignedMinions();
      const nowWorking = new Map<string, Task>();

      for (const m of minions) {
        if (m.status === 'working' && m.assignedTaskId) {
          const task = tasks.find(t => t.id === m.assignedTaskId);
          if (task) nowWorking.set(m.id, task);
        }
      }

      // Detect minions whose tasks just vanished → snapshot as completed
      for (const [minionId, prevTask] of this.previousMinionTasks) {
        const currentTask = nowWorking.get(minionId);
        if (!currentTask || currentTask.id !== prevTask.id) {
          const snapshot: Task = { ...prevTask, clicksRemaining: 0, status: 'complete' as Task['status'] };
          this.recentlyCompletedTasks.update(m => new Map(m).set(minionId, snapshot));
          setTimeout(() => {
            this.recentlyCompletedTasks.update(m => {
              const n = new Map(m);
              n.delete(minionId);
              return n;
            });
            // Chain enter animation for the new task
            this.recentlyStartedMinions.update(s => new Set(s).add(minionId));
            setTimeout(() => {
              this.recentlyStartedMinions.update(s => { const n = new Set(s); n.delete(minionId); return n; });
            }, 300);
          }, 350);
        }
      }

      // Detect task switches → queue grab animation
      for (const [minionId, task] of nowWorking) {
        const prevTask = this.previousMinionTasks.get(minionId);
        if (prevTask && prevTask.id !== task.id) {
          this.recentlyGrabbedTasks.update(s => new Set(s).add(task.id));
          setTimeout(() => {
            this.recentlyGrabbedTasks.update(s => { const n = new Set(s); n.delete(task.id); return n; });
          }, 300);
        }
      }

      this.previousMinionTasks = nowWorking;
    });
  }

  protected readonly Math = Math;

  deptLabel = computed(() => DEPARTMENT_LABELS[this.category()]);

  deptMult = computed(() => getDeptMult(this.department().level));

  readonly allTiers: TaskTier[] = ['petty', 'sinister', 'diabolical', 'legendary'];

  isTierUnlocked(tier: TaskTier): boolean {
    return tier === 'petty';
  }

  tierShortLabel(tier: TaskTier): string {
    switch (tier) {
      case 'petty': return 'P';
      case 'sinister': return 'S';
      case 'diabolical': return 'D';
      case 'legendary': return 'L';
    }
  }

  tierBadgeClass(tier: TaskTier): string {
    switch (tier) {
      case 'petty': return 'text-tier-petty bg-tier-petty/20';
      case 'sinister': return 'text-tier-sinister bg-tier-sinister/20';
      case 'diabolical': return 'text-tier-diabolical bg-tier-diabolical/20';
      case 'legendary': return 'text-gold bg-gold/20';
    }
  }

  workerDropListId = computed(() => `${this.category()}-worker`);

  workerMinions = computed(() =>
    this.assignedMinions().filter(m => m.role === 'worker')
  );

  manager = computed(() =>
    this.assignedMinions().find(m => m.role === 'manager') ?? null
  );

  inProgressTasks = computed(() =>
    this.tasks().filter(t => t.status === 'in-progress' && t.assignedMinionId)
  );

  queuedTasks = computed(() =>
    this.tasks().filter(t =>
      t.status === 'queued' ||
      (t.status === 'in-progress' && !t.assignedMinionId) ||
      (t.status === 'complete' && !t.assignedMinionId) ||  // Keep click-completed tasks visible during 350ms cleanup
      this.recentlyGrabbedTasks().has(t.id)                // Keep grabbed tasks visible during grab animation
    )
  );

  clickableTask = computed(() => this.queuedTasks()[0] ?? null);

  minionTask(minion: Minion): Task | undefined {
    // Brief 100% display takes priority over new task the minion picked up
    const completed = this.recentlyCompletedTasks().get(minion.id);
    if (completed) return completed;
    if (minion.status === 'working' && minion.assignedTaskId) {
      return this.tasks().find(t => t.id === minion.assignedTaskId);
    }
    return undefined;
  }

  getArchetypeIcon(minion: Minion): string {
    return getMinionDisplay(minion).icon;
  }

  getArchetypeName(minion: Minion): string {
    return getMinionDisplay(minion).name;
  }

  getArchetypeColor(minion: Minion): string {
    return getMinionDisplay(minion).color;
  }

  getArchetypePassive(minion: Minion): string {
    return getMinionDisplay(minion).description;
  }

  /** Compute total mult for a task in this department */
  getTaskMult(task: Task, minionId?: string): number {
    // Start with the base effective mult (dept + breakthroughs + manager + boss penalty)
    let mult = this.deptEffectiveMult();
    // Add special op bonus
    if (task.isSpecialOp) mult += 1;
    // Add combo mult from scheme (baked into operation)
    if (task.comboMult && task.comboMult > 0) mult += task.comboMult;
    // Add worker passive gold-mult if completing worker is known
    if (minionId) {
      const passives = getActivePassives(this.assignedMinions(), this.category(), minionId);
      mult += aggregatePassiveFlat(passives, 'gold-mult');
    }
    return Math.max(1, mult);
  }

  /** Compute expected gold payout for a task */
  getExpectedGold(task: Task, minionId?: string): number {
    return task.goldReward * this.getTaskMult(task, minionId);
  }

  getProgressPercent(task: Task): number {
    if (task.clicksRequired <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round(((task.clicksRequired - task.clicksRemaining) / task.clicksRequired) * 100)));
  }

  isRecentlyCompleted(minionId: string): boolean {
    return this.recentlyCompletedTasks().has(minionId);
  }

  isRecentlyStarted(minionId: string): boolean {
    return this.recentlyStartedMinions().has(minionId);
  }

  isRecentlyGrabbed(taskId: string): boolean {
    return this.recentlyGrabbedTasks().has(taskId);
  }

  getTaskCardClasses(task: Task, extras: string = ''): string {
    const cls = ['game-card p-2', extras];
    if (task.isOperation) cls.push('border-l-2 border-l-cyan-500/60');
    if (task.isSpecialOp) cls.push('ring-1 ring-gold/30');
    return cls.filter(Boolean).join(' ');
  }

  onPromoteToManager(minionId: string): void {
    this.minionRoleChanged.emit({ minionId, role: 'manager' });
  }

  onDemoteManager(minionId: string): void {
    this.minionRoleChanged.emit({ minionId, role: 'worker' });
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

  onDrop(event: CdkDragDrop<any>): void {
    this.taskDropped.emit(event);
  }

  onMinionDrop(event: CdkDragDrop<any>, zone: 'worker'): void {
    this.minionDropped.emit({ event, zone });
  }
}
