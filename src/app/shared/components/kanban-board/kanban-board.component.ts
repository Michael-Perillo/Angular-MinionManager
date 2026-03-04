import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Task, TaskCategory, QueueTarget } from '../../../core/models/task.model';
import { Minion, MinionRole } from '../../../core/models/minion.model';
import { Department } from '../../../core/models/department.model';
import { DepartmentColumnComponent } from '../department-column/department-column.component';
import { MinionPoolComponent } from '../minion-pool/minion-pool.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [DepartmentColumnComponent, MinionPoolComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full">
      <!-- Minion pool strip (top) -->
      <app-minion-pool
        [minions]="unassignedMinions()"
        [connectedDropLists]="minionDropListIds()"
        [dragDisabled]="dragDisabled()"
        (minionDropped)="onPoolMinionDropped($event)" />

      <div class="flex-1 flex gap-3 overflow-x-auto py-2">
        @for (cat of unlockedCategories(); track cat) {
          <app-department-column
            [category]="cat"
            [tasks]="getDeptTasks(cat)"
            [department]="getDepartment(cat)"
            [assignedMinions]="getDeptMinions(cat)"
            [connectedDropLists]="taskDropListIds()"
            [minionConnectedDropLists]="minionDropListIds()"
            [clickPower]="clickPower()"
            [dragDisabled]="dragDisabled()"
            [activeBreakthroughs]="activeBreakthroughs()"
            [researchCompleted]="researchCompleted()"
            [breakthroughThreshold]="breakthroughThreshold()"
            [mayhemComboCount]="mayhemComboCount()"
            [deptEffectiveMult]="deptEffectiveMults()[cat]"
            [bossPenalty]="bossPenalty()"
            [queueCapacity]="deptQueueCapacity()[cat]"
            (taskClicked)="taskClicked.emit($event)"
            (taskDropped)="onTaskDropped($event, cat)"
            (minionRoleChanged)="minionRoleChanged.emit($event)"
            (minionDropped)="onMinionDropped($event)"
            (minionUnassigned)="minionUnassigned.emit($event)" />
        }

        @if (hasLockedDepartments()) {
          <div class="min-w-[200px] max-w-[240px] flex flex-col items-center justify-center
                      rounded-lg border border-dashed border-border/50 bg-bg-card/10 p-4 text-center">
            <span class="text-2xl mb-2 opacity-40">🔒</span>
            <p class="text-xs text-text-muted">Visit the Shop between quarters to unlock departments</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      overflow-x: auto;
    }
  `,
})
export class KanbanBoardComponent {
  departmentQueues = input.required<Record<TaskCategory, Task[]>>();
  departments = input.required<Record<TaskCategory, Department>>();
  minions = input.required<Minion[]>();
  clickPower = input.required<number>();
  boardFrozen = input<boolean>(false);
  dragDisabled = input<boolean>(false);
  deptQueueCapacity = input<Record<TaskCategory, number>>({ schemes: 2, heists: 2, research: 2, mayhem: 2 });
  unlockedDepartments = input<TaskCategory[]>([]);
  unassignedMinions = input<Minion[]>([]);

  // Department mechanic inputs
  activeBreakthroughs = input<number>(0);
  researchCompleted = input<number>(0);
  breakthroughThreshold = input<number>(6);
  mayhemComboCount = input<number>(0);
  deptEffectiveMults = input<Record<TaskCategory, number>>({ schemes: 1, heists: 1, research: 1, mayhem: 1 });
  bossPenalty = input<number>(0);

  taskClicked = output<string>();
  taskReordered = output<{ queue: QueueTarget; taskIds: string[] }>();
  minionRoleChanged = output<{ minionId: string; role: MinionRole }>();
  minionAssigned = output<{ minionId: string; department: TaskCategory; role: MinionRole }>();
  minionUnassigned = output<string>();

  readonly unlockedCategories = computed(() => this.unlockedDepartments());

  readonly hasLockedDepartments = computed(() => this.unlockedDepartments().length < 4);

  /** Task network: dept queues only (reorder within same queue) */
  readonly taskDropListIds = computed(() => [
    ...this.unlockedDepartments(),
  ]);

  /** Minion network: pool + dept worker zones */
  readonly minionDropListIds = computed(() => {
    const ids = ['minion-pool'];
    for (const cat of this.unlockedDepartments()) {
      ids.push(`${cat}-worker`);
    }
    return ids;
  });

  minionsByDept = computed(() => {
    const result: Record<TaskCategory, Minion[]> = {
      schemes: [], heists: [], research: [], mayhem: [],
    };
    for (const m of this.minions()) {
      if (m.assignedDepartment !== null) {
        result[m.assignedDepartment].push(m);
      }
    }
    return result;
  });

  getDeptTasks(cat: TaskCategory): Task[] {
    return this.departmentQueues()[cat];
  }

  getDepartment(cat: TaskCategory): Department {
    return this.departments()[cat];
  }

  getDeptMinions(cat: TaskCategory): Minion[] {
    return this.minionsByDept()[cat];
  }

  onTaskDropped(event: CdkDragDrop<any>, targetQueue: QueueTarget): void {
    const task = event.item.data as Task;
    if (!task?.id) return;

    const fromQueue = event.previousContainer.data as string;
    if (fromQueue !== targetQueue) return; // Cross-queue moves disabled

    // Same queue — reorder
    const tasks = [...this.getDeptTasks(targetQueue as TaskCategory)];
    const queuedTasks = tasks.filter(t => t.status === 'queued' || (t.status === 'in-progress' && !t.assignedMinionId));
    moveItemInArray(queuedTasks, event.previousIndex, event.currentIndex);
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress' && t.assignedMinionId);
    const newOrder = [...inProgressTasks, ...queuedTasks];
    this.taskReordered.emit({ queue: targetQueue, taskIds: newOrder.map(t => t.id) });
  }

  /** Handle minion dropped on a department worker zone */
  onMinionDropped(event: { event: CdkDragDrop<any>; zone: 'worker' }): void {
    const minion = event.event.item.data as Minion;
    if (!minion?.id) return;

    // Parse target zone ID (e.g. "schemes-worker" → dept="schemes")
    const targetId = event.event.container.data as string;
    const parsed = this.parseZoneId(targetId);
    if (!parsed) return;

    this.minionAssigned.emit({
      minionId: minion.id,
      department: parsed.dept,
      role: 'worker',
    });
  }

  /** Handle minion dropped back on the pool */
  onPoolMinionDropped(event: CdkDragDrop<any>): void {
    const minion = event.item.data as Minion;
    if (!minion?.id) return;

    // If dropped back on pool from a dept zone, unassign
    const fromId = event.previousContainer.data as string;
    if (fromId !== 'minion-pool') {
      this.minionUnassigned.emit(minion.id);
    }
  }

  private parseZoneId(id: string): { dept: TaskCategory; role: MinionRole } | null {
    const match = id.match(/^(schemes|heists|research|mayhem)-(worker)$/);
    if (!match) return null;
    return { dept: match[1] as TaskCategory, role: match[2] as MinionRole };
  }
}
