import { Component, ChangeDetectionStrategy, input, output, signal, OnInit } from '@angular/core';
import { Task, TaskCategory, QueueTarget } from '../../../core/models/task.model';
import { DEPARTMENT_LABELS } from '../../../core/models/department.model';

interface QueueOption {
  target: QueueTarget;
  label: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-mission-router',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 z-40"
        (click)="close()">
      </div>

      <!-- Sheet -->
      <div class="fixed z-50 mission-router-sheet"
           [class]="isMobile() ? 'bottom-0 left-0 right-0' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px]'">
        <div class="bg-bg-secondary border border-border rounded-t-2xl p-4 flex flex-col gap-2"
             [class]="isMobile() ? 'rounded-t-2xl rounded-b-none' : 'rounded-2xl'">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">
              Send to...
            </h3>
            <button
              (click)="close()"
              class="text-text-muted hover:text-text-primary text-lg cursor-pointer p-1">
              ✕
            </button>
          </div>

          @for (option of queueOptions(); track option.target) {
            <button
              (click)="selectQueue(option.target)"
              class="w-full flex items-center justify-between p-3 rounded-lg
                     bg-bg-card border border-border hover:border-accent/40
                     transition-all cursor-pointer min-h-[48px]">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ option.icon }}</span>
                <span class="text-sm font-semibold text-text-primary">{{ option.label }}</span>
              </div>
              <span class="text-xs text-text-muted">({{ option.count }} queued)</span>
            </button>
          }

          <button
            (click)="close()"
            class="w-full mt-2 py-2 px-4 rounded-lg text-sm text-text-muted
                   border border-border hover:border-text-muted
                   transition-all cursor-pointer min-h-[48px]">
            CANCEL
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class MissionRouterComponent implements OnInit {
  mission = input<Task | null>(null);
  deptQueueCounts = input.required<Record<TaskCategory, number>>();
  playerQueueCount = input.required<number>();
  isMobile = input<boolean>(false);

  queueSelected = output<{ missionId: string; target: QueueTarget }>();
  closed = output<void>();

  initiallyOpen = input(false);

  visible = signal(false);

  ngOnInit(): void {
    if (this.initiallyOpen()) this.visible.set(true);
  }

  queueOptions = (): QueueOption[] => {
    const counts = this.deptQueueCounts();
    const categories: TaskCategory[] = ['schemes', 'heists', 'research', 'mayhem'];

    const options: QueueOption[] = categories.map(cat => ({
      target: cat as QueueTarget,
      label: DEPARTMENT_LABELS[cat].label,
      icon: DEPARTMENT_LABELS[cat].icon,
      count: counts[cat],
    }));

    options.push({
      target: 'player',
      label: 'My Workbench',
      icon: '👆',
      count: this.playerQueueCount(),
    });

    return options;
  };

  open(): void {
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
    this.closed.emit();
  }

  selectQueue(target: QueueTarget): void {
    const m = this.mission();
    if (!m) return;
    this.queueSelected.emit({ missionId: m.id, target });
    this.close();
  }
}
