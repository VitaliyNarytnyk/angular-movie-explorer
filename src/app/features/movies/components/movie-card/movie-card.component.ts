import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../models/movie.model';

@Component({
  imports: [RouterLink, NgOptimizedImage],
  selector: 'app-movie-card',
  styleUrl: './movie-card.component.css',
  templateUrl: './movie-card.component.html',
})
export class MovieCardComponent {
  readonly movie = input.required<Movie>();

  protected readonly posterUrl = computed(() => {
    const path = this.movie().poster_path;

    return path ? `https://image.tmdb.org/t/p/w500${path}` : null;
  });
}
