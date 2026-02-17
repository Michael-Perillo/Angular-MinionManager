import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Minion } from '../../../core/models';
import { MinionCardComponent } from '../minion-card/minion-card.component';

@Component({
  selector: 'app-minion-roster',
  standalone: true,
  imports: [MinionCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-text-primary font-display uppercase tracking-wider">
          Minion Roster
        </h2>
        <span class="text-xs text-text-muted">
          {{ minions().length }} minion{{ minions().length !== 1 ? 's' : '' }}
        </span>
      </div>

      @if (minions().length === 0) {
        <div class="game-card p-6 text-center">
          <p class="text-text-muted text-sm">No minions yet.</p>
          <p class="text-text-muted text-xs mt-1">Earn gold to hire your first minion!</p>
        </div>
      } @else {
        <div class="flex flex-col gap-2">
          @for (minion of minions(); track minion.id) {
            <app-minion-card [minion]="minion" />
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
export class MinionRosterComponent {
  minions = input.required<Minion[]>();
}
