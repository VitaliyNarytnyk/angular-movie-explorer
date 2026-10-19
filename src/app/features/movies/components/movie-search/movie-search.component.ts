import { Component, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { debounce, distinctUntilChanged, of, Subject, timer } from 'rxjs';

interface SearchRequest {
  keyword: string;
  immediate: boolean;
}
@Component({
  imports: [FormField],
  selector: 'app-movie-search',
  styleUrl: './movie-search.component.css',
  templateUrl: './movie-search.component.html',
})
export class MovieSearchComponent {
  readonly searchRequested = output<string>();

  private readonly searchModel = signal({ keyword: '' });
  private readonly searchRequests = new Subject<SearchRequest>();

  protected readonly searchForm = form(this.searchModel);

  constructor() {
    this.searchRequests
      .pipe(
        distinctUntilChanged(
          (previous, current) =>
            !current.immediate && previous.keyword === current.keyword,
        ),
        debounce(({ keyword, immediate }) =>
          immediate || keyword === '' ? of(0) : timer(300),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ keyword }) => {
        this.searchRequested.emit(keyword);
      });
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchRequests.next({
      keyword: input.value.trim(),
      immediate: false,
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    this.searchRequests.next({
      keyword: this.searchModel().keyword.trim(),
      immediate: true,
    });
  }
}
