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
import { MovieCatalogStateService } from '@features/movies/services/movie-catalog-state.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { MovieFiltersComponent } from '@features/movies/components/movie-filters/movie-filters.component';
import type {
  MovieCatalogMode,
  MovieCatalogQuery,
} from '@features/movies/models/movie-catalog-query.model';
import type { MovieFilters } from '@features/movies/models/movie-filters.model';
import {
  movieCatalogQueriesEqual,
  movieCatalogQueryParams,
  parseMovieCatalogQuery,
} from '@features/movies/utils/movie-catalog-query.util';

@Component({
  imports: [
    MovieCardComponent,
    MovieSearchComponent,
    LoadingIndicatorComponent,
    PaginationComponent,
    MovieFiltersComponent,
  ],
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
})
export class MovieListComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly catalogState = inject(MovieCatalogStateService);
  private readonly pageHeading =
    viewChild<ElementRef<HTMLHeadingElement>>('pageHeading');

  protected readonly movieService = inject(MovieService);

  private readonly catalogQuery = signal<MovieCatalogQuery>(
    parseMovieCatalogQuery(this.route.snapshot.queryParamMap),
  );

  protected readonly searchQuery = computed(() => this.catalogQuery().query);
  protected readonly catalogMode = computed(() => this.catalogQuery().mode);
  protected readonly selectedFilters = computed(
    () => this.catalogQuery().filters,
  );

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
        map(parseMovieCatalogQuery),
        distinctUntilChanged(movieCatalogQueriesEqual),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        this.catalogQuery.set(state);
        this.catalogState.remember(state);
        this.loadCatalog(state);
      });
  }

  protected onSearch(keyword: string): void {
    const current = this.catalogQuery();
    if (current.mode !== 'search') return;

    this.navigateCatalog({ ...current, query: keyword.trim(), page: 1 }, true);
  }

  protected onModeChange(mode: MovieCatalogMode): void {
    if (mode === this.catalogMode()) return;

    this.navigateCatalog(this.catalogState.restore(mode));
  }

  protected onFiltersApplied(filters: MovieFilters): void {
    const current = this.catalogQuery();
    if (current.mode !== 'discover') return;

    this.navigateCatalog({
      ...current,
      page: 1,
      filters,
    });
  }

  protected retryCatalog(): void {
    if (!this.movieService.loading()) this.loadCatalog(this.catalogQuery());
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

    this.navigateCatalog({ ...this.catalogQuery(), page });
  }

  private navigateCatalog(state: MovieCatalogQuery, replaceUrl = false): void {
    if (movieCatalogQueriesEqual(this.catalogQuery(), state)) {
      if (this.movieService.error()) this.retryCatalog();
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: movieCatalogQueryParams(state),
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }

  private loadCatalog({ mode, query, page, filters }: MovieCatalogQuery): void {
    if (mode === 'discover') {
      this.movieService.getGenres();
      this.movieService.discoverMovies(filters, page);
    } else if (query) {
      this.movieService.searchMovies(query, page);
    } else {
      this.movieService.getPopularMovies(page);
    }
  }
}
