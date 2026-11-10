/** Case-insensitive substring match of `query` against any of `fields`. */
export function matchesQuery(
  fields: ReadonlyArray<string | null | undefined>,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => f?.toLowerCase().includes(q));
}
