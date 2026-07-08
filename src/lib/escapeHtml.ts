/**
 * Escape a value for safe interpolation into HTML string templates
 * (e.g. Mapbox popup setHTML). Prevents stored XSS via user-controlled
 * fields like names, addresses, and free-text notes.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}