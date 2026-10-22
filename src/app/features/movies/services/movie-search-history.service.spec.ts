import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MovieSearchHistoryService } from './movie-search-history.service';

const STORAGE_KEY = 'movie-explorer-search-history';

describe('MovieSearchHistoryService', () => {
  const getItem = vi.fn();
  const setItem = vi.fn();

  beforeEach(() => {
    getItem.mockReset().mockReturnValue(null);
    setItem.mockReset();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: { defaultView: { localStorage: { getItem, setItem } } },
        },
      ],
    });
  });

  it('restores valid entries, removes duplicates and limits history to eight', () => {
    getItem.mockReturnValue(
      JSON.stringify([
        ' The Green Mile ',
        'the green mile',
        null,
        42,
        '',
        ...Array.from({ length: 10 }, (_, i) => `Movie ${i}`),
      ]),
    );
    const service = TestBed.inject(MovieSearchHistoryService);
    expect(getItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(service.entries()).toEqual([
      'The Green Mile',
      ...Array.from({ length: 7 }, (_, i) => `Movie ${i}`),
    ]);
  });

  it('promotes the latest query, keeps eight entries, and saves the result', () => {
    const service = TestBed.inject(MovieSearchHistoryService);
    for (let i = 0; i < 9; i++) service.remember(`Movie ${i}`);
    service.remember('  movie 4  ');
    service.remember('   ');
    expect(service.entries()).toEqual([
      'movie 4',
      'Movie 8',
      'Movie 7',
      'Movie 6',
      'Movie 5',
      'Movie 3',
      'Movie 2',
      'Movie 1',
    ]);
    expect(setItem).toHaveBeenLastCalledWith(
      STORAGE_KEY,
      JSON.stringify(service.entries()),
    );
    service.clear();
    expect(service.entries()).toEqual([]);
    expect(setItem).toHaveBeenLastCalledWith(STORAGE_KEY, '[]');
  });

  it.each(['invalid JSON', '{"query":"The Green Mile"}'])(
    'ignores invalid stored history: %s',
    (value) => {
      getItem.mockReturnValue(value);
      expect(TestBed.inject(MovieSearchHistoryService).entries()).toEqual([]);
    },
  );

  it('works in memory when browser storage throws', () => {
    getItem.mockImplementation(() => {
      throw new Error('Storage blocked');
    });
    setItem.mockImplementation(() => {
      throw new Error('Storage blocked');
    });
    const service = TestBed.inject(MovieSearchHistoryService);
    expect(() => service.remember('The Green Mile')).not.toThrow();
    expect(service.entries()).toEqual(['The Green Mile']);
    expect(() => service.clear()).not.toThrow();
    expect(service.entries()).toEqual([]);
  });
});
