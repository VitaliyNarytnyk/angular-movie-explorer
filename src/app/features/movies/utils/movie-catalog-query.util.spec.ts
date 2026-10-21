import { convertToParamMap } from '@angular/router';
import { DEFAULT_MOVIE_FILTERS } from '@features/movies/constants/movie.constants';
import {
  movieCatalogQueryParams,
  parseMovieCatalogQuery,
} from './movie-catalog-query.util';

describe('movie catalog URL parameters', () => {
  it('normalizes invalid values and deduplicates genre IDs', () => {
    const state = parseMovieCatalogQuery(
      convertToParamMap({
        mode: 'discover',
        page: '999',
        genres: '18,14,18,wrong,-1',
        year: '1999.5',
        rating: '11',
        votes: '-10',
        sort: 'unsupported',
        query: 'ignored',
      }),
    );
    expect(state).toEqual({
      mode: 'discover',
      query: '',
      page: 1,
      filters: { ...DEFAULT_MOVIE_FILTERS, genreIds: [14, 18] },
    });
  });

  it('round trips discovery filters and keeps zero values', () => {
    const state = parseMovieCatalogQuery(
      convertToParamMap({
        mode: 'discover',
        page: 2,
        genres: '18,14',
        from: 1999,
        to: 2000,
        rating: 0,
        votes: 0,
        sort: 'vote_average.desc',
      }),
    );
    expect(
      parseMovieCatalogQuery(convertToParamMap(movieCatalogQueryParams(state))),
    ).toEqual(state);
    expect(state.filters.minRating).toBe(0);
    expect(state.filters.minVotes).toBe(0);
  });

  it.each(['original_title.asc', 'original_title.desc'])(
    'restores and serializes alphabetic sorting %s',
    (sort) => {
      const state = parseMovieCatalogQuery(
        convertToParamMap({ mode: 'discover', sort, page: 2 }),
      );
      expect(state.filters.sortBy).toBe(sort);
      expect(movieCatalogQueryParams(state)).toMatchObject({
        mode: 'discover',
        sort,
        page: 2,
      });
    },
  );

  it.each([
    ['1999-02-29', 'not-a-date'],
    ['2001', '2000'],
    ['999', '10000'],
  ])('discards invalid release year bounds %s and %s', (from, to) => {
    const state = parseMovieCatalogQuery(
      convertToParamMap({ mode: 'discover', from, to }),
    );
    expect(state.filters.yearFrom).toBeNull();
    expect(state.filters.yearTo).toBeNull();
  });

  it('restores a legacy date link as an open year range', () => {
    const state = parseMovieCatalogQuery(
      convertToParamMap({ mode: 'discover', from: '2000-02-29' }),
    );
    expect(state.filters.yearFrom).toBe(2000);
    expect(state.filters.yearTo).toBeNull();
  });

  it('preserves existing discovery links that use a single year', () => {
    const state = parseMovieCatalogQuery(
      convertToParamMap({ mode: 'discover', year: '1999' }),
    );
    expect(state.filters.yearFrom).toBe(1999);
    expect(state.filters.yearTo).toBe(1999);
    expect(movieCatalogQueryParams(state)).toMatchObject({
      year: null,
      from: 1999,
      to: 1999,
    });
  });

  it('ignores all filters in title search mode', () => {
    const state = parseMovieCatalogQuery(
      convertToParamMap({
        query: ' The Green Mile ',
        year: 1999,
        genres: '18',
        rating: 7,
        from: '1990-01-01',
        to: 2000,
      }),
    );
    expect(state).toEqual({
      mode: 'search',
      query: 'The Green Mile',
      page: 1,
      filters: { ...DEFAULT_MOVIE_FILTERS, genreIds: [] },
    });
  });
});
