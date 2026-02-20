import { AppError } from '../errors';

const MAX_DESCRIPTION_WORDS = 100;

/**
 * Count words: trim, split on whitespace (including newlines), filter empty.
 * Multiple spaces/newlines do not count as extra words.
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Validates description word limit. If over limit, throws DESCRIPTION_TOO_LONG.
 * Returns trimmed string or null for empty. Does not throw for null/undefined/empty.
 */
export function validateDescriptionWordLimit(description: string | null | undefined): string | null {
  if (description == null || description === '') return null;
  const trimmed = description.trim();
  if (trimmed === '') return null;
  const wordCount = countWords(trimmed);
  if (wordCount > MAX_DESCRIPTION_WORDS) {
    throw new AppError(
      'DESCRIPTION_TOO_LONG',
      'Description must not exceed 100 words',
      { wordCount, max: MAX_DESCRIPTION_WORDS },
    );
  }
  return trimmed;
}
