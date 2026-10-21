import {
  Component,
  computed,
  ElementRef,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { form, FormField, max, min, validate } from '@angular/forms/signals';
import {
  DEFAULT_MOVIE_FILTERS,
  MOVIE_SORT_FIELDS,
  MOVIE_SORT_OPTIONS,
} from '@features/movies/constants/movie.constants';
import type { MovieFilters } from '@features/movies/models/movie-filters.model';
import type { MovieGenre } from '@features/movies/models/movie-genre.model';

@Component({
  imports: [FormField, DecimalPipe],
  selector: 'app-movie-filters',
  styleUrl: './movie-filters.component.css',
  templateUrl: './movie-filters.component.html',
})
export class MovieFiltersComponent {
  private readonly filtersPanel =
    viewChild<ElementRef<HTMLDetailsElement>>('filtersPanel');
  readonly filters = input<MovieFilters>(DEFAULT_MOVIE_FILTERS);
  readonly genres = input<MovieGenre[]>([]);
  readonly genresLoading = input(false);
  readonly genresError = input<string | null>(null);

  readonly filtersApplied = output<MovieFilters>();
  readonly genresRetryRequested = output<void>();
  protected readonly sortFields = MOVIE_SORT_FIELDS;
  protected readonly votesMaximum = computed(() =>
    Math.max(1000, this.filters().minVotes ?? 0),
  );
  protected readonly sortLabel = computed(() => {
    const { sortField, sortDirection } = this.filtersModel();
    return MOVIE_SORT_OPTIONS.find(
      (option) => option.value === `${sortField}.${sortDirection}`,
    )?.label;
  });

  private readonly latestYear = new Date().getFullYear() + 5;
  protected readonly years = computed(() => {
    const years = Array.from(
      { length: this.latestYear - 1870 + 1 },
      (_, index) => this.latestYear - index,
    );
    const filters = this.filters();
    const selectedYears = [filters.yearFrom, filters.yearTo];
    for (const selected of selectedYears) {
      if (selected && !years.includes(selected)) years.push(selected);
    }
    return years.sort((a, b) => b - a);
  });

  protected readonly filtersModel = linkedSignal(() =>
    this.createDraft(this.filters()),
  );

  protected readonly filtersForm = form(this.filtersModel, (fields) => {
    for (const field of [fields.yearFrom, fields.yearTo]) {
      validate(field, ({ value }) =>
        value() && !/^[1-9]\d{3}$/.test(value())
          ? { kind: 'year', message: 'Select a release year.' }
          : undefined,
      );
    }

    validate(fields.yearTo, ({ value, valueOf }) => {
      const from = valueOf(fields.yearFrom);
      const to = value();
      return from && to && from > to
        ? {
            kind: 'yearRange',
            message:
              'The end year must be the same as or later than the start year.',
          }
        : undefined;
    });

    min(fields.minRating, 0);
    max(fields.minRating, 10);

    min(fields.minVotes, 0);
    max(fields.minVotes, () => this.votesMaximum());

    validate(fields.minVotes, ({ value }) => {
      const current = value();

      return current !== null && !Number.isInteger(current)
        ? {
            kind: 'integer',
            message: 'Enter a whole number.',
          }
        : undefined;
    });
  });

  protected toggleGenre(id: number): void {
    this.filtersModel.update((filters) => ({
      ...filters,
      genreIds: filters.genreIds.includes(id)
        ? filters.genreIds.filter((genreId) => genreId !== id)
        : [...filters.genreIds, id],
    }));

    this.filtersForm.genreIds().markAsDirty();
  }

  protected onSortFieldChange(): void {
    this.filtersForm
      .sortDirection()
      .value.set(
        this.filtersModel().sortField === 'original_title' ? 'asc' : 'desc',
      );
  }

  protected toggleSortDirection(): void {
    this.filtersForm
      .sortDirection()
      .value.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    this.filtersForm.sortDirection().markAsDirty();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.filtersForm().markAsTouched();

    if (this.filtersForm().invalid()) {
      const panel = this.filtersPanel()?.nativeElement;
      if (panel) panel.open = true;
      return;
    }

    const { yearFrom, yearTo, sortField, sortDirection, ...filters } =
      this.filtersModel();

    this.filtersApplied.emit({
      ...filters,
      genreIds: [...filters.genreIds],
      yearFrom: yearFrom ? Number(yearFrom) : null,
      yearTo: yearTo ? Number(yearTo) : null,
      sortBy: `${sortField}.${sortDirection}`,
      minRating: filters.minRating || null,
      minVotes: filters.minVotes || null,
    });
  }

  protected onReset(): void {
    const filters: MovieFilters = {
      ...DEFAULT_MOVIE_FILTERS,
      genreIds: [],
    };

    this.filtersForm().reset(this.createDraft(filters));
    this.filtersApplied.emit(filters);
  }

  private createDraft({ yearFrom, yearTo, sortBy, ...filters }: MovieFilters) {
    const sort =
      MOVIE_SORT_OPTIONS.find((option) => option.value === sortBy) ??
      MOVIE_SORT_OPTIONS[0];
    return {
      ...filters,
      minRating: filters.minRating ?? 0,
      minVotes: filters.minVotes ?? 0,
      genreIds: [...filters.genreIds],
      sortField: sort.field,
      sortDirection: sort.direction,
      yearFrom: yearFrom?.toString() ?? '',
      yearTo: yearTo?.toString() ?? '',
    };
  }
}
