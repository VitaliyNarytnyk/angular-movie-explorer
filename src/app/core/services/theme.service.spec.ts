import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let root: HTMLElement;
  const getItem = vi.fn();
  const setItem = vi.fn();

  beforeEach(() => {
    root = document.createElement('html');
    getItem.mockReset().mockReturnValue(null);
    setItem.mockReset();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: {
            documentElement: root,
            defaultView: {
              localStorage: { getItem, setItem },
            },
          },
        },
      ],
    });
  });

  it.each(['light', 'dark'] as const)(
    'restores the saved %s theme',
    (theme) => {
      getItem.mockReturnValue(theme);

      const service = TestBed.inject(ThemeService);

      expect(service.theme()).toBe(theme);
      expect(root.getAttribute('data-theme')).toBe(theme);
    },
  );

  it('defaults to dark when there is no saved choice', () => {
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('applies and saves the selected theme when toggled', () => {
    getItem.mockReturnValue('dark');
    const service = TestBed.inject(ThemeService);

    service.toggleTheme();

    expect(service.theme()).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(setItem).toHaveBeenCalledExactlyOnceWith(
      'movie-explorer-theme',
      'light',
    );
  });
});
