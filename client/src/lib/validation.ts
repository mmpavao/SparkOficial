/**
 * Enhanced validation utilities for Brazilian business data
 */

export function validateCNPJ(cnpj: string): { isValid: boolean; message?: string } {
  const cleanCnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCnpj.length !== 14) {
    return { isValid: false, message: 'CNPJ deve ter 14 dígitos' };
  }

  // Check for known invalid patterns
  if (/^(\d)\1{13}$/.test(cleanCnpj)) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  // Calculate verification digits
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digit1 = calculateDigit(cleanCnpj.slice(0, 12), weights1);
  const digit2 = calculateDigit(cleanCnpj.slice(0, 13), weights2);

  if (parseInt(cleanCnpj[12]) !== digit1 || parseInt(cleanCnpj[13]) !== digit2) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  return { isValid: true };
}

function calculateDigit(numbers: string, weights: number[]): number {
  const sum = numbers
    .split('')
    .reduce((acc, digit, index) => acc + parseInt(digit) * weights[index], 0);
  
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function validateEmail(email: string): { isValid: boolean; message?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Email inválido' };
  }

  return { isValid: true };
}

export function validatePhone(phone: string): { isValid: boolean; message?: string } {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { isValid: false, message: 'Telefone deve ter 10 ou 11 dígitos' };
  }

  return { isValid: true };
}

export function validateRequired(value: string, fieldName: string): { isValid: boolean; message?: string } {
  if (!value || value.trim().length === 0) {
    return { isValid: false, message: `${fieldName} é obrigatório` };
  }

  return { isValid: true };
}

export function validateCurrency(value: string): { isValid: boolean; message?: string } {
  const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
  
  if (isNaN(numValue) || numValue <= 0) {
    return { isValid: false, message: 'Valor deve ser um número positivo' };
  }

  return { isValid: true };
}