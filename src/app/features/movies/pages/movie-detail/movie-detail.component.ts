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
  private readonly headingFocusPending = signal(false);
  protected readonly loadedImages = signal({ poster: '', backdrop: '' });

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

  constructor() {
    this.setupHeadingFocus();
    this.subscribeToMovieId();
  }

  protected retrySimilarMovies(): void {
    const movie = this.movieService.movieDetails();
    if (movie && !this.movieService.similarLoading()) {
      this.movieService.getSimilarMovies(movie.id);
    }
  }

  protected onImageLoad(kind: 'poster' | 'backdrop', event: Event): void {
    const image = event.target as HTMLImageElement;
    this.loadedImages.update((images) => ({
      ...images,
      [kind]: image.currentSrc || image.src,
    }));
  }

  private setupHeadingFocus(): void {
    afterRenderEffect({
      write: () => {
        if (!this.headingFocusPending() || this.movieService.detailsLoading()) {
          return;
        }

        this.pageHeading()?.nativeElement.focus();
        this.headingFocusPending.set(false);
      },
    });
  }

  private subscribeToMovieId(): void {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        const valid = Number.isSafeInteger(id) && id > 0;

        this.invalidId.set(!valid);
        this.headingFocusPending.set(
          this.router.lastSuccessfulNavigation() !== null,
        );

        if (valid) {
          this.movieService.getMovieDetails(id);
          this.movieService.getSimilarMovies(id);
        }
      });
  }
}
