import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MovieService } from './movie.service';
import { DEFAULT_MOVIE_FILTERS } from '@features/movies/constants/movie.constants';
import type { MovieListResponse } from '@features/movies/models/movie-list-response.model';
import type { MovieDetails } from '@features/movies/models/movie-details.model';
import type { MovieFilters } from '@features/movies/models/movie-filters.model';

describe('MovieService', () => {
  let service: MovieService;
  let httpTesting: HttpTestingController;

  const response: MovieListResponse = {
    page: 1,
    results: [
      {
        id: 497,
        title: 'The Green Mile',
        overview: 'A prison guard meets an inmate with an extraordinary gift.',
        poster_path: '/the-green-mile.jpg',
        release_date: '1999-12-10',
        vote_average: 8.5,
      },
    ],
    total_pages: 1,
    total_results: 1,
  };

  const detailsResponse: MovieDetails = {
    ...response.results[0],
    original_title: 'The Green Mile',
    original_language: 'en',
    backdrop_path: null,
    tagline: '',
    runtime: 189,
    status: 'Released',
    vote_count: 1000,
    genres: [
      { id: 18, name: 'Drama' },
      { id: 14, name: 'Fantasy' },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MovieService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads popular movies and updates the loading state', () => {
    service.getPopularMovies();

    expect(service.loading()).toBe(true);
    expect(service.error()).toBeNull();

    const request = httpTesting.expectOne((request) =>
      request.url.endsWith('/movie/popular'),
    );

    expect(request.request.method).toBe('GET');

    request.flush(response);

    expect(service.movies()).toEqual(response.results);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('shows an error and ends loading when the request fails', () => {
    service.getPopularMovies();

    const request = httpTesting.expectOne((request) =>
      request.url.endsWith('/movie/popular'),
    );

    request.flush(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });

    expect(service.movies()).toEqual([]);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBe('Unable to load movies. Please try again.');
  });

  it('searches movies using the trimmed keyword', () => {
    service.searchMovies(' The Green Mile ');

    expect(service.loading()).toBe(true);
    expect(service.error()).toBeNull();

    const request = httpTesting.expectOne((request) =>
      request.url.endsWith('/search/movie'),
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('query')).toBe('The Green Mile');

    request.flush(response);

    expect(service.movies()).toEqual(response.results);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it.each(['', '  '])(
    'loads popular movies when the keyword is %j',
    (keyword) => {
      service.searchMovies(keyword);

      const request = httpTesting.expectOne((request) =>
        request.url.endsWith('/movie/popular'),
      );

      expect(request.request.params.has('query')).toBe(false);

      request.flush(response);

      expect(service.movies()).toEqual(response.results);
      expect(service.loading()).toBe(false);
    },
  );

  it('cancels the previous search and keeps the latest one loading', () => {
    service.searchMovies('Green');

    const firstRequest = httpTesting.expectOne(
      (request) => request.params.get('query') === 'Green',
    );

    service.searchMovies('The Green Mile');

    expect(firstRequest.cancelled).toBe(true);
    expect(service.loading()).toBe(true);

    const latestRequest = httpTesting.expectOne(
      (request) => request.params.get('query') === 'The Green Mile',
    );

    latestRequest.flush(response);

    expect(service.movies()).toEqual(response.results);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('loads movie details without changing the movie list', () => {
    service.getPopularMovies();

    const listRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/movie/popular'),
    );

    listRequest.flush(response);

    service.getMovieDetails(497);

    expect(service.movieDetails()).toBeNull();
    expect(service.detailsLoading()).toBe(true);
    expect(service.detailsError()).toBeNull();

    expect(service.movies()).toEqual(response.results);
    expect(service.loading()).toBe(false);

    const detailsRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/movie/497'),
    );

    expect(detailsRequest.request.method).toBe('GET');

    detailsRequest.flush(detailsResponse);

    expect(service.movieDetails()).toEqual(detailsResponse);
    expect(service.detailsLoading()).toBe(false);
    expect(service.detailsError()).toBeNull();
    expect(service.movies()).toEqual(response.results);
  });

  it('shows a details error and allows another request to succeed', () => {
    service.getMovieDetails(497);

    const failedRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/movie/497'),
    );

    failedRequest.flush(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });

    expect(service.movieDetails()).toBeNull();
    expect(service.detailsLoading()).toBe(false);
    expect(service.detailsError()).toBe(
      'Unable to load movie details. Please try again.',
    );

    service.getMovieDetails(497);

    expect(service.detailsLoading()).toBe(true);
    expect(service.detailsError()).toBeNull();

    const retryRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/movie/497'),
    );

    retryRequest.flush(detailsResponse);

    expect(service.movieDetails()).toEqual(detailsResponse);
    expect(service.detailsLoading()).toBe(false);
    expect(service.detailsError()).toBeNull();
  });

  it('cancels the previous details request and loads the latest movie', () => {
    service.getMovieDetails(37165);

    const firstRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/movie/37165'),
    );

    service.getMovieDetails(497);

    expect(firstRequest.cancelled).toBe(true);
    expect(service.detailsLoading()).toBe(true);

    const latestRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/movie/497'),
    );

    latestRequest.flush(detailsResponse);

    expect(service.movieDetails()).toEqual(detailsResponse);
    expect(service.detailsLoading()).toBe(false);
    expect(service.detailsError()).toBeNull();
  });

  it('loads the requested search page', () => {
    service.searchMovies('The Green Mile');

    const firstRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/search/movie'),
    );

    firstRequest.flush({
      ...response,
      total_pages: 3,
    });

    service.searchMovies('The Green Mile', 2);

    const secondRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/search/movie'),
    );

    expect(secondRequest.request.params.get('query')).toBe('The Green Mile');
    expect(secondRequest.request.params.get('page')).toBe('2');

    secondRequest.flush({
      ...response,
      page: 2,
      total_pages: 3,
    });

    expect(service.currentPage()).toBe(2);
  });

  it('defaults to the first search page when page is omitted', () => {
    service.searchMovies('Green');

    const firstRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/search/movie'),
    );

    firstRequest.flush({
      ...response,
      total_pages: 3,
    });

    service.searchMovies('Green', 2);

    const secondRequest = httpTesting.expectOne(
      (request) => request.params.get('page') === '2',
    );

    secondRequest.flush({
      ...response,
      page: 2,
      total_pages: 3,
    });

    expect(service.currentPage()).toBe(2);

    service.searchMovies('The Green Mile');

    const newSearchRequest = httpTesting.expectOne((request) =>
      request.url.endsWith('/search/movie'),
    );

    expect(newSearchRequest.request.params.get('query')).toBe('The Green Mile');
    expect(newSearchRequest.request.params.get('page')).toBe('1');

    newSearchRequest.flush(response);

    expect(service.currentPage()).toBe(1);
  });

  it('cancels stale similar movie requests without replacing the main catalog', () => {
    service.getPopularMovies();
    httpTesting
      .expectOne((request) => request.url.endsWith('/movie/popular'))
      .flush(response);
    service.getSimilarMovies(497);
    const first = httpTesting.expectOne((request) =>
      request.url.endsWith('/movie/497/similar'),
    );
    service.getSimilarMovies(37165);
    expect(first.cancelled).toBe(true);
    const second = httpTesting.expectOne((request) =>
      request.url.endsWith('/movie/37165/similar'),
    );
    second.flush({
      ...response,
      results: [{ ...response.results[0], id: 99 }],
    });
    expect(service.similarMovies()[0].id).toBe(99);
    expect(service.movies()).toEqual(response.results);
    expect(service.similarLoading()).toBe(false);
  });

  it('loads genres once and reuses both pending and completed requests', () => {
    service.getGenres();
    service.getGenres();
    expect(service.genresLoading()).toBe(true);
    const request = httpTesting.expectOne((request) =>
      request.url.endsWith('/genre/movie/list'),
    );
    const genres = [{ id: 18, name: 'Drama' }];
    request.flush({ genres });
    service.getGenres();
    httpTesting.expectNone((request) =>
      request.url.endsWith('/genre/movie/list'),
    );
    expect(service.genres()).toEqual(genres);
    expect(service.genresLoading()).toBe(false);
  });

  it('can retry genre loading after a failed request', () => {
    service.getGenres();
    httpTesting
      .expectOne((request) => request.url.endsWith('/genre/movie/list'))
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    expect(service.genresError()).not.toBeNull();
    expect(service.genresLoading()).toBe(false);
    service.getGenres();
    expect(service.genresError()).toBeNull();
    httpTesting
      .expectOne((request) => request.url.endsWith('/genre/movie/list'))
      .flush({ genres: [{ id: 18, name: 'Drama' }] });
    expect(service.genresLoading()).toBe(false);
    expect(service.genres()).toHaveLength(1);
  });

  it.each([null, 0])(
    'handles optional numeric discovery filters set to %j',
    (value) => {
      service.discoverMovies({
        ...DEFAULT_MOVIE_FILTERS,
        minRating: value,
        minVotes: value,
      });
      const request = httpTesting.expectOne((request) =>
        request.url.endsWith('/discover/movie'),
      );
      expect(request.request.params.get('vote_average.gte')).toBe(
        value === null ? null : '0',
      );
      expect(request.request.params.get('vote_count.gte')).toBe(
        value === null ? null : '0',
      );
      expect(request.request.params.has('with_genres')).toBe(false);
      expect(request.request.params.has('primary_release_year')).toBe(false);
      expect(request.request.params.has('primary_release_date.gte')).toBe(
        false,
      );
      expect(request.request.params.has('primary_release_date.lte')).toBe(
        false,
      );
      request.flush(response);
    },
  );

  it.each([
    [1999, null],
    [null, 2000],
  ])('supports an open release date range from %s to %s', (from, to) => {
    service.discoverMovies({
      ...DEFAULT_MOVIE_FILTERS,
      yearFrom: from,
      yearTo: to,
    });
    const request = httpTesting.expectOne((request) =>
      request.url.endsWith('/discover/movie'),
    );
    expect(request.request.params.get('primary_release_date.gte')).toBe(
      from === null ? null : `${from}-01-01`,
    );
    expect(request.request.params.get('primary_release_date.lte')).toBe(
      to === null ? null : `${to}-12-31`,
    );
    request.flush(response);
  });

  it('discovers movies using the selected filters and page', () => {
    const filters: MovieFilters = {
      ...DEFAULT_MOVIE_FILTERS,
      genreIds: [18, 14],
      yearFrom: 1999,
      yearTo: 2000,
      minRating: 8,
      minVotes: 1000,
      sortBy: 'vote_average.desc',
    };

    service.discoverMovies(filters, 2);

    expect(service.loading()).toBe(true);

    const request = httpTesting.expectOne((request) =>
      request.url.endsWith('/discover/movie'),
    );

    const params = request.request.params;

    expect(request.request.method).toBe('GET');
    expect(params.get('with_genres')).toBe('18|14');
    expect(params.get('primary_release_date.gte')).toBe('1999-01-01');
    expect(params.get('primary_release_date.lte')).toBe('2000-12-31');
    expect(params.get('vote_average.gte')).toBe('8');
    expect(params.get('vote_count.gte')).toBe('1000');
    expect(params.get('sort_by')).toBe('vote_average.desc');
    expect(params.get('page')).toBe('2');
    expect(params.has('query')).toBe(false);

    request.flush({
      ...response,
      page: 2,
      total_pages: 3,
    });

    expect(service.movies()).toEqual(response.results);
    expect(service.currentPage()).toBe(2);
    expect(service.totalPages()).toBe(3);
    expect(service.loading()).toBe(false);
  });
});
