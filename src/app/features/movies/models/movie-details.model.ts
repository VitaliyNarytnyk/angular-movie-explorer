import { Movie } from './movie.model';

export interface MovieGenre {
  id: number;
  name: string;
}

export interface MovieDetails extends Movie {
  genres: MovieGenre[];
}
