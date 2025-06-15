/**
 * Currency formatting utilities for USD values
 */

export function formatUSD(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

export function formatUSDInput(value: string): string {
  // Remove tudo exceto números
  const numbers = value.replace(/[^\d]/g, '');
  
  if (!numbers) return '';
  
  // Converte para número e formata
  const numValue = parseInt(numbers);
  return formatUSD(numValue);
}

export function parseUSDInput(value: string): number {
  const numbers = value.replace(/[^\d]/g, '');
  return numbers ? parseInt(numbers) : 0;
}

export function validateUSDRange(value: number): { isValid: boolean; message?: string } {
  if (value < 100) {
    return { isValid: false, message: 'Valor mínimo é USD $100' };
  }
  
  if (value > 1000000) {
    return { isValid: false, message: 'Valor máximo é USD $1.000.000' };
  }
  
  return { isValid: true };
}

export function getUSDInputPlaceholder(): string {
  return 'Ex: $50,000';
}

export function getUSDRangeDescription(): string {
  return 'Valores aceitos: USD $100 a USD $1.000.000';
}