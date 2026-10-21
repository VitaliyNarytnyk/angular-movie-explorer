import type { MovieFilters } from '@features/movies/models/movie-filters.model';

export type MovieCatalogMode = 'search' | 'discover';

export interface MovieCatalogQuery {
  mode: MovieCatalogMode;
  query: string;
  page: number;
  filters: MovieFilters;
}
