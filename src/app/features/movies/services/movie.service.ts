import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Movie } from '../models/movie.model';
import { MovieListResponse } from '../models/movie-list-response.model';
import { environment } from '../../../../environments/environment.local';
import {
  catchError,
  EMPTY,
  finalize,
  Observable,
  Subject,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Service()
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly movieQueries = new Subject<string>();

  private readonly movieState = signal<Movie[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly movies = this.movieState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  constructor() {
    this.movieQueries
      .pipe(
        switchMap((query) => this.loadMovies(query)),
        takeUntilDestroyed(),
      )
      .subscribe((response) => {
        this.movieState.set(response.results);
      });
  }

  getPopularMovies(): void {
    this.movieQueries.next('');
  }

  searchMovies(keyword: string): void {
    this.movieQueries.next(keyword.trim());
  }

  private loadMovies(query: string): Observable<MovieListResponse> {
    this.loadingState.set(true);
    this.errorState.set(null);

    const endpoint = query ? '/search/movie' : '/movie/popular';
    const params: Record<string, string> = query ? { query } : {};

    return this.http
      .get<MovieListResponse>(`${environment.tmdbApiUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${environment.tmdbReadAccessToken}`,
        },
        params,
      })
      .pipe(
        catchError(() => {
          this.movieState.set([]);
          this.errorState.set('Unable to load movies. Please try again.');

          return EMPTY;
        }),
        finalize(() => {
          this.loadingState.set(false);
        }),
      );
  }
}
