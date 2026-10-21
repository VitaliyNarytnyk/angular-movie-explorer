export function getMoviePosterUrl(
  path: string | null | undefined,
): string | null {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : null;
}
