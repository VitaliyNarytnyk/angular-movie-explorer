import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css',
})
export class CarouselComponent {
  readonly label = input.required<string>();
  readonly heading = input<string>();
  readonly headingId = input<string>();
  private readonly viewport =
    viewChild.required<ElementRef<HTMLDivElement>>('viewport');
  private readonly content =
    viewChild.required<ElementRef<HTMLDivElement>>('content');
  private readonly destroyRef = inject(DestroyRef);
  protected readonly canScrollBack = signal(false);
  protected readonly canScrollForward = signal(false);

  constructor() {
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.updateControls());
      observer.observe(this.viewport().nativeElement);
      observer.observe(this.content().nativeElement);
      this.updateControls();
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected updateControls(): void {
    const element = this.viewport().nativeElement;
    this.canScrollBack.set(element.scrollLeft > 1);
    this.canScrollForward.set(
      element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
    );
  }

  protected scroll(direction: number): void {
    const element = this.viewport().nativeElement;
    element.scrollBy({
      left: direction * element.clientWidth * 0.85,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
}
