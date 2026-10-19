import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MovieListResponse } from '../models/movie-list-response.model';
import { MovieService } from './movie.service';
import { MovieDetails } from '../models/movie-details.model';

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
});
