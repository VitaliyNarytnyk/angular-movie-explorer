import { DatePipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Movie } from '@features/movies/models/movie.model';
import { getMovieImageUrl } from '@features/movies/utils/movie-image.util';

@Component({
  imports: [RouterLink, NgOptimizedImage, DatePipe, DecimalPipe],
  selector: 'app-movie-card',
  styleUrl: './movie-card.component.css',
  templateUrl: './movie-card.component.html',
})
export class MovieCardComponent {
  readonly movie = input.required<Movie>();
  readonly priority = input(false);
  readonly movieSelected = output<void>();

  protected readonly posterUrl = computed(() =>
    getMovieImageUrl(this.movie().poster_path),
  );
}
