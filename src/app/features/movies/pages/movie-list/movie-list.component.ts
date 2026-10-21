import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { MovieSearchComponent } from '../../components/movie-search/movie-search.component';
import { MovieService } from '../../services/movie.service';
import { distinctUntilChanged, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingIndicatorComponent } from '@shared/components/loading-indicator/loading-indicator.component';

@Component({
  imports: [
    MovieCardComponent,
    MovieSearchComponent,
    LoadingIndicatorComponent,
  ],
  selector: 'app-movie-list',
  styleUrl: './movie-list.component.css',
  templateUrl: './movie-list.component.html',
})
export class MovieListComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pageHeading =
    viewChild<ElementRef<HTMLHeadingElement>>('pageHeading');

  protected readonly movieService = inject(MovieService);

  protected readonly searchQuery = signal('');
  protected readonly desktopPages = computed(() => this.getPageNumbers(5));
  protected readonly mobilePages = computed(() => this.getPageNumbers(3));

  constructor() {
    if (this.router.lastSuccessfulNavigation() !== null) {
      afterNextRender({
        write: () => {
          this.pageHeading()?.nativeElement.focus();
        },
      });
    }

    this.route.queryParamMap
      .pipe(
        map((params) => {
          const page = Number(params.get('page') ?? '1');

          return {
            query: (params.get('query') ?? '').trim(),
            page: Number.isInteger(page) && page >= 1 && page <= 500 ? page : 1,
          };
        }),
        distinctUntilChanged(
          (previous, current) =>
            previous.query === current.query && previous.page === current.page,
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ query, page }) => {
        this.searchQuery.set(query);

        if (query) {
          this.movieService.searchMovies(query, page);
        } else {
          this.movieService.getPopularMovies(page);
        }
      });
  }

  protected onSearch(keyword: string): void {
    const query = keyword.trim();

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        query: query || null,
        page: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected goToPage(page: number): void {
    if (
      this.movieService.loading() ||
      page < 1 ||
      page > this.movieService.totalPages() ||
      page === this.movieService.currentPage()
    ) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: page === 1 ? null : page,
      },
      queryParamsHandling: 'merge',
    });
  }

  private getPageNumbers(limit: number): number[] {
    const current = this.movieService.currentPage();
    const total = this.movieService.totalPages();
    const count = Math.min(limit, total);

    const start = Math.max(
      1,
      Math.min(current - Math.floor(count / 2), total - count + 1),
    );

    return Array.from({ length: count }, (_, index) => start + index);
  }
}
