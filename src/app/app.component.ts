import { Component, computed, inject, signal } from '@angular/core';
import { containsTree, Router, RouterOutlet } from '@angular/router';
import { LoadingIndicatorComponent } from '@shared/components/loading-indicator/loading-indicator.component';
import { ThemeService } from '@core/services/theme.service';

@Component({
  imports: [RouterOutlet, LoadingIndicatorComponent],
  selector: 'app-root',
  styleUrl: './app.component.css',
  templateUrl: './app.component.html',
})
export class AppComponent {
  protected readonly router = inject(Router);
  protected readonly pageNavigating = computed(() => {
    const navigation = this.router.currentNavigation();

    if (navigation === null) {
      return false;
    }

    const previous = this.router.lastSuccessfulNavigation();

    if (!previous?.finalUrl) {
      return true;
    }

    return !containsTree(previous.finalUrl, navigation.extractedUrl, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  });

  protected readonly themeService = inject(ThemeService);

  protected readonly title = signal('angular-movie-explorer');
}
