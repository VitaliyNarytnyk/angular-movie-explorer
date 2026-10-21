import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  finalize,
  Observable,
  Subject,
  switchMap,
} from 'rxjs';
import type { Movie } from '@features/movies/models/movie.model';
import type { MovieDetails } from '@features/movies/models/movie-details.model';
import type { MovieListResponse } from '@features/movies/models/movie-list-response.model';
import { MAX_MOVIE_PAGES } from '@features/movies/constants/movie.constants';
import { environment } from '@env/environment.local';

@Service()
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly headers = {
    Authorization: `Bearer ${environment.tmdbReadAccessToken}`,
  };
  private readonly movieQueries = new Subject<{
    query: string;
    page: number;
  }>();
  private readonly movieIds = new Subject<number>();

  private readonly movieState = signal<Movie[]>([]);
  private readonly loadingState = signal(false);
  private readonly catalogInitializedState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly currentPageState = signal(1);
  private readonly totalPagesState = signal(0);

  private readonly detailsState = signal<MovieDetails | null>(null);
  private readonly detailsLoadingState = signal(false);
  private readonly detailsErrorState = signal<string | null>(null);

  readonly movies = this.movieState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly catalogInitialized = this.catalogInitializedState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly currentPage = this.currentPageState.asReadonly();
  readonly totalPages = this.totalPagesState.asReadonly();

  readonly movieDetails = this.detailsState.asReadonly();
  readonly detailsLoading = this.detailsLoadingState.asReadonly();
  readonly detailsError = this.detailsErrorState.asReadonly();

  constructor() {
    this.movieQueries
      .pipe(
        switchMap(({ query, page }) => this.loadMovies(query, page)),
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

  getMovieDetails(id: number): void {
    this.movieIds.next(id);
  }

  private loadMovies(query: string, page = 1): Observable<MovieListResponse> {
    this.loadingState.set(true);
    this.errorState.set(null);

    const endpoint = query ? '/search/movie' : '/movie/popular';
    const params: Record<string, string | number> = query
      ? { query, page }
      : { page };

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
