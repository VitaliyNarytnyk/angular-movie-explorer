import { Service, signal } from '@angular/core';
import { DEFAULT_MOVIE_FILTERS } from '@features/movies/constants/movie.constants';
import type {
  MovieCatalogMode,
  MovieCatalogQuery,
} from '@features/movies/models/movie-catalog-query.model';

@Service()
export class MovieCatalogStateService {
  private readonly savedQueries = signal<
    Partial<Record<MovieCatalogMode, MovieCatalogQuery>>
  >({});

  remember(query: MovieCatalogQuery): void {
    this.savedQueries.update((queries) => ({
      ...queries,
      [query.mode]: query,
    }));
  }

  restore(mode: MovieCatalogMode): MovieCatalogQuery {
    return (
      this.savedQueries()[mode] ?? {
        mode,
        query: '',
        page: 1,
        filters: { ...DEFAULT_MOVIE_FILTERS, genreIds: [] },
      }
    );
  }
}
