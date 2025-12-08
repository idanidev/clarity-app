/**
 * Formatea un número como moneda en euros
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Parsea una string de moneda a número
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

/**
 * Formatea un número sin símbolo de moneda
 */
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

