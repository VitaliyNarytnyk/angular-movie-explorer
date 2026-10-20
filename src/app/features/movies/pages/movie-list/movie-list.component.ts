import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { MovieSearchComponent } from '../../components/movie-search/movie-search.component';
import { MovieService } from '../../services/movie.service';

@Component({
  imports: [MovieCardComponent, MovieSearchComponent],
  selector: 'app-movie-list',
  styleUrl: './movie-list.component.css',
  templateUrl: './movie-list.component.html',
})
export class MovieListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly pageHeading =
    viewChild<ElementRef<HTMLHeadingElement>>('pageHeading');

  protected readonly movieService = inject(MovieService);

  constructor() {
    if (this.router.lastSuccessfulNavigation() !== null) {
      afterNextRender({
        write: () => {
          this.pageHeading()?.nativeElement.focus();
        },
      });
    }
  }

  ngOnInit(): void {
    this.movieService.getPopularMovies();
  }
}
