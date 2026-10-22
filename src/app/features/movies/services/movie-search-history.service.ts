import { DOCUMENT, inject, Service, signal } from '@angular/core';

const STORAGE_KEY = 'movie-explorer-search-history';
const HISTORY_LIMIT = 8;

@Service()
export class MovieSearchHistoryService {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly entriesState = signal<string[]>(this.readHistory());
  readonly entries = this.entriesState.asReadonly();

  remember(keyword: string): void {
    const query = keyword.trim();
    if (!query) return;

    this.entriesState.update((entries) => this.normalize([query, ...entries]));
    this.saveHistory();
  }

  clear(): void {
    this.entriesState.set([]);
    this.saveHistory();
  }

  private readHistory(): string[] {
    try {
      const stored: unknown = JSON.parse(
        this.window?.localStorage.getItem(STORAGE_KEY) ?? '[]',
      );
      return Array.isArray(stored) ? this.normalize(stored) : [];
    } catch {
      return [];
    }
  }

  private saveHistory(): void {
    try {
      this.window?.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.entries()),
      );
    } catch {
      // History remains available in memory when browser storage is blocked.
    }
  }

  private normalize(values: unknown[]): string[] {
    const seen = new Set<string>();
    const entries: string[] = [];
    for (const value of values) {
      if (typeof value !== 'string') continue;
      const query = value.trim();
      const key = query.toLocaleLowerCase();
      if (!query || seen.has(key)) continue;
      seen.add(key);
      entries.push(query);
      if (entries.length === HISTORY_LIMIT) break;
    }
    return entries;
  }
}
