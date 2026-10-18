import { Component, inject, OnInit } from '@angular/core';
import { MovieService } from '../../services/movie.service';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';

@Component({
  imports: [MovieCardComponent],
  selector: 'app-movie-list',
  styleUrl: './movie-list.component.css',
  templateUrl: './movie-list.component.html',
})
export class MovieListComponent implements OnInit {
  protected readonly movieService = inject(MovieService);

  ngOnInit(): void {
    this.movieService.getPopularMovies();
  }
}
