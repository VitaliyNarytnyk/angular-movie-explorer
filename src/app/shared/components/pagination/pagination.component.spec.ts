import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 10);
    await fixture.whenStable();
  });

  it('emits the selected page number', () => {
    const selectedPages: number[] = [];
    component.pageChanged.subscribe((page) => selectedPages.push(page));

    element
      .querySelector<HTMLButtonElement>('[aria-label="Go to page 2"]')
      ?.click();

    expect(selectedPages).toEqual([2]);
  });

  it('emits the adjacent page when an arrow is clicked', async () => {
    fixture.componentRef.setInput('currentPage', 5);
    await fixture.whenStable();

    const selectedPages: number[] = [];
    component.pageChanged.subscribe((page) => selectedPages.push(page));

    element
      .querySelector<HTMLButtonElement>('[aria-label="Previous page"]')
      ?.click();
    element
      .querySelector<HTMLButtonElement>('[aria-label="Next page"]')
      ?.click();

    expect(selectedPages).toEqual([4, 6]);
  });

  it.each([
    { currentPage: 1, pages: [1, 2, 3, 4, 5] },
    { currentPage: 10, pages: [6, 7, 8, 9, 10] },
  ])(
    'respects pagination boundaries on page $currentPage',
    async ({ currentPage, pages }) => {
      fixture.componentRef.setInput('currentPage', currentPage);
      await fixture.whenStable();

      const pageButtons = element.querySelectorAll<HTMLButtonElement>(
        '[aria-label^="Go to page "]',
      );

      expect(
        Array.from(pageButtons, (button) => Number(button.textContent)),
      ).toEqual(pages);
      expect(
        element.querySelector('[aria-current="page"]')?.textContent?.trim(),
      ).toBe(String(currentPage));
      expect(
        element.querySelector<HTMLButtonElement>('[aria-label="Previous page"]')
          ?.disabled,
      ).toBe(currentPage === 1);
      expect(
        element.querySelector<HTMLButtonElement>('[aria-label="Next page"]')
          ?.disabled,
      ).toBe(currentPage === 10);
    },
  );

  it('disables all buttons and emits nothing while disabled', async () => {
    fixture.componentRef.setInput('currentPage', 5);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();

    const selectedPages: number[] = [];
    component.pageChanged.subscribe((page) => selectedPages.push(page));
    const buttons = element.querySelectorAll<HTMLButtonElement>('button');

    for (const button of buttons) {
      expect(button.disabled).toBe(true);
      button.click();
    }

    expect(selectedPages).toEqual([]);
  });
});
