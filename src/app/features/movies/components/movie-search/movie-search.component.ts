import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { MovieSearchHistoryService } from '@features/movies/services/movie-search-history.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import {
  distinctUntilChanged,
  filter,
  map,
  merge,
  of,
  Subject,
  switchMap,
  tap,
  timer,
} from 'rxjs';

interface SearchRequest {
  keyword: string;
  source: 'input' | 'submit' | 'url';
}

@Component({
  imports: [FormField],
  selector: 'app-movie-search',
  styleUrl: './movie-search.component.css',
  templateUrl: './movie-search.component.html',
  host: {
    '(focusout)': 'onFocusOut($event)',
    '(keydown.escape)': 'onEscape($event)',
    '(document:pointerdown)': 'onOutsidePointerDown($event)',
  },
})
export class MovieSearchComponent {
  readonly query = input('');
  readonly searchRequested = output<string>();
  protected readonly history = inject(MovieSearchHistoryService);
  protected readonly historyOpen = signal(false);
  private readonly injector = inject(Injector);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly searchInput =
    viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  private readonly historyOptions =
    viewChildren<ElementRef<HTMLButtonElement>>('historyOption');

  private readonly searchModel = signal({ keyword: '' });
  private pendingUrlQuery: string | null = null;

  private readonly searchRequests = new Subject<SearchRequest>();

  protected readonly searchForm = form(this.searchModel);

  constructor() {
    const urlQueries = toObservable(this.query).pipe(
      // Our own URL update acknowledges a search; it must not replace newer typing.
      filter((keyword) => {
        const ownUpdate = keyword === this.pendingUrlQuery;
        this.pendingUrlQuery = null;
        return !ownUpdate;
      }),
      tap((keyword) => this.searchModel.set({ keyword })),
      map((keyword): SearchRequest => ({
        keyword,
        source: 'url',
      })),
    );

    merge(this.searchRequests, urlQueries)
      .pipe(
        switchMap(({ keyword, source }) => {
          const request: SearchRequest = { keyword: keyword.trim(), source };
          if (source !== 'input' || request.keyword === '') {
            return of(request);
          }

          return timer(300).pipe(map(() => request));
        }),
        // Debounce raw typing first, then compare normalized requests.
        distinctUntilChanged(
          (previous, current) =>
            current.source === 'input' &&
            current.keyword !== '' &&
            previous.keyword === current.keyword,
        ),
        filter(({ source }) => source !== 'url'),
        takeUntilDestroyed(),
      )
      .subscribe(({ keyword }) => {
        this.pendingUrlQuery = keyword;
        this.searchRequested.emit(keyword);
      });
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.historyOpen.set(false);
    this.searchRequests.next({
      keyword: input.value,
      source: 'input',
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitSearch(this.searchModel().keyword.trim());
  }

  protected selectHistory(keyword: string): void {
    this.searchModel.set({ keyword });
    this.searchInput().nativeElement.focus();
    this.submitSearch(keyword);
  }

  protected clearHistory(): void {
    this.history.clear();
    this.searchInput().nativeElement.focus();
    this.historyOpen.set(false);
  }

  protected openHistory(): void {
    this.historyOpen.set(this.history.entries().length > 0);
  }

  protected focusHistoryOption(event: Event, index: number): void {
    if (!this.history.entries().length) return;
    event.preventDefault();
    this.openHistory();
    afterNextRender(
      () => {
        if (index < 0) {
          this.searchInput().nativeElement.focus();
          return;
        }
        const options = this.historyOptions();
        options[Math.min(index, options.length - 1)]?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  protected onEscape(event: Event): void {
    if (!this.historyOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    this.searchInput().nativeElement.focus();
    this.historyOpen.set(false);
  }

  protected onFocusOut(event: FocusEvent): void {
    if (
      !this.element.nativeElement.contains(event.relatedTarget as Node | null)
    ) {
      this.historyOpen.set(false);
    }
  }

  protected onOutsidePointerDown(event: Event): void {
    if (!this.element.nativeElement.contains(event.target as Node)) {
      this.historyOpen.set(false);
    }
  }

  private submitSearch(keyword: string): void {
    this.history.remember(keyword);
    this.historyOpen.set(false);
    this.searchRequests.next({ keyword, source: 'submit' });
  }
}
