export function formatPhone(value: string): string {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '');
  
  // Apply Brazilian phone formatting: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  let formatted = numericValue;
  
  if (numericValue.length >= 2) {
    formatted = numericValue.replace(/^(\d{2})(\d)/, '($1) $2');
  }
  
  if (numericValue.length >= 7) {
    // Check if it's a mobile number (11 digits) or landline (10 digits)
    if (numericValue.length === 11) {
      formatted = formatted.replace(/(\d{5})(\d)/, '$1-$2');
    } else {
      formatted = formatted.replace(/(\d{4})(\d)/, '$1-$2');
    }
  }
  
  // Limit to 15 characters: (XX) XXXXX-XXXX
  return formatted.substring(0, 15);
}

export function validatePhone(phone: string): boolean {
  // Remove formatting
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Brazilian phone numbers should have 10 (landline) or 11 (mobile) digits
  return cleanPhone.length === 10 || cleanPhone.length === 11;
}
