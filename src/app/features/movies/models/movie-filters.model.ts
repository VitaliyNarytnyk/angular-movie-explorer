export type MovieSortField =
  'popularity' | 'vote_average' | 'primary_release_date' | 'original_title';

export type MovieSortDirection = 'asc' | 'desc';

export type MovieSort = `${MovieSortField}.${MovieSortDirection}`;

export interface MovieFilters {
  genreIds: number[];
  yearFrom: number | null;
  yearTo: number | null;
  minRating: number | null;
  minVotes: number | null;
  sortBy: MovieSort;
}
