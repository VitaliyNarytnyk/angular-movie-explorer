export function getMovieImageUrl(
  path: string | null | undefined,
  size: 'w185' | 'w500' | 'w1280' = 'w500',
): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
