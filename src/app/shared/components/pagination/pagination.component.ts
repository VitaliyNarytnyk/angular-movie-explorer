import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly disabled = input(false);

  readonly pageChanged = output<number>();

  protected readonly desktopPages = computed(() => this.getPageNumbers(5));
  protected readonly mobilePages = computed(() => this.getPageNumbers(3));

  private getPageNumbers(limit: number): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const count = Math.min(limit, total);

    const start = Math.max(
      1,
      Math.min(current - Math.floor(count / 2), total - count + 1),
    );

    return Array.from({ length: count }, (_, index) => start + index);
  }
}
