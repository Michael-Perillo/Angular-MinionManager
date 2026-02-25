import {
  Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') text = '';
  @Input('appTooltipPosition') position: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private tooltipEl: HTMLElement | null = null;
  private touchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
  ) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.show();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hide();
  }

  @HostListener('touchstart')
  onTouchStart(): void {
    this.show();
    this.touchTimeout = setTimeout(() => this.hide(), 2000);
  }

  ngOnDestroy(): void {
    this.hide();
    if (this.touchTimeout) clearTimeout(this.touchTimeout);
  }

  private show(): void {
    if (this.tooltipEl || !this.text) return;

    this.tooltipEl = this.renderer.createElement('div');
    const tip = this.tooltipEl!;
    this.renderer.appendChild(tip, this.renderer.createText(this.text));

    // Style
    const classes = [
      'fixed', 'z-[9999]', 'pointer-events-none',
      'bg-neutral-900', 'text-neutral-100',
      'text-xs', 'rounded', 'px-2', 'py-1',
      'shadow-lg', 'max-w-xs', 'whitespace-normal',
      'border', 'border-white/10',
    ];
    for (const cls of classes) {
      this.renderer.addClass(tip, cls);
    }

    this.renderer.appendChild(document.body, tip);

    // Position after append so dimensions are known
    requestAnimationFrame(() => {
      if (!this.tooltipEl) return;
      const hostRect = this.el.nativeElement.getBoundingClientRect();
      const tipRect = tip.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (this.position) {
        case 'top':
          top = hostRect.top - tipRect.height - 6;
          left = hostRect.left + (hostRect.width - tipRect.width) / 2;
          break;
        case 'bottom':
          top = hostRect.bottom + 6;
          left = hostRect.left + (hostRect.width - tipRect.width) / 2;
          break;
        case 'left':
          top = hostRect.top + (hostRect.height - tipRect.height) / 2;
          left = hostRect.left - tipRect.width - 6;
          break;
        case 'right':
          top = hostRect.top + (hostRect.height - tipRect.height) / 2;
          left = hostRect.right + 6;
          break;
      }

      // Clamp within viewport
      top = Math.max(4, Math.min(top, window.innerHeight - tipRect.height - 4));
      left = Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4));

      this.renderer.setStyle(tip, 'top', `${top}px`);
      this.renderer.setStyle(tip, 'left', `${left}px`);
    });
  }

  private hide(): void {
    if (this.tooltipEl) {
      this.renderer.removeChild(document.body, this.tooltipEl);
      this.tooltipEl = null;
    }
  }
}
