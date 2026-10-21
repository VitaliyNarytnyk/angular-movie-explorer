import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { MovieService } from '@features/movies/services/movie.service';
import { MovieDetailComponent } from './movie-detail.component';
import { signal } from '@angular/core';
import type { MovieDetails } from '@features/movies/models/movie-details.model';

describe('MovieDetailComponent', () => {
  let fixture: ComponentFixture<MovieDetailComponent>;
  let routeParams: BehaviorSubject<ParamMap>;
  let element: HTMLElement;

  const getMovieDetails = vi.fn();
  const movieDetails = signal<MovieDetails | null>(null);
  const detailsLoading = signal(false);
  const detailsError = signal<string | null>(null);
  const getSimilarMovies = vi.fn();
  const similarMovies = signal<MovieDetails[]>([]);
  const similarLoading = signal(false);
  const similarError = signal<string | null>(null);

  const movie: MovieDetails = {
    id: 497,
    title: 'The Green Mile',
    overview: 'A prison guard meets an inmate with an extraordinary gift.',
    poster_path: '/the-green-mile.jpg',
    release_date: '1999-12-10',
    vote_average: 8.5,
    vote_count: 1000,
    original_title: 'The Green Mile',
    original_language: 'en',
    backdrop_path: null,
    tagline: 'Miracles do happen.',
    runtime: 189,
    status: 'Released',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 14, name: 'Fantasy' },
    ],
  };

  beforeEach(async () => {
    getMovieDetails.mockClear();

    movieDetails.set(null);
    detailsLoading.set(false);
    detailsError.set(null);
    getSimilarMovies.mockClear();
    similarMovies.set([]);
    similarLoading.set(false);
    similarError.set(null);

    routeParams = new BehaviorSubject(convertToParamMap({ id: '497' }));

    await TestBed.configureTestingModule({
      imports: [MovieDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParams.asObservable(),
          },
        },
        {
          provide: MovieService,
          useValue: {
            getMovieDetails,
            movieDetails: movieDetails.asReadonly(),
            detailsLoading: detailsLoading.asReadonly(),
            detailsError: detailsError.asReadonly(),
            getSimilarMovies,
            similarMovies: similarMovies.asReadonly(),
            similarLoading: similarLoading.asReadonly(),
            similarError: similarError.asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieDetailComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('requests the movie identified by the route', () => {
    expect(getMovieDetails).toHaveBeenCalledTimes(1);
    expect(getMovieDetails).toHaveBeenCalledWith(497);
  });

  it('requests another movie when the route ID changes', () => {
    routeParams.next(convertToParamMap({ id: '37165' }));

    expect(getMovieDetails).toHaveBeenCalledTimes(2);
    expect(getMovieDetails).toHaveBeenLastCalledWith(37165);
  });

  it('keeps previous details inert while loading', () => {
    movieDetails.set(movie);
    detailsLoading.set(true);
    fixture.detectChanges();

    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'Loading movie details',
    );
    expect(element.querySelector('article')).not.toBeNull();
    expect(element.querySelector('section')?.inert).toBe(true);
  });

  it('displays the service error', () => {
    detailsError.set('Unable to load movie details. Please try again.');
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to load movie details. Please try again.',
    );
    expect(element.querySelector('article')).toBeNull();
  });

  it('displays the movie information and a link to the catalog', () => {
    movieDetails.set({
      ...movie,
      backdrop_path: '/the-green-mile-backdrop.jpg',
    });
    fixture.detectChanges();

    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    const poster = element.querySelector('img[alt="The Green Mile poster"]');
    const releaseDate = element.querySelector('time');

    expect(element.querySelector('#movie-title')?.textContent).toContain(
      movie.title,
    );
    expect(text).toContain(movie.overview);
    expect(text).toContain('8.5 / 10');
    expect(text).toContain('Drama');
    expect(text).toContain('Fantasy');

    expect(poster?.getAttribute('src')).toBe(
      'https://image.tmdb.org/t/p/w500/the-green-mile.jpg',
    );
    expect(poster?.getAttribute('alt')).toBe('The Green Mile poster');

    expect(releaseDate?.getAttribute('datetime')).toBe('1999-12-10');
    expect(releaseDate?.textContent).toContain('December 10, 1999');

    expect(element.querySelector('a')?.getAttribute('href')).toBe('/movies');
  });

  it('recreates images when another movie replaces the current details', () => {
    movieDetails.set({ ...movie, backdrop_path: '/green-mile-backdrop.jpg' });
    fixture.detectChanges();
    const previousImages = [...element.querySelectorAll('img')];

    movieDetails.set({
      ...movie,
      id: 37165,
      title: 'The Truman Show',
      poster_path: '/truman-show.jpg',
      backdrop_path: '/truman-show-backdrop.jpg',
    });
    fixture.detectChanges();

    expect(previousImages).toHaveLength(2);
    expect(previousImages.every((image) => !element.contains(image))).toBe(
      true,
    );
    expect(
      element
        .querySelector('img[alt="The Truman Show poster"]')
        ?.getAttribute('src'),
    ).toBe('https://image.tmdb.org/t/p/w500/truman-show.jpg');
  });

  it('displays fallbacks when optional movie information is unavailable', () => {
    movieDetails.set({
      ...movie,
      poster_path: null,
      overview: '',
      release_date: '',
      genres: [],
    });
    fixture.detectChanges();

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('time')).toBeNull();

    for (const message of [
      'No poster available',
      'No description available.',
      'Release date unavailable',
      'No genres available.',
    ]) {
      expect(element.textContent).toContain(message);
    }
  });

  it('shows runtime, cast and director from the expanded details', () => {
    movieDetails.set({
      ...movie,
      credits: {
        cast: [
          {
            id: 31,
            credit_id: 'paul',
            name: 'Tom Hanks',
            character: 'Paul Edgecomb',
            profile_path: null,
          },
        ],
        crew: [{ id: 4027, name: 'Frank Darabont', job: 'Director' }],
      },
    });
    fixture.detectChanges();
    expect(element.textContent).toContain('189 min');
    expect(element.textContent).toContain('Tom Hanks');
    expect(element.textContent).toContain('Frank Darabont');
    expect(getSimilarMovies).toHaveBeenCalledWith(497);
  });

  it('keeps the main movie visible when similar movies fail', () => {
    movieDetails.set(movie);
    similarError.set('Unable to load similar movies. Please try again.');
    fixture.detectChanges();
    expect(element.querySelector('#movie-title')?.textContent).toContain(
      'The Green Mile',
    );
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to load similar movies',
    );
    getSimilarMovies.mockClear();
    element
      .querySelector<HTMLButtonElement>(
        'section[aria-labelledby="similar-heading"] button',
      )
      ?.click();
    expect(getSimilarMovies).toHaveBeenCalledExactlyOnceWith(497);
  });

  it('reuses movie cards to display similar movies', () => {
    movieDetails.set(movie);
    similarMovies.set([
      { ...movie, id: 37165, title: 'The Truman Show', poster_path: null },
    ]);
    fixture.detectChanges();
    expect(element.querySelector('app-movie-card')?.textContent).toContain(
      'The Truman Show',
    );
  });

  it.each(['abc', '0', '-1', '1.5'])(
    'does not request movie details for invalid ID %j',
    (id) => {
      getMovieDetails.mockClear();

      routeParams.next(convertToParamMap({ id }));
      fixture.detectChanges();

      expect(getMovieDetails).not.toHaveBeenCalled();
      expect(element.querySelector('[role="alert"]')?.textContent).toContain(
        'Invalid movie ID.',
      );
    },
  );
});
