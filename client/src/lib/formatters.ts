/**
 * Utility functions for formatting data consistently across the application
 */

export function formatCurrency(value: number | string, currency: string = 'USD'): string {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }

  if (currency === 'USD') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(numValue);
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(numValue);
}

export function formatDate(date: Date | string | null, locale: string = 'pt-BR'): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }

  return dateObj.toLocaleDateString(locale);
}

export function formatDateTime(date: Date | string | null, locale: string = 'pt-BR'): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }

  return dateObj.toLocaleString(locale);
}

export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k';
  }
  return value.toString();
}

export function formatNumber(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }

  return new Intl.NumberFormat('pt-BR').format(numValue);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}