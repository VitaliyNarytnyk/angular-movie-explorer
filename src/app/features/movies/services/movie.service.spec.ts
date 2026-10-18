import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MovieListResponse } from '../models/movie-list-response.model';
import { MovieService } from './movie.service';

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
});
