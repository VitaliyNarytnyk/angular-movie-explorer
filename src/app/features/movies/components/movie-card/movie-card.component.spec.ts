import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { MovieCardComponent } from './movie-card.component';

describe('MovieCardComponent', () => {
  let fixture: ComponentFixture<MovieCardComponent>;
  const movie: Movie = {
    id: 497,
    title: 'The Green Mile',
    overview: 'A prison guard meets an inmate with an extraordinary gift.',
    poster_path: '/the-green-mile.jpg',
    release_date: '1999-12-10',
    vote_average: 8.5,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieCardComponent);
    fixture.componentRef.setInput('movie', movie);
    await fixture.whenStable();
  });

  it('renders the movie content, poster, and details link', () => {
    const card = fixture.nativeElement as HTMLElement;

    expect(card.querySelector('h3')?.textContent).toBe(movie.title);
    expect(card.querySelector('p')?.textContent).toContain(movie.overview);
    expect(card.querySelector('a')?.getAttribute('href')).toBe('/movies/497');
    expect(card.querySelector('img')?.getAttribute('src')).toBe(
      'https://image.tmdb.org/t/p/w500/the-green-mile.jpg',
    );
  });

  it('shows fallbacks when the movie has no poster or description', async () => {
    fixture.componentRef.setInput('movie', {
      ...movie,
      poster_path: null,
      overview: '',
    });
    await fixture.whenStable();

    const card = fixture.nativeElement as HTMLElement;

    expect(card.querySelector('img')).toBeNull();
    expect(card.textContent).toContain('No poster available');
    expect(card.querySelector('p')?.textContent).toContain(
      'No description available.',
    );
  });

  it('updates the poster and link when the movie input changes', async () => {
    fixture.componentRef.setInput('movie', {
      id: 37165,
      title: 'The Truman Show',
      overview: 'An ordinary man discovers his life is a television show.',
      poster_path: '/the-truman-show.jpg',
      release_date: '1998-06-04',
      vote_average: 8.2,
    });
    await fixture.whenStable();

    const card = fixture.nativeElement as HTMLElement;

    expect(card.querySelector('h3')?.textContent).toBe('The Truman Show');
    expect(card.querySelector('a')?.getAttribute('href')).toBe('/movies/37165');
    expect(card.querySelector('img')?.getAttribute('src')).toBe(
      'https://image.tmdb.org/t/p/w500/the-truman-show.jpg',
    );
  });
});
