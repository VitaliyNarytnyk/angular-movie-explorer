import { DOCUMENT, inject, Service, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'movie-explorer-theme';

@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly themeState = signal<Theme>(this.readInitialTheme());

  readonly theme = this.themeState.asReadonly();

  constructor() {
    this.applyTheme(this.theme());
  }

  toggleTheme(): void {
    this.themeState.update((theme) => (theme === 'dark' ? 'light' : 'dark'));

    const theme = this.theme();
    this.applyTheme(theme);

    try {
      this.window?.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The selected theme still works when browser storage is unavailable.
    }
  }

  private readInitialTheme(): Theme {
    try {
      const savedTheme = this.window?.localStorage.getItem(THEME_STORAGE_KEY);

      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // Use the default dark theme when browser storage is unavailable.
    }

    return 'dark';
  }

  private applyTheme(theme: Theme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
