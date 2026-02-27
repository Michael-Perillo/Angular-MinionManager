import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

export type MobileTab = 'missions' | 'work' | 'click' | 'more';

@Component({
  selector: 'app-mobile-bottom-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-border
                flex items-stretch safe-area-bottom">
      @for (tab of tabs; track tab.id) {
        <button
          (click)="tabSelected.emit(tab.id)"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 cursor-pointer
                 transition-colors min-h-[56px]"
          [class]="activeTab() === tab.id
            ? 'text-gold'
            : 'text-text-muted'">
          <span class="text-xl">{{ tab.icon }}</span>
          <span class="text-xs font-semibold uppercase tracking-wider">{{ tab.label }}</span>
        </button>
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  `,
})
export class MobileBottomNavComponent {
  activeTab = input.required<MobileTab>();
  hasAlert = input<boolean>(false);

  tabSelected = output<MobileTab>();

  readonly tabs: { id: MobileTab; icon: string; label: string }[] = [
    { id: 'missions', icon: '📋', label: 'Missions' },
    { id: 'work', icon: '⚔️', label: 'Work' },
    { id: 'click', icon: '👆', label: 'Click' },
    { id: 'more', icon: '⚙️', label: 'More' },
  ];
}
