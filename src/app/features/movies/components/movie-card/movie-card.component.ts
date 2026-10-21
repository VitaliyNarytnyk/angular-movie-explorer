import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Movie } from '@features/movies/models/movie.model';
import { getMoviePosterUrl } from '@features/movies/utils/movie-poster.util';

@Component({
  imports: [RouterLink, NgOptimizedImage],
  selector: 'app-movie-card',
  styleUrl: './movie-card.component.css',
  templateUrl: './movie-card.component.html',
})
export class MovieCardComponent {
  readonly movie = input.required<Movie>();
  readonly priority = input(false);

  protected readonly posterUrl = computed(() =>
    getMoviePosterUrl(this.movie().poster_path),
  );
}
