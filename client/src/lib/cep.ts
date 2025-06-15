/**
 * CEP formatting utilities
 */

export function formatCep(value: string): string {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
}

export function validateCep(cep: string): boolean {
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8;
}