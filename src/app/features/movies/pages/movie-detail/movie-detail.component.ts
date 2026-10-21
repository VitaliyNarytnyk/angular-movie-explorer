import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MovieService } from '@features/movies/services/movie.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs';
import { DatePipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { LoadingIndicatorComponent } from '@shared/components/loading-indicator/loading-indicator.component';
import { getMovieImageUrl } from '@features/movies/utils/movie-image.util';
import { CarouselComponent } from '@shared/components/carousel/carousel.component';
import { MovieCardComponent } from '@features/movies/components/movie-card/movie-card.component';

@Component({
  imports: [
    RouterLink,
    NgOptimizedImage,
    DatePipe,
    DecimalPipe,
    LoadingIndicatorComponent,
    MovieCardComponent,
    CarouselComponent,
  ],
  selector: 'app-movie-detail',
  styleUrl: './movie-detail.component.css',
  templateUrl: './movie-detail.component.html',
})
export class MovieDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageHeading =
    viewChild<ElementRef<HTMLHeadingElement>>('pageHeading');

  protected readonly movieService = inject(MovieService);
  protected readonly invalidId = signal(false);

  protected readonly posterUrl = computed(() =>
    getMovieImageUrl(this.movieService.movieDetails()?.poster_path),
  );
  protected readonly backdropUrl = computed(() =>
    getMovieImageUrl(this.movieService.movieDetails()?.backdrop_path, 'w1280'),
  );
  protected readonly cast = computed(() =>
    (this.movieService.movieDetails()?.credits?.cast ?? [])
      .slice(0, 20)
      .map((person) => ({
        ...person,
        photoUrl: getMovieImageUrl(person.profile_path, 'w185'),
      })),
  );
  protected readonly directors = computed(() =>
    (this.movieService.movieDetails()?.credits?.crew ?? [])
      .filter((person) => person.job === 'Director')
      .map((person) => person.name)
      .join(', '),
  );

  protected retrySimilarMovies(): void {
    const movie = this.movieService.movieDetails();
    if (movie && !this.movieService.similarLoading())
      this.movieService.getSimilarMovies(movie.id);
  }

  constructor() {
    const focusOnEntry = this.router.lastSuccessfulNavigation() !== null;
    let displayedMovieId: number | null = null;

    afterRenderEffect({
      write: () => {
        const movie = this.movieService.movieDetails();
        if (
          !movie ||
          this.movieService.detailsLoading() ||
          this.movieService.detailsError() ||
          this.invalidId()
        )
          return;

        if (
          movie.id !== displayedMovieId &&
          (displayedMovieId !== null || focusOnEntry)
        ) {
          this.pageHeading()?.nativeElement.focus();
        }
        displayedMovieId = movie.id;
      },
    });

    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        const valid = Number.isSafeInteger(id) && id > 0;

        this.invalidId.set(!valid);

        if (valid) {
          this.movieService.getMovieDetails(id);
          this.movieService.getSimilarMovies(id);
        }
      });
  }
}
