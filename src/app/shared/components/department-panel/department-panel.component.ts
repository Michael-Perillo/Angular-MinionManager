import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TaskCategory } from '../../../core/models/task.model';
import { Department, deptXpForLevel, DEPARTMENT_LABELS, availableTiersForDeptLevel, DEPARTMENT_PASSIVES, getPassiveBonus } from '../../../core/models/department.model';
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
              <span class="text-xs text-text-muted tabular-nums w-16 text-right">
                {{ dept.xp }}/{{ getNextLevelXp(dept.level) }}
              </span>
            </div>

            <!-- Department passive -->
            <div class="mt-1 text-xs" [class]="dept.level > 1 ? 'text-green-400' : 'text-text-muted/60'">
              {{ getPassiveName(dept.category) }}: {{ getPassiveDescription(dept.category) }}
              @if (dept.level > 1) {
                <span class="font-semibold">({{ getPassiveBonusValue(dept.category, dept.level) }}{{ getPassiveUnit(dept.category) }})</span>
              } @else {
                <span class="italic">(unlocks at Lv.2)</span>
              }
            </div>

            <!-- Tier roadmap -->
            <div class="mt-1.5 flex items-center gap-1 flex-wrap">
              @for (milestone of tierMilestones; track milestone.tier) {
                <span
                  class="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5"
                  [class]="dept.level >= milestone.level
                    ? getTierClass(milestone.tier)
                    : 'bg-white/5 text-text-muted/50'"
                  [appTooltip]="'Unlocks at dept level ' + milestone.level"
                  [appTooltipPosition]="'bottom'">
                  @if (dept.level >= milestone.level) {
                    <span class="text-[8px]">✓</span>
                  } @else {
                    <span class="text-[8px]">Lv.{{ milestone.level }}</span>
                  }
                  {{ milestone.tier }}
                </span>
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

  tierMilestones = [
    { tier: 'petty', level: 1 },
    { tier: 'sinister', level: 3 },
    { tier: 'diabolical', level: 5 },
    { tier: 'legendary', level: 8 },
  ];

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
    const passive = DEPARTMENT_PASSIVES[category];
    const level = this.departments()[category].level;
    const bonus = getPassiveBonus(category, level);
    let tip = `Complete ${category} missions to level up. Higher levels unlock better tiers.`;
    tip += ` Passive: ${passive.name} — ${passive.description}`;
    if (bonus > 0) tip += ` (${bonus}${passive.unit})`;
    return tip;
  }

  getPassiveName(category: TaskCategory): string {
    return DEPARTMENT_PASSIVES[category].name;
  }

  getPassiveDescription(category: TaskCategory): string {
    return DEPARTMENT_PASSIVES[category].description;
  }

  getPassiveBonusValue(category: TaskCategory, level: number): number {
    return getPassiveBonus(category, level);
  }

  getPassiveUnit(category: TaskCategory): string {
    return DEPARTMENT_PASSIVES[category].unit;
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
