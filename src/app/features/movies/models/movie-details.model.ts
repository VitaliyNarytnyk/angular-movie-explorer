import type { Movie } from '@features/movies/models/movie.model';
import type { MovieGenre } from '@features/movies/models/movie-genre.model';
import type { MovieCredits } from '@features/movies/models/movie-credits.model';

export interface MovieDetails extends Movie {
  genres: MovieGenre[];
  original_title: string;
  original_language: string;
  backdrop_path: string | null;
  tagline: string;
  runtime: number | null;
  status: string;
  vote_count: number;
  credits?: MovieCredits;
}
