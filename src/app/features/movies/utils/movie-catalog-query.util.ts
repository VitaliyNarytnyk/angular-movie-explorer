import type { ParamMap, Params } from '@angular/router';
import {
  DEFAULT_MOVIE_FILTERS,
  MAX_MOVIE_PAGES,
  MOVIE_SORT_OPTIONS,
} from '@features/movies/constants/movie.constants';
import type { MovieCatalogQuery } from '@features/movies/models/movie-catalog-query.model';
import { isMovieReleaseDate } from '@features/movies/utils/movie-release-date.util';

function readNumber(
  value: string | null,
  minimum: number,
  maximum: number,
  integer = false,
): number | null {
  if (value === null || String(value).trim() === '') return null;

  const number = Number(value);

  return Number.isFinite(number) &&
    number >= minimum &&
    number <= maximum &&
    (!integer || Number.isSafeInteger(number))
    ? number
    : null;
}

function readYear(value: string | null): number | null {
  const year = value && isMovieReleaseDate(value) ? value.slice(0, 4) : value;
  return readNumber(year, 1000, 9999, true);
}

function normalizeGenreIds(ids: number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}

export function parseMovieCatalogQuery(params: ParamMap): MovieCatalogQuery {
  const mode = params.get('mode') === 'discover' ? 'discover' : 'search';
  const page = readNumber(params.get('page'), 1, MAX_MOVIE_PAGES, true) ?? 1;
  const state: MovieCatalogQuery = {
    mode,
    query: mode === 'search' ? (params.get('query') ?? '').trim() : '',
    page,
    filters: { ...DEFAULT_MOVIE_FILTERS, genreIds: [] },
  };
  if (mode === 'search') return state;

  let yearFrom = readYear(params.get('from'));
  let yearTo = readYear(params.get('to'));
  const year = readYear(params.get('year'));

  // Keep existing discovery links with a single year usable.
  if (!params.has('from') && !params.has('to') && year !== null) {
    yearFrom = year;
    yearTo = year;
  }

  if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) {
    yearFrom = null;
    yearTo = null;
  }

  return {
    ...state,
    filters: {
      genreIds: normalizeGenreIds(
        (params.get('genres') ?? '')
          .split(',')
          .map((id) => readNumber(id, 1, Number.MAX_SAFE_INTEGER, true))
          .filter((id): id is number => id !== null),
      ),
      yearFrom,
      yearTo,
      minRating: readNumber(params.get('rating'), 0, 10),
      minVotes: readNumber(
        params.get('votes'),
        0,
        Number.MAX_SAFE_INTEGER,
        true,
      ),
      sortBy:
        MOVIE_SORT_OPTIONS.find((option) => option.value === params.get('sort'))
          ?.value ?? DEFAULT_MOVIE_FILTERS.sortBy,
    },
  };
}

export function movieCatalogQueryParams(state: MovieCatalogQuery): Params {
  const discover = state.mode === 'discover';
  const filters = state.filters;

  return {
    mode: discover ? 'discover' : null,
    query: !discover && state.query ? state.query : null,
    page: state.page > 1 ? state.page : null,
    year: null,
    from: discover ? filters.yearFrom : null,
    to: discover ? filters.yearTo : null,
    genres:
      discover && filters.genreIds.length > 0
        ? normalizeGenreIds(filters.genreIds).join(',')
        : null,
    rating: discover ? filters.minRating : null,
    votes: discover ? filters.minVotes : null,
    sort:
      discover && filters.sortBy !== DEFAULT_MOVIE_FILTERS.sortBy
        ? filters.sortBy
        : null,
  };
}

export function movieCatalogQueriesEqual(
  a: MovieCatalogQuery,
  b: MovieCatalogQuery,
): boolean {
  const first = a.filters;
  const second = b.filters;

  return (
    a.mode === b.mode &&
    a.query === b.query &&
    a.page === b.page &&
    first.yearFrom === second.yearFrom &&
    first.yearTo === second.yearTo &&
    first.minRating === second.minRating &&
    first.minVotes === second.minVotes &&
    first.sortBy === second.sortBy &&
    normalizeGenreIds(first.genreIds).join(',') ===
      normalizeGenreIds(second.genreIds).join(',')
  );
}
