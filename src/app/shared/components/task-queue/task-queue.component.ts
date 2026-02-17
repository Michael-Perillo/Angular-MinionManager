import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Task } from '../../../core/models';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-queue',
  standalone: true,
  imports: [TaskCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-text-primary font-display uppercase tracking-wider">
          Active Missions
        </h2>
        <span class="text-xs text-text-muted">
          {{ tasks().length }} / {{ capacity() }} slots
        </span>
      </div>

      @if (tasks().length === 0) {
        <div class="game-card p-8 text-center">
          <p class="text-text-muted text-sm">No active missions.</p>
          <p class="text-text-muted text-xs mt-1">Accept missions from the board below!</p>
        </div>
      } @else {
        <div class="flex flex-col gap-2">
          @for (task of tasks(); track task.id) {
            <app-task-card
              [task]="task"
              (workClicked)="taskClicked.emit($event)" />
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
export class TaskQueueComponent {
  tasks = input.required<Task[]>();
  capacity = input<number>(5);
  taskClicked = output<string>();
}
