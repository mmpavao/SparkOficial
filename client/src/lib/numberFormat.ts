/**
 * Formats numbers to compact display (10k, 1.5M, etc.)
 * Only applies formatting for values >= 10,000
 */
export function formatCompactNumber(value: number): string {
  if (value < 10000) {
    return value.toLocaleString('pt-BR');
  }
  
  if (value >= 1000000000) {
    const billions = value / 1000000000;
    return `${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)}B`;
  }
  
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  
  if (value >= 10000) {
    const thousands = value / 1000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }
  
  return value.toLocaleString('pt-BR');
}

/**
 * Formats currency values with compact notation for display
 * Preserves currency prefix (US$, R$)
 */
export function formatCompactCurrency(value: number, currency: string = 'US$'): string {
  return `${currency} ${formatCompactNumber(value)}`;
}