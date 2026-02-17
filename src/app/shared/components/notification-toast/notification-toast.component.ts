import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { GameNotification } from '../../../core/models';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
             animate-notification-in shadow-lg"
      [class]="toastClasses()"
      (click)="dismiss.emit(notification().id)">
      <span>{{ icon() }}</span>
      <span>{{ notification().message }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class NotificationToastComponent {
  notification = input.required<GameNotification>();
  dismiss = output<string>();

  icon = computed(() => {
    switch (this.notification().type) {
      case 'gold': return '🪙';
      case 'minion': return '👾';
      case 'task': return '✅';
    }
  });

  toastClasses = computed(() => {
    switch (this.notification().type) {
      case 'gold':
        return 'bg-gold/20 text-gold border border-gold/30';
      case 'minion':
        return 'bg-tier-sinister/20 text-tier-sinister border border-tier-sinister/30';
      case 'task':
        return 'bg-tier-petty/20 text-tier-petty border border-tier-petty/30';
    }
  });
}
