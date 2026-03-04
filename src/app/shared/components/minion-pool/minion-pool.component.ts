import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Minion } from '../../../core/models/minion.model';
import { MinionChipComponent } from '../minion-chip/minion-chip.component';

@Component({
  selector: 'app-minion-pool',
  standalone: true,
  imports: [CdkDropList, MinionChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center gap-2 px-3 py-2 min-h-[52px] rounded-lg border border-border bg-bg-card/30
             overflow-x-auto"
      cdkDropList
      id="minion-pool"
      [cdkDropListData]="'minion-pool'"
      [cdkDropListConnectedTo]="connectedDropLists()"
      (cdkDropListDropped)="onDrop($event)">

      @if (minions().length === 0) {
        <span class="text-xs text-text-muted italic whitespace-nowrap">
          No unassigned minions — hire in the shop between quarters
        </span>
      } @else {
        <span class="text-xs text-text-muted shrink-0 mr-1">Pool:</span>
        @for (minion of minions(); track minion.id) {
          <app-minion-chip
            [minion]="minion"
            [dragDisabled]="dragDisabled()" />
        }
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .cdk-drop-list-dragging app-minion-chip:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `,
})
export class MinionPoolComponent {
  minions = input.required<Minion[]>();
  connectedDropLists = input<string[]>([]);
  dragDisabled = input<boolean>(false);

  minionDropped = output<CdkDragDrop<any>>();

  onDrop(event: CdkDragDrop<any>): void {
    this.minionDropped.emit(event);
  }
}
