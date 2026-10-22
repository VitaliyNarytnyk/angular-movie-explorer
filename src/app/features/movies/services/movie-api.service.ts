import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '@env/environment.local';
import type { MovieDetails } from '@features/movies/models/movie-details.model';
import type { MovieFilters } from '@features/movies/models/movie-filters.model';
import type { MovieGenreListResponse } from '@features/movies/models/movie-genre-list-response.model';
import type { MovieListResponse } from '@features/movies/models/movie-list-response.model';

@Service()
export class MovieApiService {
  private readonly http = inject(HttpClient);
  private readonly headers = {
    Authorization: `Bearer ${environment.tmdbReadAccessToken}`,
  };

  getPopularMovies(page: number): Observable<MovieListResponse> {
    return this.get('/movie/popular', { page });
  }

  searchMovies(query: string, page: number): Observable<MovieListResponse> {
    return this.get('/search/movie', { query, page });
  }

  discoverMovies(
    filters: MovieFilters,
    page: number,
  ): Observable<MovieListResponse> {
    const params: Record<string, string | number> = {
      page,
      sort_by: filters.sortBy,
    };

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

    return this.get('/discover/movie', params);
  }

  getMovieDetails(id: number): Observable<MovieDetails> {
    return this.get(`/movie/${id}`, { append_to_response: 'credits' });
  }

  getSimilarMovies(id: number): Observable<MovieListResponse> {
    return this.get(`/movie/${id}/similar`);
  }

  getGenres(): Observable<MovieGenreListResponse> {
    return this.get('/genre/movie/list');
  }

  private get<T>(
    endpoint: string,
    params: Record<string, string | number> = {},
  ): Observable<T> {
    return this.http.get<T>(`${environment.tmdbApiUrl}${endpoint}`, {
      headers: this.headers,
      params,
    });
  }
}
