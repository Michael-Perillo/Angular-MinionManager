import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { Minion } from '../../../core/models/minion.model';
import { DEPARTMENT_LABELS } from '../../../core/models/department.model';
import { TaskCategory } from '../../../core/models/task.model';

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

      @if (candidates() === null) {
        <!-- Show "Recruit" button to generate candidates -->
        <button
          (click)="onRecruit()"
          [disabled]="!canHire()"
          class="w-full py-2.5 px-4 rounded-lg font-bold text-sm uppercase tracking-wider
                 transition-all duration-200 cursor-pointer"
          [class]="recruitButtonClasses()">
          @if (canHire()) {
            Scout Recruits ({{ cost() }}g)
          } @else {
            Need {{ cost() - gold() }} more gold
          }
        </button>
      } @else {
        <!-- Show two candidate cards -->
        <p class="text-xs text-text-secondary text-center">Choose your new minion:</p>
        <div class="grid grid-cols-2 gap-2">
          @for (minion of candidates()!; track minion.id; let i = $index) {
            <button
              (click)="onChoose(minion)"
              class="flex flex-col items-center gap-1.5 p-3 rounded-lg
                     bg-bg-card border border-border hover:border-gold/50
                     transition-all cursor-pointer active:scale-95 text-left">
              <!-- Minion avatar -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                [style.background-color]="minion.appearance.color">
                {{ getAccessoryEmoji(minion) }}
              </div>

              <!-- Name -->
              <span class="text-sm font-bold text-text-primary">{{ minion.name }}</span>

              <!-- Specialty / Department -->
              <span class="text-xs px-1.5 py-0.5 rounded-full"
                    [class]="isNewDept(minion) ? 'bg-gold/20 text-gold font-bold' : 'bg-white/5 text-text-secondary'">
                {{ getDeptIcon(minion.specialty) }} {{ getDeptLabel(minion.specialty) }}
                @if (isNewDept(minion)) {
                  <span class="text-[9px] uppercase"> new!</span>
                }
              </span>

              <!-- Stats -->
              <div class="w-full flex flex-col gap-0.5 mt-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-text-secondary">Speed</span>
                  <span class="text-text-primary font-semibold">{{ minion.stats.speed.toFixed(2) }}</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-text-secondary">Efficiency</span>
                  <span class="text-text-primary font-semibold">{{ minion.stats.efficiency.toFixed(2) }}</span>
                </div>
              </div>
            </button>
          }
        </div>

        <button
          (click)="onCancel()"
          class="w-full py-1.5 px-3 rounded text-xs text-text-muted
                 border border-border hover:border-text-muted transition-all cursor-pointer">
          Cancel
        </button>
      }

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
  unlockedDepartments = input<Set<TaskCategory>>(new Set());

  recruit = output<void>();
  hireChosen = output<Minion>();

  candidates = signal<[Minion, Minion] | null>(null);

  recruitButtonClasses = computed(() =>
    this.canHire()
      ? 'bg-gold text-bg-primary hover:bg-gold-dark active:scale-95'
      : 'bg-white/5 text-text-muted cursor-not-allowed'
  );

  onRecruit(): void {
    this.recruit.emit();
  }

  showCandidates(pair: [Minion, Minion]): void {
    this.candidates.set(pair);
  }

  onChoose(minion: Minion): void {
    this.hireChosen.emit(minion);
    this.candidates.set(null);
  }

  onCancel(): void {
    this.candidates.set(null);
  }

  isNewDept(minion: Minion): boolean {
    const unlocked = this.unlockedDepartments();
    return unlocked.size > 0 && !unlocked.has(minion.specialty);
  }

  getAccessoryEmoji(minion: Minion): string {
    switch (minion.appearance.accessory) {
      case 'goggles': return '🥽';
      case 'helmet': return '⛑️';
      case 'cape': return '🦹';
      case 'horns': return '😈';
      case 'none': return '👾';
    }
  }

  getDeptIcon(cat: TaskCategory): string {
    return DEPARTMENT_LABELS[cat].icon;
  }

  getDeptLabel(cat: TaskCategory): string {
    return DEPARTMENT_LABELS[cat].label;
  }
}
