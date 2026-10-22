import { Component, input, linkedSignal, output } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import {
  distinctUntilChanged,
  EMPTY,
  map,
  merge,
  of,
  Subject,
  switchMap,
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
})
export class MovieSearchComponent {
  readonly query = input('');
  readonly searchRequested = output<string>();

  private readonly searchModel = linkedSignal(() => ({
    keyword: this.query(),
  }));

  private readonly searchRequests = new Subject<SearchRequest>();

  protected readonly searchForm = form(this.searchModel);

  constructor() {
    const urlQueries = toObservable(this.query).pipe(
      map((keyword): SearchRequest => ({
        keyword,
        source: 'url',
      })),
    );

    merge(this.searchRequests, urlQueries)
      .pipe(
        // Submissions can retry; URL updates must cancel pending typing.
        distinctUntilChanged(
          (previous, current) =>
            current.source === 'input' && previous.keyword === current.keyword,
        ),
        switchMap(({ keyword, source }) => {
          if (source === 'url') {
            return EMPTY;
          }

          if (source === 'submit' || keyword === '') {
            return of(keyword);
          }

          return timer(300).pipe(map(() => keyword));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((keyword) => {
        this.searchRequested.emit(keyword);
      });
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchRequests.next({
      keyword: input.value.trim(),
      source: 'input',
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    this.searchRequests.next({
      keyword: this.searchModel().keyword.trim(),
      source: 'submit',
    });
  }
}
