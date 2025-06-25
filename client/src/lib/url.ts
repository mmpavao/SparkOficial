export function normalizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const trimmed = input.trim();
  if (!trimmed) return '';

  // Check if it's already a valid URL with protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Remove protocol if present but malformed
  const withoutProtocol = trimmed.replace(/^https?:\/\//, '');

  // Add https:// prefix
  return `https://${withoutProtocol}`;
}

export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function canBeValidUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const trimmed = input.trim();
  if (!trimmed) return false;

  // Basic domain pattern check
  const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  // Remove common prefixes for validation
  const cleanUrl = trimmed
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]; // Get just the domain part

  return domainPattern.test(cleanUrl);
}