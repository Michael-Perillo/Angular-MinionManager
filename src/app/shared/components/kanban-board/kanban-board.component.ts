import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Task, TaskCategory, QueueTarget } from '../../../core/models/task.model';
import { Minion } from '../../../core/models/minion.model';
import { Department } from '../../../core/models/department.model';
import { DepartmentColumnComponent } from '../department-column/department-column.component';
import { PlayerWorkbenchComponent } from '../player-workbench/player-workbench.component';

const ALL_CATEGORIES: TaskCategory[] = ['schemes', 'heists', 'research', 'mayhem'];

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [DepartmentColumnComponent, PlayerWorkbenchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-3 overflow-x-auto pb-2 h-full">
      @for (cat of categories; track cat) {
        <app-department-column
          [category]="cat"
          [tasks]="getDeptTasks(cat)"
          [department]="getDepartment(cat)"
          [assignedMinions]="getDeptMinions(cat)"
          [connectedDropLists]="allDropListIds"
          (taskDropped)="onTaskDropped($event, cat)" />
      }

      <app-player-workbench
        [tasks]="playerQueue()"
        [clickPower]="clickPower()"
        [connectedDropLists]="allDropListIds"
        (taskClicked)="taskClicked.emit($event)"
        (taskDropped)="onTaskDropped($event, 'player')" />
    </div>
  `,
  styles: `
    :host {
      display: block;
      overflow-x: auto;
    }
  `,
})
export class KanbanBoardComponent {
  departmentQueues = input.required<Record<TaskCategory, Task[]>>();
  playerQueue = input.required<Task[]>();
  departments = input.required<Record<TaskCategory, Department>>();
  minions = input.required<Minion[]>();
  clickPower = input.required<number>();

  taskClicked = output<string>();
  taskMoved = output<{ taskId: string; from: QueueTarget; to: QueueTarget }>();
  taskRouted = output<{ taskId: string; target: QueueTarget }>();

  readonly categories = ALL_CATEGORIES;

  readonly allDropListIds = ['schemes', 'heists', 'research', 'mayhem', 'player', 'mission-board'];

  minionsByDept = computed(() => {
    const result: Record<TaskCategory, Minion[]> = {
      schemes: [], heists: [], research: [], mayhem: [],
    };
    for (const m of this.minions()) {
      result[m.assignedDepartment].push(m);
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
    if (fromQueue === targetQueue) return; // same column, no move needed

    if (fromQueue === 'mission-board') {
      // Dragged from mission board — route the mission to the target queue
      this.taskRouted.emit({ taskId: task.id, target: targetQueue });
    } else {
      this.taskMoved.emit({
        taskId: task.id,
        from: fromQueue as QueueTarget,
        to: targetQueue,
      });
    }
  }
}
