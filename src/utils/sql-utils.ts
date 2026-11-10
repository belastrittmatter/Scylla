/**
 * Escapes characters with special meaning in SQL LIKE patterns (% and _)
 * as well as the escape character itself (\).
 */
export function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}
