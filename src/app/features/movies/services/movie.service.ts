import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Movie } from '../models/movie.model';
import { MovieListResponse } from '../models/movie-list-response.model';
import { environment } from '../../../../environments/environment.local';
import { finalize } from 'rxjs';

@Service()
export class MovieService {
  private readonly http = inject(HttpClient);

  private readonly movieState = signal<Movie[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly movies = this.movieState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  getPopularMovies(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.http
      .get<MovieListResponse>(`${environment.tmdbApiUrl}/movie/popular`, {
        headers: { Authorization: `Bearer ${environment.tmdbReadAccessToken}` },
      })
      .pipe(
        finalize(() => {
          this.loadingState.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.movieState.set(response.results);
        },
        error: () => {
          this.movieState.set([]);
          this.errorState.set('Unable to load movies. Please try again.');
        },
      });
  }
}
