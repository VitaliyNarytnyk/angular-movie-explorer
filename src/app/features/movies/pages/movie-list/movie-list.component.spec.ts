import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { MovieSearchComponent } from '../../components/movie-search/movie-search.component';
import { Movie } from '../../models/movie.model';
import { MovieService } from '../../services/movie.service';
import { MovieListComponent } from './movie-list.component';

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
});
