import type {
  MovieFilters,
  MovieSortField,
} from '@features/movies/models/movie-filters.model';

export const MAX_MOVIE_PAGES = 500;

export const DEFAULT_MOVIE_FILTERS: MovieFilters = {
  genreIds: [],
  yearFrom: null,
  yearTo: null,
  minRating: null,
  minVotes: null,
  sortBy: 'popularity.desc',
};

export const MOVIE_SORT_FIELDS: readonly {
  value: MovieSortField;
  label: string;
  asc: string;
  desc: string;
}[] = [
  {
    value: 'popularity',
    label: 'Popularity',
    asc: 'Least popular',
    desc: 'Most popular',
  },
  {
    value: 'vote_average',
    label: 'Rating',
    asc: 'Lowest rated',
    desc: 'Highest rated',
  },
  {
    value: 'primary_release_date',
    label: 'Date',
    asc: 'Oldest first',
    desc: 'Newest first',
  },
  {
    value: 'original_title',
    label: 'Title',
    asc: 'Original titles: A to Z',
    desc: 'Original titles: Z to A',
  },
];

export const MOVIE_SORT_OPTIONS = MOVIE_SORT_FIELDS.flatMap((field) =>
  (['desc', 'asc'] as const).map((direction) => ({
    value: `${field.value}.${direction}` as const,
    field: field.value,
    direction,
    label: field[direction],
  })),
);
