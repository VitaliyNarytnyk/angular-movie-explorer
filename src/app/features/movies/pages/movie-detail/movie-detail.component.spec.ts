import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { MovieService } from '../../services/movie.service';
import { MovieDetailComponent } from './movie-detail.component';
import { signal } from '@angular/core';
import { MovieDetails } from '../../models/movie-details.model';

describe('MovieDetailComponent', () => {
  let fixture: ComponentFixture<MovieDetailComponent>;
  let routeParams: BehaviorSubject<ParamMap>;
  let element: HTMLElement;

  const getMovieDetails = vi.fn();
  const movieDetails = signal<MovieDetails | null>(null);
  const detailsLoading = signal(false);
  const detailsError = signal<string | null>(null);

  const movie: MovieDetails = {
    id: 497,
    title: 'The Green Mile',
    overview: 'A prison guard meets an inmate with an extraordinary gift.',
    poster_path: '/the-green-mile.jpg',
    release_date: '1999-12-10',
    vote_average: 8.5,
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

  it('displays loading instead of previously loaded details', () => {
    movieDetails.set(movie);
    detailsLoading.set(true);
    fixture.detectChanges();

    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'Loading movie details',
    );
    expect(element.querySelector('article')).toBeNull();
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
    movieDetails.set(movie);
    fixture.detectChanges();

    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    const poster = element.querySelector('img');
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
