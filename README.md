# Angular Movie Explorer

An Angular application for browsing popular movies, searching the TMDb catalog,
discovering movies with filters, and viewing movie details.

## Features

- Live title search with debounce and request cancellation.
- Movie discovery by multiple genres (any selected genre), release year range, minimum
  rating, minimum vote count, and sorting by popularity, rating, or release date.
- URL-based search, filters, and pagination, including browser history and links
  that restore the selected catalog after opening movie details.
- Responsive filter panel, loading and error states, and retry actions.
- Movie details with backdrop, runtime, original title and language, rating and
  vote count, director, cast, and up to eight similar movies.
- Light and dark themes with a saved preference and locally hosted Manrope font.

## Tech stack

- Angular 22
- TypeScript
- Angular Signals
- Angular Router
- RxJS
- Tailwind CSS
- Vitest
- ESLint and Prettier

## Project structure

Code is grouped by feature:

```text
src/app/
  core/
    services/
      theme.service.ts
  features/
    movies/
      constants/
      models/
      services/
      utils/
      components/
        movie-card/
        movie-search/
        movie-filters/
      pages/
        movie-list/
        movie-detail/
  shared/
    components/
      loading-indicator/
      pagination/
      carousel/
      brand-link/
  app.routes.ts
```

Movie models and services belong to `features/movies`, alongside the pages
and components that use them. `MovieApiService` builds typed HTTP requests and
owns TMDb URLs, authorization headers, and API parameters. `MovieService` owns
the signal state, request cancellation, loading and error handling, and genre cache.
Its public methods remain the entry point for pages.

Pages coordinate data loading and page state;
the card, search, filter, and pagination components receive data and communicate through inputs and
outputs.

Reusable UI lives in `shared`, and the application-wide theme service lives in
`core`. TypeScript imports use `@features`, `@shared`, `@core`, and `@env` aliases.
Component CSS references the global Tailwind theme through the `#styles` import.

## Search and discovery

TMDb exposes different capabilities in its search and discovery endpoints:

- **Search by title** uses `/search/movie`, without filters or a sidebar. Cards
  use the full content width. An empty search returns `/movie/popular`.
- **Discover movies** uses `/discover/movie` for genres, rating, vote count, a release year range,
  and sorting. These filters are applied by the API across the catalog, rather
  than only filtering the currently loaded page.

Discovery uses two year dropdowns, with either boundary optional. The application
stores years; the service converts them to January 1 (`primary_release_date.gte`)
and December 31
(`primary_release_date.lte`), so both boundary years are included. The end year
cannot precede the start year. Year filtering is available only in Discover;
legacy filter parameters are ignored in title search.

Filters are edited as a draft and applied on submission. Applying or resetting
filters starts at page one. The URL is the source of truth for applied settings;
invalid query parameters fall back to safe defaults. Each browsing mode remembers
its last applied query, filters, sort order, and page in memory. Switching modes
restores those settings in the URL, including after visiting movie details. This
is not a results cache: returning to a mode loads fresh data. Reloading the app
restores the active mode from the URL; the other mode's in-memory settings reset.
Unapplied filter drafts are not saved between modes. For example:

```text
/movies?query=The%20Green%20Mile
/movies?mode=discover&genres=14,18&from=1999&to=2000&rating=7&votes=100&sort=vote_average.desc&page=2
```

Discovery supports sorting by popularity, rating, release date, or original movie title. The
direction button switches ascending/descending order (A–Z / Z–A for titles).
Sorting is performed by TMDb before pagination. Alphabetic sorting uses
`original_title.asc` / `original_title.desc`; translated titles displayed on cards
can therefore appear out of order.

Sort and Filters are independent collapsible panels. They start closed with default
settings; applied filters and a non-default sort order expand their respective panels,
including when returning to Discover. They share the Apply and Reset actions,
and collapsing a panel preserves its draft values. Genres use toggle buttons; rating and vote minimums
use sliders, where zero removes the minimum. Thin dividers separate filter groups.
Invalid filter submissions expand the Filters panel to show the validation message.

The genre dictionary is cached in the movie service. Movie credits are appended
to the detail request; similar movies load independently, so their failure does
not hide the main movie information. Catalog and detail requests use `switchMap`
to cancel obsolete requests. Pagination is limited to TMDb's first 500 pages.

## Requirements

- Node.js 24.22.0 — the version used for development
- npm 11.19.1 — the version used for development
- A TMDb account and API Read Access Token

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/VitaliyNarytnyk/angular-movie-explorer.git
cd angular-movie-explorer
```

### 2. Install dependencies

With nvm, select the version from `.nvmrc` first:

```bash
nvm install
nvm use
```

```bash
npm ci
```

### 3. Configure TMDb access

Obtain an **API Read Access Token** from your
[TMDb account API settings](https://www.themoviedb.org/settings/api).

Copy the configuration template:

```bash
cp src/environments/environment.example.ts src/environments/environment.local.ts
```

Open `src/environments/environment.local.ts` and replace
`YOUR_TMDB_READ_ACCESS_TOKEN` with your token. Do not include the `Bearer` prefix.

The local configuration file is excluded from Git. Each developer must create
their own local copy.

The token is used by the browser application and is visible in network requests.
Excluding the file from Git prevents publishing it in the repository; it does
not hide the token from application users.

### 4. Start the development server

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200).

The application automatically reloads when source files change.

## Available commands

Run these commands from the project root.

| Command                     | Description                                     |
| --------------------------- | ----------------------------------------------- |
| `npm start`                 | Start the development server                    |
| `npm run build`             | Create a production build                       |
| `npm run watch`             | Build in development mode and watch for changes |
| `npm test`                  | Run unit tests in watch mode                    |
| `npm test -- --watch=false` | Run unit tests once                             |
| `npm run lint`              | Check TypeScript and Angular templates          |
| `npm run lint:fix`          | Apply automatic ESLint fixes                    |
| `npm run format`            | Format project files with Prettier              |
| `npm run format:check`      | Check formatting without modifying files        |

Build artifacts are written to `dist/angular-movie-explorer/`.

## Code generation

Generate a component using the local Angular CLI:

```bash
npx ng generate component component-name --type=component
```

List available generators:

```bash
npx ng generate --help
```

## Checks before committing

```bash
npm run format:check
npm run lint
npm test -- --watch=false
npm run build
```

## Resources

- [Angular documentation](https://angular.dev/)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
- [TMDb API documentation](https://developer.themoviedb.org/docs)
