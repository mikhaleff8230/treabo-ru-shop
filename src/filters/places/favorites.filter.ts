export function buildFavoritesFilter(userId: string) {
  return { favorited_by: userId };
}
