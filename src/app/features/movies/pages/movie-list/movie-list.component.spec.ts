import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { MovieSearchComponent } from '@features/movies/components/movie-search/movie-search.component';
import type { Movie } from '@features/movies/models/movie.model';
import { MovieSearchHistoryService } from '@features/movies/services/movie-search-history.service';
import { MovieCardComponent } from '@features/movies/components/movie-card/movie-card.component';
import { MovieService } from '@features/movies/services/movie.service';
import { MovieListComponent } from './movie-list.component';
import { MovieFiltersComponent } from '@features/movies/components/movie-filters/movie-filters.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { DEFAULT_MOVIE_FILTERS } from '@features/movies/constants/movie.constants';

describe('MovieListComponent', () => {
  let fixture: ComponentFixture<MovieListComponent>;
  let element: HTMLElement;

  const movies = signal<Movie[]>([]);
  const loading = signal(false);
  const catalogInitialized = signal(false);
  const error = signal<string | null>(null);
  const currentPage = signal(1);
  const totalPages = signal(0);
  const getPopularMovies = vi.fn();
  const searchMovies = vi.fn();
  const discoverMovies = vi.fn();
  const getGenres = vi.fn();
  const genres = signal([]);
  const genresLoading = signal(false);
  const genresError = signal<string | null>(null);

  const movie: Movie = {
    id: 497,
    title: 'The Green Mile',
    overview: 'A prison guard meets an inmate with an extraordinary gift.',
    poster_path: null,
    release_date: '1999-12-10',
    vote_average: 8.5,
  };

  beforeEach(async () => {
    movies.set([]);
    loading.set(false);
    catalogInitialized.set(false);
    error.set(null);
    currentPage.set(1);
    totalPages.set(0);
    getPopularMovies.mockClear();
    searchMovies.mockClear();
    discoverMovies.mockClear();
    getGenres.mockClear();

    await TestBed.configureTestingModule({
      imports: [MovieListComponent],
      providers: [
        provideRouter([]),
        {
          provide: MovieService,
          useValue: {
            movies: movies.asReadonly(),
            loading: loading.asReadonly(),
            catalogInitialized: catalogInitialized.asReadonly(),
            error: error.asReadonly(),
            currentPage: currentPage.asReadonly(),
            totalPages: totalPages.asReadonly(),
            getPopularMovies,
            searchMovies,
            discoverMovies,
            getGenres,
            genres: genres.asReadonly(),
            genresLoading: genresLoading.asReadonly(),
            genresError: genresError.asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieListComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('requests popular movies when the page initializes', () => {
    expect(getPopularMovies).toHaveBeenCalledTimes(1);
  });

  it('displays the loading state', () => {
    loading.set(true);
    fixture.detectChanges();

    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'Loading movies',
    );

    expect(element.querySelector('app-movie-card')).toBeNull();
  });

  it('displays an error message', () => {
    error.set('Unable to load movies. Please try again.');
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to load movies. Please try again.',
    );

    expect(element.querySelector('app-movie-card')).toBeNull();
  });

  it('displays the empty state', () => {
    expect(element.textContent).toContain('No movies found.');
  });

  it('renders a card for each movie', () => {
    movies.set([
      movie,
      {
        id: 37165,
        title: 'The Truman Show',
        overview: 'An ordinary man discovers his life is a television show.',
        poster_path: null,
        release_date: '1998-06-04',
        vote_average: 8.2,
      },
    ]);
    fixture.detectChanges();

    const cards = element.querySelectorAll('app-movie-card');

    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('The Green Mile');
    expect(cards[1].textContent).toContain('The Truman Show');
  });

  it.each(['The Green Mile', ''])(
    'updates the URL and loads movies for the search keyword %j',
    async (keyword) => {
      const router = TestBed.inject(Router);

      await router.navigate([], {
        queryParams: {
          query: 'previous search',
          page: 2,
        },
      });
      await fixture.whenStable();

      searchMovies.mockClear();
      getPopularMovies.mockClear();

      const searchComponent = fixture.debugElement.query(
        By.directive(MovieSearchComponent),
      ).componentInstance as MovieSearchComponent;

      searchComponent.searchRequested.emit(keyword);
      await fixture.whenStable();

      const params = router.parseUrl(router.url).queryParams;

      expect(params).toEqual(keyword ? { query: keyword } : {});

      if (keyword) {
        expect(searchMovies).toHaveBeenCalledExactlyOnceWith(keyword, 1);
        expect(getPopularMovies).not.toHaveBeenCalled();
      } else {
        expect(getPopularMovies).toHaveBeenCalledExactlyOnceWith(1);
        expect(searchMovies).not.toHaveBeenCalled();
      }
    },
  );

  it.each([1, 2])(
    'retries the failed search from page %i on submission',
    async (page) => {
      const router = TestBed.inject(Router);
      const keyword = 'The Green Mile';

      await router.navigate([], {
        queryParams: {
          query: keyword,
          page: page === 1 ? null : page,
        },
      });
      await fixture.whenStable();

      error.set('Unable to load movies. Please try again.');
      searchMovies.mockClear();
      getPopularMovies.mockClear();
      fixture.detectChanges();

      const searchComponent = fixture.debugElement.query(
        By.directive(MovieSearchComponent),
      ).componentInstance as MovieSearchComponent;

      searchComponent.searchRequested.emit(keyword);
      await fixture.whenStable();

      expect(router.parseUrl(router.url).queryParams).toEqual({
        query: keyword,
      });
      expect(searchMovies).toHaveBeenCalledExactlyOnceWith(keyword, 1);
      expect(getPopularMovies).not.toHaveBeenCalled();
    },
  );

  it('restores discovery filters and pagination from the URL', async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], {
      queryParams: {
        mode: 'discover',
        genres: '18,14',
        from: '1999',
        to: '2000',
        rating: 7,
        votes: 100,
        sort: 'vote_average.desc',
        page: 2,
      },
    });
    await fixture.whenStable();

    expect(getGenres).toHaveBeenCalled();
    expect(discoverMovies).toHaveBeenLastCalledWith(
      {
        ...DEFAULT_MOVIE_FILTERS,
        genreIds: [14, 18],
        yearFrom: 1999,
        yearTo: 2000,
        minRating: 7,
        minVotes: 100,
        sortBy: 'vote_average.desc',
      },
      2,
    );
    expect(element.querySelector('input[type="search"]')).toBeNull();
  });

  it('applies filters from page one and preserves them when changing pages', async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], { queryParams: { mode: 'discover', page: 3 } });
    await fixture.whenStable();

    const filters = {
      ...DEFAULT_MOVIE_FILTERS,
      genreIds: [18],
      sortBy: 'original_title.asc' as const,
      yearFrom: 1999,
      yearTo: 2000,
    };
    const form = fixture.debugElement.query(By.directive(MovieFiltersComponent))
      .componentInstance as MovieFiltersComponent;
    form.filtersApplied.emit(filters);
    await fixture.whenStable();

    expect(router.parseUrl(router.url).queryParams).toEqual({
      mode: 'discover',
      genres: '18',
      sort: 'original_title.asc',
      from: '1999',
      to: '2000',
    });
    expect(discoverMovies).toHaveBeenLastCalledWith(filters, 1);

    currentPage.set(1);
    totalPages.set(3);
    fixture.detectChanges();
    const pagination = fixture.debugElement.query(
      By.directive(PaginationComponent),
    ).componentInstance as PaginationComponent;
    pagination.pageChanged.emit(2);
    await fixture.whenStable();

    expect(router.parseUrl(router.url).queryParams).toEqual({
      mode: 'discover',
      genres: '18',
      sort: 'original_title.asc',
      from: '1999',
      to: '2000',
      page: '2',
    });
    expect(discoverMovies).toHaveBeenLastCalledWith(filters, 2);
  });

  it('ignores legacy year filters in title search', async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], {
      queryParams: { query: 'The Green Mile', year: 1999 },
    });
    await fixture.whenStable();

    expect(searchMovies).toHaveBeenLastCalledWith('The Green Mile', 1);
    expect(element.querySelector('app-movie-filters')).toBeNull();
    expect(getGenres).not.toHaveBeenCalled();
  });

  it('clears incompatible filters when switching back to title search', async () => {
    const router = TestBed.inject(Router);
    await router.navigate([], {
      queryParams: {
        mode: 'discover',
        genres: '18',
        from: '1999',
        to: '2000',
        rating: 7,
        page: 2,
      },
    });
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('[aria-pressed="false"]')?.click();
    await fixture.whenStable();

    expect(router.parseUrl(router.url).queryParams).toEqual({});
    expect(getPopularMovies).toHaveBeenLastCalledWith(1);
  });
  it('restores each mode after switching and recreating the catalog page', async () => {
    const router = TestBed.inject(Router);
    const searchParams = { query: 'Green', page: '2' };
    const discoverParams = {
      mode: 'discover',
      genres: '18',
      from: '1999',
      rating: '7',
      sort: 'vote_average.desc',
      page: '3',
    };
    const switchMode = async (label: string) => {
      Array.from(element.querySelectorAll('button'))
        .find((button) => button.textContent?.trim() === label)
        ?.click();
      await fixture.whenStable();
    };

    await router.navigate([], { queryParams: searchParams });
    await fixture.whenStable();
    await switchMode('Discover movies');
    expect(router.parseUrl(router.url).queryParams).toEqual({
      mode: 'discover',
    });

    await router.navigate([], { queryParams: discoverParams });
    await fixture.whenStable();
    fixture.destroy();
    fixture = TestBed.createComponent(MovieListComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();

    await switchMode('Search by title');
    expect(router.parseUrl(router.url).queryParams).toEqual(searchParams);
    expect(searchMovies).toHaveBeenLastCalledWith('Green', 2);
    expect(
      element.querySelector<HTMLInputElement>('input[type="search"]')?.value,
    ).toBe('Green');

    await switchMode('Discover movies');
    expect(router.parseUrl(router.url).queryParams).toEqual(discoverParams);
    expect(discoverMovies).toHaveBeenLastCalledWith(
      {
        ...DEFAULT_MOVIE_FILTERS,
        genreIds: [18],
        yearFrom: 1999,
        minRating: 7,
        sortBy: 'vote_average.desc',
      },
      3,
    );
  });
  it('remembers the applied title query when a result is opened', async () => {
    const history = TestBed.inject(MovieSearchHistoryService);
    const remember = vi
      .spyOn(history, 'remember')
      .mockImplementation(() => undefined);
    const router = TestBed.inject(Router);
    await router.navigate([], { queryParams: { query: 'The Green Mile' } });
    movies.set([movie]);
    await fixture.whenStable();
    const card = fixture.debugElement.query(By.directive(MovieCardComponent))
      .componentInstance as MovieCardComponent;
    card.movieSelected.emit();
    expect(remember).toHaveBeenCalledExactlyOnceWith('The Green Mile');

    await router.navigate([], { queryParams: { mode: 'discover' } });
    await fixture.whenStable();
    remember.mockClear();
    const discoveryCard = fixture.debugElement.query(
      By.directive(MovieCardComponent),
    ).componentInstance as MovieCardComponent;
    discoveryCard.movieSelected.emit();
    expect(remember).not.toHaveBeenCalled();
  });
});
