import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LoadingIndicatorComponent } from './shared/components/loading-indicator/loading-indicator.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  imports: [RouterOutlet, LoadingIndicatorComponent],
  selector: 'app-root',
  styleUrl: './app.component.css',
  templateUrl: './app.component.html',
})
export class AppComponent {
  protected readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);

  protected readonly title = signal('angular-movie-explorer');
}
