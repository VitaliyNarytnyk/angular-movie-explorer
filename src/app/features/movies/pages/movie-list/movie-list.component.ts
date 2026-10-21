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
import { MovieCardComponent } from '@features/movies/components/movie-card/movie-card.component';
import { MovieSearchComponent } from '@features/movies/components/movie-search/movie-search.component';
import { MovieService } from '@features/movies/services/movie.service';
import { distinctUntilChanged, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingIndicatorComponent } from '@shared/components/loading-indicator/loading-indicator.component';
import { MAX_MOVIE_PAGES } from '@features/movies/constants/movie.constants';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

@Component({
  imports: [
    MovieCardComponent,
    MovieSearchComponent,
    LoadingIndicatorComponent,
    PaginationComponent,
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

  private readonly catalogQuery = signal({ query: '', page: 1 });

  protected readonly searchQuery = computed(() => this.catalogQuery().query);

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
            page:
              Number.isInteger(page) && page >= 1 && page <= MAX_MOVIE_PAGES
                ? page
                : 1,
          };
        }),
        distinctUntilChanged(
          (previous, current) =>
            previous.query === current.query && previous.page === current.page,
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ query, page }) => {
        this.catalogQuery.set({ query, page });
        this.loadCatalog(query, page);
      });
  }

  protected onSearch(keyword: string): void {
    const query = keyword.trim();
    const currentQuery = this.catalogQuery();

    if (
      this.movieService.error() &&
      query === currentQuery.query &&
      currentQuery.page === 1
    ) {
      this.loadCatalog(query, 1);
      return;
    }

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

  private loadCatalog(query: string, page: number): void {
    if (query) {
      this.movieService.searchMovies(query, page);
    } else {
      this.movieService.getPopularMovies(page);
    }
  }
}
