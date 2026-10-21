import {
  afterNextRender,
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
import { getMoviePosterUrl } from '@features/movies/utils/movie-poster.util';

@Component({
  imports: [
    RouterLink,
    NgOptimizedImage,
    DatePipe,
    DecimalPipe,
    LoadingIndicatorComponent,
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
    getMoviePosterUrl(this.movieService.movieDetails()?.poster_path),
  );

  constructor() {
    if (this.router.lastSuccessfulNavigation() !== null) {
      afterNextRender({
        write: () => {
          this.pageHeading()?.nativeElement.focus();
        },
      });
    }

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
        }
      });
  }
}
