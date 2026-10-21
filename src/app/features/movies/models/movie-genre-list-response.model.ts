import type { MovieGenre } from '@features/movies/models/movie-genre.model';

export interface MovieGenreListResponse {
  genres: MovieGenre[];
}
