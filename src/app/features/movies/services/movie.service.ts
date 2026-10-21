import { HttpClient } from '@angular/common/http';
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
import { environment } from '@env/environment.local';
import type { Movie } from '@features/movies/models/movie.model';
import type { MovieDetails } from '@features/movies/models/movie-details.model';
import type { MovieListResponse } from '@features/movies/models/movie-list-response.model';
import type { MovieGenre } from '@features/movies/models/movie-genre.model';
import type { MovieGenreListResponse } from '@features/movies/models/movie-genre-list-response.model';
import type { MovieFilters } from '@features/movies/models/movie-filters.model';

@Service()
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly headers = {
    Authorization: `Bearer ${environment.tmdbReadAccessToken}`,
  };
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

    this.http
      .get<MovieGenreListResponse>(
        `${environment.tmdbApiUrl}/genre/movie/list`,
        { headers: this.headers },
      )
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

    return this.http
      .get<MovieListResponse>(`${environment.tmdbApiUrl}/movie/${id}/similar`, {
        headers: this.headers,
      })
      .pipe(
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

    const endpoint = filters
      ? '/discover/movie'
      : query
        ? '/search/movie'
        : '/movie/popular';

    const params: Record<string, string | number> = { page };

    if (filters) {
      params['sort_by'] = filters.sortBy;

      if (filters.genreIds.length > 0) {
        params['with_genres'] = filters.genreIds.join('|');
      }

      if (filters.yearFrom !== null) {
        params['primary_release_date.gte'] = `${filters.yearFrom}-01-01`;
      }

      if (filters.yearTo !== null) {
        params['primary_release_date.lte'] = `${filters.yearTo}-12-31`;
      }

      if (filters.minRating !== null) {
        params['vote_average.gte'] = filters.minRating;
      }

      if (filters.minVotes !== null) {
        params['vote_count.gte'] = filters.minVotes;
      }
    } else if (query) {
      params['query'] = query;
    }

    return this.http
      .get<MovieListResponse>(`${environment.tmdbApiUrl}${endpoint}`, {
        headers: this.headers,
        params,
      })
      .pipe(
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

    return this.http
      .get<MovieDetails>(`${environment.tmdbApiUrl}/movie/${id}`, {
        headers: this.headers,
        params: { append_to_response: 'credits' },
      })
      .pipe(
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
