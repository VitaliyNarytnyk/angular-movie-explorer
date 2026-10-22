import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MovieSearchHistoryService } from '@features/movies/services/movie-search-history.service';
import { MovieSearchComponent } from './movie-search.component';

describe('MovieSearchComponent', () => {
  let fixture: ComponentFixture<MovieSearchComponent>;
  let input: HTMLInputElement;
  let formElement: HTMLFormElement;

  const searchRequested = vi.fn();

  beforeEach(async () => {
    localStorage.removeItem('movie-explorer-search-history');
    searchRequested.mockClear();

    await TestBed.configureTestingModule({
      imports: [MovieSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieSearchComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    input = element.querySelector('input') as HTMLInputElement;
    formElement = element.querySelector('form') as HTMLFormElement;

    fixture.componentInstance.searchRequested.subscribe(searchRequested);

    vi.useFakeTimers();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    localStorage.removeItem('movie-explorer-search-history');
  });

  function enterKeyword(keyword: string): void {
    input.value = keyword;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  it('waits for a pause and emits the latest trimmed keyword', () => {
    enterKeyword('Green');
    vi.advanceTimersByTime(200);

    enterKeyword('  The Green Mile  ');
    vi.advanceTimersByTime(299);

    expect(searchRequested).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(searchRequested).toHaveBeenCalledTimes(1);
    expect(searchRequested).toHaveBeenCalledWith('The Green Mile');
    expect(TestBed.inject(MovieSearchHistoryService).entries()).toEqual([]);
  });

  it('ignores repeated typing values after trimming', () => {
    enterKeyword('The Green Mile');
    vi.advanceTimersByTime(300);

    enterKeyword('  The Green Mile  ');
    vi.advanceTimersByTime(300);

    expect(searchRequested).toHaveBeenCalledTimes(1);
  });

  it('preserves a trailing space when the emitted query returns through the URL', () => {
    fixture.componentInstance.searchRequested.subscribe((keyword) => {
      fixture.componentRef.setInput('query', keyword);
    });
    enterKeyword('the');
    vi.advanceTimersByTime(250);
    enterKeyword('the ');
    vi.advanceTimersByTime(299);
    expect(searchRequested).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(input.value).toBe('the ');
    expect(searchRequested).toHaveBeenCalledExactlyOnceWith('the');

    enterKeyword(input.value + 'green');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(input.value).toBe('the green');
    expect(searchRequested).toHaveBeenLastCalledWith('the green');
  });

  it('preserves newer typing and its debounce when an earlier URL update arrives', () => {
    enterKeyword('the');
    vi.advanceTimersByTime(300);
    enterKeyword('the green ');
    vi.advanceTimersByTime(150);
    fixture.componentRef.setInput('query', 'the');
    fixture.detectChanges();
    expect(input.value).toBe('the green ');
    vi.advanceTimersByTime(150);
    expect(searchRequested).toHaveBeenLastCalledWith('the green');
  });

  it('restores an external URL query and cancels pending typing', () => {
    enterKeyword('unfinished');
    vi.advanceTimersByTime(100);
    fixture.componentRef.setInput('query', 'The Truman Show');
    fixture.detectChanges();
    expect(input.value).toBe('The Truman Show');
    vi.advanceTimersByTime(300);
    expect(searchRequested).not.toHaveBeenCalled();
  });

  it('submits immediately and cancels the pending debounce', () => {
    enterKeyword('The Green Mile');

    formElement.dispatchEvent(
      new Event('submit', {
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(searchRequested).toHaveBeenCalledTimes(1);
    expect(searchRequested).toHaveBeenCalledWith('The Green Mile');

    vi.advanceTimersByTime(300);

    expect(searchRequested).toHaveBeenCalledTimes(1);
  });

  it('emits an empty keyword immediately when cleared', () => {
    enterKeyword('The Green Mile');
    vi.advanceTimersByTime(100);

    enterKeyword('');

    expect(searchRequested).toHaveBeenCalledTimes(1);
    expect(searchRequested).toHaveBeenCalledWith('');

    vi.advanceTimersByTime(300);

    expect(searchRequested).toHaveBeenCalledTimes(1);
  });
  it('remembers a submitted title without recording live typing', () => {
    enterKeyword('  The Green Mile  ');
    formElement.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    expect(TestBed.inject(MovieSearchHistoryService).entries()).toEqual([
      'The Green Mile',
    ]);
  });

  it('selects a recent query immediately and cancels pending typing', () => {
    const history = TestBed.inject(MovieSearchHistoryService);
    history.remember('The Green Mile');
    fixture.detectChanges();
    enterKeyword('unfinished');
    vi.advanceTimersByTime(100);
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector<HTMLElement>('.search-history')?.hidden).toBe(
      false,
    );
    element.querySelector<HTMLButtonElement>('.history-option')?.click();
    fixture.detectChanges();
    expect(input.value).toBe('The Green Mile');
    expect(searchRequested).toHaveBeenCalledExactlyOnceWith('The Green Mile');
    expect(element.querySelector<HTMLElement>('.search-history')?.hidden).toBe(
      true,
    );
    vi.advanceTimersByTime(300);
    expect(searchRequested).toHaveBeenCalledTimes(1);
    expect(history.entries()).toEqual(['The Green Mile']);
  });

  it('supports keyboard focus, Escape, outside clicks and clearing history', () => {
    const history = TestBed.inject(MovieSearchHistoryService);
    history.remember('The Green Mile');
    fixture.detectChanges();
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const panel = element.querySelector<HTMLElement>('.search-history')!;
    const option = element.querySelector<HTMLButtonElement>('.history-option')!;
    expect(document.activeElement).toBe(option);
    option.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(input);

    input.click();
    fixture.detectChanges();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(panel.hidden).toBe(true);

    input.click();
    fixture.detectChanges();
    Array.from(element.querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'Clear history')
      ?.click();
    fixture.detectChanges();
    expect(history.entries()).toEqual([]);
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(input);
  });
});
