// URL validation and normalization utilities

/**
 * Validates if a string can be a valid URL
 */
export function canBeValidUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const trimmed = input.trim();
  if (!trimmed) return false;

  // Check if it's already a valid URL
  if (isValidUrl(trimmed)) return true;

  // Check if it could be normalized into a valid URL
  const normalized = normalizeUrl(trimmed);
  return isValidUrl(normalized);
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes URL by adding protocol if missing
 */
export function normalizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const trimmed = input.trim();
  if (!trimmed) return '';

  // If it already has a protocol, return as is
  if (trimmed.match(/^https?:\/\//)) {
    return trimmed;
  }

  // If it starts with www., add https://
  if (trimmed.startsWith('www.')) {
    return `https://${trimmed}`;
  }

  // If it looks like a domain (contains dot but no protocol), add https://www.
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://www.${trimmed}`;
  }

  return trimmed;
}