import { DestroyRef, inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  finalize,
  Observable,
  Subject,
  switchMap,
} from 'rxjs';
import { MAX_MOVIE_PAGES } from '@features/movies/constants/movie.constants';
import type { Movie } from '@features/movies/models/movie.model';
import type { MovieDetails } from '@features/movies/models/movie-details.model';
import type { MovieListResponse } from '@features/movies/models/movie-list-response.model';
import type { MovieGenre } from '@features/movies/models/movie-genre.model';
import type { MovieFilters } from '@features/movies/models/movie-filters.model';
import { MovieApiService } from '@features/movies/services/movie-api.service';

@Service()
export class MovieService {
  private readonly api = inject(MovieApiService);
  private readonly movieQueries = new Subject<{
    query: string;
    page: number;
    filters?: MovieFilters;
  }>();
  private readonly movieIds = new Subject<number>();
  private readonly similarMovieIds = new Subject<number>();

  private readonly movieState = signal<Movie[]>([]);
  private readonly loadingState = signal(false);
  private readonly catalogInitializedState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly currentPageState = signal(1);
  private readonly totalPagesState = signal(0);

  private readonly detailsState = signal<MovieDetails | null>(null);
  private readonly detailsLoadingState = signal(false);
  private readonly detailsErrorState = signal<string | null>(null);
  private readonly similarMoviesState = signal<Movie[]>([]);
  private readonly similarLoadingState = signal(false);
  private readonly similarErrorState = signal<string | null>(null);

  private readonly destroyRef = inject(DestroyRef);

  private readonly genresState = signal<MovieGenre[]>([]);
  private readonly genresLoadingState = signal(false);
  private readonly genresErrorState = signal<string | null>(null);

  readonly movies = this.movieState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly catalogInitialized = this.catalogInitializedState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly currentPage = this.currentPageState.asReadonly();
  readonly totalPages = this.totalPagesState.asReadonly();

  readonly movieDetails = this.detailsState.asReadonly();
  readonly detailsLoading = this.detailsLoadingState.asReadonly();
  readonly detailsError = this.detailsErrorState.asReadonly();
  readonly similarMovies = this.similarMoviesState.asReadonly();
  readonly similarLoading = this.similarLoadingState.asReadonly();
  readonly similarError = this.similarErrorState.asReadonly();

  readonly genres = this.genresState.asReadonly();
  readonly genresLoading = this.genresLoadingState.asReadonly();
  readonly genresError = this.genresErrorState.asReadonly();

  constructor() {
    this.movieQueries
      .pipe(
        switchMap(({ query, page, filters }) =>
          this.loadMovies(query, page, filters),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((response) => {
        this.movieState.set(response.results);
        this.currentPageState.set(response.page);
        this.totalPagesState.set(
          Math.min(response.total_pages, MAX_MOVIE_PAGES),
        );
        this.catalogInitializedState.set(true);
      });

    this.movieIds
      .pipe(
        switchMap((id) => this.loadMovieDetails(id)),
        takeUntilDestroyed(),
      )
      .subscribe((movie) => {
        this.detailsState.set(movie);
      });

    this.similarMovieIds
      .pipe(
        switchMap((id) => this.loadSimilarMovies(id)),
        takeUntilDestroyed(),
      )
      .subscribe((response) =>
        this.similarMoviesState.set(response.results.slice(0, 8)),
      );
  }

  getPopularMovies(page = 1): void {
    this.movieQueries.next({
      query: '',
      page,
    });
  }

  searchMovies(keyword: string, page = 1): void {
    this.movieQueries.next({
      query: keyword.trim(),
      page,
    });
  }

  discoverMovies(filters: MovieFilters, page = 1): void {
    this.movieQueries.next({
      query: '',
      page,
      filters,
    });
  }

  getGenres(): void {
    if (this.genresState().length > 0 || this.genresLoadingState()) {
      return;
    }

    this.genresLoadingState.set(true);
    this.genresErrorState.set(null);

    this.api
      .getGenres()
      .pipe(
        finalize(() => {
          this.genresLoadingState.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ genres }) => {
          this.genresState.set(genres);
        },
        error: () => {
          this.genresErrorState.set('Unable to load genres. Please try again.');
        },
      });
  }

  getMovieDetails(id: number): void {
    this.movieIds.next(id);
  }

  getSimilarMovies(id: number): void {
    this.similarMovieIds.next(id);
  }

  private loadSimilarMovies(id: number): Observable<MovieListResponse> {
    this.similarMoviesState.set([]);
    this.similarLoadingState.set(true);
    this.similarErrorState.set(null);

    return this.api.getSimilarMovies(id).pipe(
      catchError(() => {
        this.similarErrorState.set(
          'Unable to load similar movies. Please try again.',
        );
        return EMPTY;
      }),
      finalize(() => this.similarLoadingState.set(false)),
    );
  }

  private loadMovies(
    query: string,
    page = 1,
    filters?: MovieFilters,
  ): Observable<MovieListResponse> {
    this.loadingState.set(true);
    this.errorState.set(null);

    let request: Observable<MovieListResponse>;
    if (filters) {
      request = this.api.discoverMovies(filters, page);
    } else if (query) {
      request = this.api.searchMovies(query, page);
    } else {
      request = this.api.getPopularMovies(page);
    }

    return request.pipe(
      catchError(() => {
        this.movieState.set([]);
        this.errorState.set('Unable to load movies. Please try again.');
        this.catalogInitializedState.set(true);

        return EMPTY;
      }),
      finalize(() => {
        this.loadingState.set(false);
      }),
    );
  }

  private loadMovieDetails(id: number): Observable<MovieDetails> {
    this.detailsLoadingState.set(true);
    this.detailsErrorState.set(null);

    return this.api.getMovieDetails(id).pipe(
      catchError(() => {
        this.detailsErrorState.set(
          'Unable to load movie details. Please try again.',
        );

        return EMPTY;
      }),
      finalize(() => {
        this.detailsLoadingState.set(false);
      }),
    );
  }
}
