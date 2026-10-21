import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { CarouselComponent } from './carousel.component';

describe('CarouselComponent', () => {
  afterEach(() => vi.unstubAllGlobals());

  function setup() {
    const fixture = TestBed.createComponent(CarouselComponent);
    fixture.componentRef.setInput('label', 'cast');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const viewport =
      element.querySelector<HTMLDivElement>('.carousel-viewport')!;
    Object.defineProperties(viewport, {
      clientWidth: { value: 400 },
      scrollWidth: { value: 1000 },
    });
    const updatePosition = (left: number) => {
      viewport.scrollLeft = left;
      viewport.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
    };
    updatePosition(0);
    return {
      viewport,
      updatePosition,
      buttons: element.querySelectorAll('button'),
    };
  }

  it('disables controls at each edge and enables both between them', () => {
    const { buttons, updatePosition } = setup();
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(false);
    updatePosition(300);
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
    updatePosition(600);
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(true);
  });

  it('scrolls in either direction and respects reduced motion', () => {
    const { viewport, buttons, updatePosition } = setup();
    const scrollBy = vi.fn();
    viewport.scrollBy = scrollBy;
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    buttons[1].click();
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: 340,
      behavior: 'instant',
    });
    updatePosition(400);
    buttons[0].click();
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: -340,
      behavior: 'instant',
    });
  });
});
