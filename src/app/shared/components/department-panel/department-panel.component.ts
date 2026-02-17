import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TaskCategory } from '../../../core/models/task.model';
import { Department, deptXpForLevel, DEPARTMENT_LABELS, availableTiersForDeptLevel } from '../../../core/models/department.model';

@Component({
  selector: 'app-department-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-bold text-text-primary font-display uppercase tracking-wider">
        Departments
      </h2>

      <div class="flex flex-col gap-2">
        @for (dept of deptList(); track dept.category) {
          <div class="game-card p-3">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="text-sm">{{ getDeptIcon(dept.category) }}</span>
                <span class="text-sm font-semibold text-text-primary">
                  {{ getDeptLabel(dept.category) }}
                </span>
                <span class="text-xs text-text-muted">Lv.{{ dept.level }}</span>
              </div>
              <div class="flex gap-1">
                @for (tier of getTierBadges(dept.level); track tier) {
                  <span class="text-[9px] px-1 py-0.5 rounded" [class]="getTierClass(tier)">
                    {{ tier }}
                  </span>
                }
              </div>
            </div>

            <!-- XP bar -->
            <div class="flex items-center gap-1.5">
              <div class="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  [class]="getDeptBarColor(dept.category)"
                  [style.width.%]="getDeptXpPercent(dept)">
                </div>
              </div>
              <span class="text-[10px] text-text-muted tabular-nums w-16 text-right">
                {{ dept.xp }}/{{ getNextLevelXp(dept.level) }}
              </span>
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

  getTierBadges(level: number): string[] {
    return availableTiersForDeptLevel(level);
  }

  getTierClass(tier: string): string {
    switch (tier) {
      case 'petty': return 'bg-tier-petty/20 text-tier-petty';
      case 'sinister': return 'bg-tier-sinister/20 text-tier-sinister';
      case 'diabolical': return 'bg-tier-diabolical/20 text-tier-diabolical';
      case 'legendary': return 'bg-amber-500/20 text-amber-400';
      default: return '';
    }
  }

  getDeptXpPercent(dept: Department): number {
    const currentXp = deptXpForLevel(dept.level);
    const nextXp = deptXpForLevel(dept.level + 1);
    const range = nextXp - currentXp;
    if (range <= 0) return 100;
    return Math.min(100, ((dept.xp - currentXp) / range) * 100);
  }

  getNextLevelXp(level: number): number {
    return deptXpForLevel(level + 1);
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
