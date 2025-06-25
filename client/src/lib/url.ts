function canBeValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeUrl(input: string): string {
  if (!input) return '';

  const trimmed = input.trim();
  if (!trimmed) return '';

  // Se já tem protocolo, valida e retorna
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return canBeValidUrl(trimmed) ? trimmed : '';
  }

  // Remove www. se existir para normalizar
  const withoutWww = trimmed.replace(/^www\./, '');

  // Adiciona https:// por padrão
  const withProtocol = `https://www.${withoutWww}`;

  return canBeValidUrl(withProtocol) ? withProtocol : '';
}

export function isValidUrl(url: string): boolean {
  return canBeValidUrl(url);
}