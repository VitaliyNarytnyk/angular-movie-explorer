import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MovieSearchComponent } from './movie-search.component';

describe('MovieSearchComponent', () => {
  let fixture: ComponentFixture<MovieSearchComponent>;
  let input: HTMLInputElement;
  let formElement: HTMLFormElement;

  const searchRequested = vi.fn();

  beforeEach(async () => {
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
  });

  it('ignores repeated typing values after trimming', () => {
    enterKeyword('The Green Mile');
    vi.advanceTimersByTime(300);

    enterKeyword('  The Green Mile  ');
    vi.advanceTimersByTime(300);

    expect(searchRequested).toHaveBeenCalledTimes(1);
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
});
