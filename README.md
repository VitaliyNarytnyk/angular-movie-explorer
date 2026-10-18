# Angular Movie Explorer

An Angular application for browsing popular movies, searching the TMDb catalog,
and viewing movie details.

The application is currently under development.

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

Code is grouped by feature. The movie catalog uses the following structure;
implementation files will be added as development progresses.

```text
src/app/
  features/
    movies/
      models/
      services/
      components/
        movie-card/
        movie-search/
      pages/
        movie-list/
        movie-detail/
  app.routes.ts
```

Movie models and `MovieService` belong to `features/movies`, alongside the pages
and components that use them. Pages coordinate data loading and page state;
the card and search components receive data and communicate through inputs and
outputs.

A `shared` directory will be introduced only when code is needed by multiple
features. No additional architectural layers are required for the current scope.

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
npx ng generate component component-name
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
