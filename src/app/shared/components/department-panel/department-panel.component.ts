import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TaskCategory } from '../../../core/models/task.model';
import { Department, DEPARTMENT_LABELS, getDeptMult } from '../../../core/models/department.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-department-panel',
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-bold text-text-primary font-display uppercase tracking-wider">
        Departments
      </h2>

      <div class="flex flex-col gap-2">
        @for (dept of deptList(); track dept.category) {
          <div
            class="game-card p-3"
            [appTooltip]="getDeptTooltip(dept.category)"
            [appTooltipPosition]="'left'">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="text-sm">{{ getDeptIcon(dept.category) }}</span>
                <span class="text-sm font-semibold text-text-primary">
                  {{ getDeptLabel(dept.category) }}
                </span>
                <span class="text-xs text-text-muted">Lv.{{ dept.level }}</span>
              </div>
              <span class="text-xs font-semibold"
                    [class]="dept.level > 1 ? 'text-green-400' : 'text-text-muted'">
                +{{ getDeptMultValue(dept.level) }} mult
              </span>
            </div>

            <!-- Mult info -->
            <div class="mt-1 text-xs" [class]="dept.level > 1 ? 'text-green-400' : 'text-text-muted/60'">
              @if (dept.level > 1) {
                Gold mult: +{{ getDeptMultValue(dept.level) }} per matching task
              } @else {
                Level up for +1 mult per task
              }
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class DepartmentPanelComponent {
  departments = input.required<Record<TaskCategory, Department>>();

  deptList = computed(() => {
    const depts = this.departments();
    return (['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[]).map(cat => depts[cat]);
  });

  getDeptIcon(category: TaskCategory): string {
    return DEPARTMENT_LABELS[category].icon;
  }

  getDeptLabel(category: TaskCategory): string {
    return DEPARTMENT_LABELS[category].label;
  }

  getDeptTooltip(category: TaskCategory): string {
    const level = this.departments()[category].level;
    const mult = getDeptMult(level);
    let tip = `Complete ${category} missions to level up. +1 mult per level above 1.`;
    if (mult > 0) tip += ` Current: +${mult} mult.`;
    return tip;
  }

  getDeptMultValue(level: number): number {
    return getDeptMult(level);
  }

  getDeptBarColor(category: TaskCategory): string {
    switch (category) {
      case 'schemes': return 'bg-purple-500';
      case 'heists': return 'bg-blue-500';
      case 'research': return 'bg-green-500';
      case 'mayhem': return 'bg-red-500';
    }
  }
}
