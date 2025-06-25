
/**
 * URL normalization and validation utilities
 */

/**
 * Normalizes a URL by adding https:// protocol if missing
 * @param url - The URL to normalize
 * @returns Normalized URL with protocol
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove leading/trailing whitespace
  const trimmed = url.trim();
  
  if (!trimmed) {
    return '';
  }

  // If already has protocol, return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Add https:// prefix to domain
  return `https://${trimmed}`;
}

/**
 * Validates if a URL is properly formatted
 * @param url - The URL to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // Try to create URL object
    const urlObj = new URL(url);
    
    // Must be http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    // Must have a hostname
    if (!urlObj.hostname) {
      return false;
    }

    // Basic hostname validation (must contain at least one dot for domain)
    if (!urlObj.hostname.includes('.')) {
      return false;
    }

    // Check for valid domain pattern
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainPattern.test(urlObj.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string can be converted to a valid URL
 * Accepts formats like: empresa.com, www.empresa.com, https://www.empresa.com
 * @param input - The input string to validate
 * @returns True if can be converted to valid URL
 */
export function canBeValidUrl(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const trimmed = input.trim();
  
  if (!trimmed) {
    return false;
  }

  // If already has protocol, validate directly
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return isValidUrl(trimmed);
  }

  // Try adding https:// and validate
  const normalized = normalizeUrl(trimmed);
  return isValidUrl(normalized);
}

/**
 * Formats URL for display (removes protocol for cleaner look)
 * @param url - The URL to format
 * @returns Formatted URL without protocol
 */
export function formatUrlForDisplay(url: string): string {
  if (!url) {
    return '';
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname + urlObj.search + urlObj.hash;
  } catch {
    return url;
  }
}
