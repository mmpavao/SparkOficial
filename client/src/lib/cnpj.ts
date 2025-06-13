export function formatCnpj(value: string): string {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '');
  
  // Apply CNPJ formatting: XX.XXX.XXX/XXXX-XX
  let formatted = numericValue;
  
  if (numericValue.length >= 2) {
    formatted = numericValue.replace(/^(\d{2})(\d)/, '$1.$2');
  }
  if (numericValue.length >= 5) {
    formatted = formatted.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  }
  if (numericValue.length >= 8) {
    formatted = formatted.replace(/\.(\d{3})(\d)/, '.$1/$2');
  }
  if (numericValue.length >= 12) {
    formatted = formatted.replace(/(\d{4})(\d)/, '$1-$2');
  }
  
  // Limit to 18 characters (XX.XXX.XXX/XXXX-XX)
  return formatted.substring(0, 18);
}

export function validateCnpj(cnpj: string): boolean {
  // Remove formatting
  const cleanCnpj = cnpj.replace(/\D/g, '');
  
  // Check if it has 14 digits
  if (cleanCnpj.length !== 14) {
    return false;
  }
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleanCnpj)) {
    return false;
  }
  
  // Calculate verification digits
  let sum = 0;
  let weight = 5;
  
  // First verification digit
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCnpj[12]) !== firstDigit) {
    return false;
  }
  
  // Second verification digit
  sum = 0;
  weight = 6;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanCnpj[13]) === secondDigit;
}
