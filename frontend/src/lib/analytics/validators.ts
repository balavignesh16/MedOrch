export function clampScore(score: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, score));
}

export function validatePagination(page: number, limit: number, total: number) {
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, limit);
  const totalPages = Math.ceil(total / validLimit);
  return { page: validPage > totalPages && totalPages > 0 ? totalPages : validPage, limit: validLimit, totalPages };
}

export function isValidFilter(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '' && String(value) !== '?';
}
