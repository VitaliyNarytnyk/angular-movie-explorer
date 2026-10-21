import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DEFAULT_MOVIE_FILTERS } from '@features/movies/constants/movie.constants';
import { MovieFiltersComponent } from './movie-filters.component';

describe('MovieFiltersComponent', () => {
  let fixture: ComponentFixture<MovieFiltersComponent>;
  let element: HTMLElement;
  const applied = vi.fn();

  beforeEach(async () => {
    applied.mockClear();
    await TestBed.configureTestingModule({
      imports: [MovieFiltersComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MovieFiltersComponent);
    fixture.componentRef.setInput('genres', [{ id: 18, name: 'Drama' }]);
    fixture.componentInstance.filtersApplied.subscribe(applied);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  async function enter(selector: string, value: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement | HTMLSelectElement>(
      selector,
    );
    if (!input) throw new Error(`Missing input: ${selector}`);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  }

  async function apply(): Promise<void> {
    element
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
  }

  it('keeps changes as a draft until applied', async () => {
    element.querySelector<HTMLButtonElement>('button[aria-pressed]')?.click();
    await enter('#movie-filter-from', '1999');
    await enter('#movie-filter-to', '2000');
    await enter('#movie-filter-rating', '7.5');
    await enter('#movie-filter-votes', '100');
    const select =
      element.querySelector<HTMLSelectElement>('#movie-filter-sort');
    if (!select) throw new Error('Missing sort select');
    select.value = 'vote_average';
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();

    expect(applied).not.toHaveBeenCalled();
    await apply();
    expect(applied).toHaveBeenCalledExactlyOnceWith({
      ...DEFAULT_MOVIE_FILTERS,
      genreIds: [18],
      yearFrom: 1999,
      yearTo: 2000,
      minRating: 7.5,
      minVotes: 100,
      sortBy: 'vote_average.desc',
    });
  });

  it('applies title sorting in either direction and restores it from the parent', async () => {
    await enter('#movie-filter-sort', 'original_title');
    element
      .querySelector('#movie-filter-sort')
      ?.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(element.querySelector('#movie-sort-order')?.textContent).toContain(
      'Original titles: A to Z',
    );
    await apply();
    expect(applied).toHaveBeenLastCalledWith({
      ...DEFAULT_MOVIE_FILTERS,
      sortBy: 'original_title.asc',
    });

    element
      .querySelector<HTMLButtonElement>(
        '[aria-label="Switch to descending order"]',
      )
      ?.click();
    await fixture.whenStable();
    await apply();
    expect(applied).toHaveBeenLastCalledWith({
      ...DEFAULT_MOVIE_FILTERS,
      sortBy: 'original_title.desc',
    });

    fixture.componentRef.setInput('filters', {
      ...DEFAULT_MOVIE_FILTERS,
      sortBy: 'original_title.desc',
    });
    await fixture.whenStable();
    expect(
      element.querySelector<HTMLSelectElement>('#movie-filter-sort')?.value,
    ).toBe('original_title');
    expect(element.querySelector('#movie-sort-order')?.textContent).toContain(
      'Original titles: Z to A',
    );
  });

  it('restores slider values and treats zero as no minimum', async () => {
    fixture.componentRef.setInput('filters', {
      ...DEFAULT_MOVIE_FILTERS,
      minRating: 7.3,
      minVotes: 5000,
    });
    await fixture.whenStable();
    expect(
      element.querySelector<HTMLInputElement>('#movie-filter-rating')?.value,
    ).toBe('7.3');
    expect(
      element.querySelector<HTMLInputElement>('#movie-filter-votes')?.value,
    ).toBe('5000');
    expect(
      element.querySelector<HTMLInputElement>('#movie-filter-votes')?.max,
    ).toBe('5000');

    await enter('#movie-filter-rating', '0');
    await enter('#movie-filter-votes', '0');
    await apply();
    expect(applied).toHaveBeenCalledExactlyOnceWith(DEFAULT_MOVIE_FILTERS);
  });

  it('toggles genre buttons without applying the draft', async () => {
    const genre = element.querySelector<HTMLButtonElement>(
      'button[aria-pressed]',
    );
    genre?.click();
    await fixture.whenStable();
    expect(genre?.getAttribute('aria-pressed')).toBe('true');
    genre?.click();
    await fixture.whenStable();
    expect(genre?.getAttribute('aria-pressed')).toBe('false');
    expect(applied).not.toHaveBeenCalled();
    await apply();
    expect(applied).toHaveBeenCalledExactlyOnceWith(DEFAULT_MOVIE_FILTERS);
  });

  it('rejects a reversed range and allows submission after correction', async () => {
    await enter('#movie-filter-from', '2000');
    await enter('#movie-filter-to', '1999');
    await apply();
    expect(applied).not.toHaveBeenCalled();
    expect(
      element.querySelector('#movie-filter-to')?.getAttribute('aria-invalid'),
    ).toBe('true');
    expect(
      element.querySelector('#movie-filter-to')?.closest('details')?.open,
    ).toBe(true);
    expect(element.textContent).toContain(
      'The end year must be the same as or later than the start year.',
    );

    await enter('#movie-filter-to', '2000');
    await apply();
    expect(applied).toHaveBeenCalledExactlyOnceWith({
      ...DEFAULT_MOVIE_FILTERS,
      yearFrom: 2000,
      yearTo: 2000,
    });
  });

  it('resets values and immediately applies the defaults', async () => {
    fixture.componentRef.setInput('filters', {
      ...DEFAULT_MOVIE_FILTERS,
      genreIds: [18],
      yearFrom: 1999,
      yearTo: 1999,
    });
    await fixture.whenStable();
    Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === 'Reset')
      ?.click();
    await fixture.whenStable();
    expect(applied).toHaveBeenCalledExactlyOnceWith(DEFAULT_MOVIE_FILTERS);
    expect(element.querySelector('#movie-sort-order')?.textContent).toContain(
      'Most popular',
    );
    expect(
      element.querySelector<HTMLSelectElement>('#movie-filter-from')?.value,
    ).toBe('');
    expect(
      element
        .querySelector('button[aria-pressed]')
        ?.getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('restores applied values when the parent changes them', async () => {
    await enter('#movie-filter-from', '2000');
    fixture.componentRef.setInput('filters', {
      ...DEFAULT_MOVIE_FILTERS,
      genreIds: [],
      yearFrom: 1999,
    });
    await fixture.whenStable();
    expect(
      element.querySelector<HTMLSelectElement>('#movie-filter-from')?.value,
    ).toBe('1999');
    expect(applied).not.toHaveBeenCalled();
  });
});
