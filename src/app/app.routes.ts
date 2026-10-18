import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'movies',
  },
  {
    path: 'movies',
    loadComponent: () =>
      import('./features/movies/pages/movie-list/movie-list.component').then(
        (m) => m.MovieListComponent,
      ),
  },
  {
    path: 'movies/:id',
    loadComponent: () =>
      import('./features/movies/pages/movie-detail/movie-detail.component').then(
        (m) => m.MovieDetailComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'movies',
  },
];
