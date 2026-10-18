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
      import('./features/movies/pages/movie-list/movie-list').then((m) => m.MovieList),
  },
  {
    path: 'movies/:id',
    loadComponent: () =>
      import('./features/movies/pages/movie-detail/movie-detail').then((m) => m.MovieDetail),
  },
  {
    path: '**',
    redirectTo: 'movies',
  },
];
