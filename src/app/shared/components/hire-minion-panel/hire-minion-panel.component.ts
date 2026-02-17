import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-hire-minion-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-card p-4 flex flex-col gap-3">
      <h3 class="text-sm font-bold uppercase tracking-wider text-text-secondary">
        Hire Minion
      </h3>

      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-text-muted">Next minion cost</div>
          <div class="text-lg font-bold text-gold">{{ cost() }}g</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-text-muted">Your gold</div>
          <div class="text-lg font-bold text-gold">{{ gold() }}g</div>
        </div>
      </div>

      <button
        (click)="hire.emit()"
        [disabled]="!canHire()"
        class="w-full py-2.5 px-4 rounded-lg font-bold text-sm uppercase tracking-wider
               transition-all duration-200 cursor-pointer"
        [class]="buttonClasses()">
        @if (canHire()) {
          Hire Minion ({{ cost() }}g)
        } @else {
          Need {{ cost() - gold() }} more gold
        }
      </button>

      <div class="text-xs text-text-muted text-center">
        Minions: {{ minionCount() }} | Cost scales with each hire
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class HireMinionPanelComponent {
  gold = input.required<number>();
  cost = input.required<number>();
  minionCount = input.required<number>();
  canHire = input.required<boolean>();

  hire = output<void>();

  buttonClasses = computed(() =>
    this.canHire()
      ? 'bg-gold text-bg-primary hover:bg-gold-dark active:scale-95'
      : 'bg-white/5 text-text-muted cursor-not-allowed'
  );
}
