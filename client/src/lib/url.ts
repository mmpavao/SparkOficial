
/**
 * Normaliza URLs para o formato completo com protocolo
 */
export function normalizeUrl(url: string): string {
  if (!url || url.trim() === '') {
    return '';
  }

  let normalizedUrl = url.trim();

  // Se já tem protocolo, retorna como está
  if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
    return normalizedUrl;
  }

  // Se começa com www., adiciona https://
  if (normalizedUrl.startsWith('www.')) {
    return `https://${normalizedUrl}`;
  }

  // Se não tem www. nem protocolo, adiciona https://www.
  if (!normalizedUrl.includes('.')) {
    return normalizedUrl; // Retorna como está se não parece ser uma URL válida
  }

  return `https://www.${normalizedUrl}`;
}

/**
 * Valida se uma URL está em formato válido após normalização
 */
export function isValidUrl(url: string): boolean {
  if (!url) return true; // Campo opcional

  try {
    const normalizedUrl = normalizeUrl(url);
    new URL(normalizedUrl);
    return true;
  } catch {
    return false;
  }
}
