import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Modifier } from '../../../core/models/reviewer.model';

@Component({
  selector: 'app-modifier-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          [class]="badgeClass()"
          [title]="modifier().description">
      {{ categoryIcon() }} {{ modifier().name }}
    </span>
  `,
  styles: `
    :host {
      display: inline-block;
    }
  `,
})
export class ModifierBadgeComponent {
  modifier = input.required<Modifier>();

  badgeClass = computed(() => {
    switch (this.modifier().category) {
      case 'task-constraint':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'operational-constraint':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'economic-penalty':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    }
  });

  categoryIcon = computed(() => {
    switch (this.modifier().category) {
      case 'task-constraint': return '🎯';
      case 'operational-constraint': return '🚫';
      case 'economic-penalty': return '💸';
    }
  });
}
