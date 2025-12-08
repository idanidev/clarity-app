/**
 * Valida un email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida un monto de dinero
 */
export const isValidAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount > 0;
};

/**
 * Valida una fecha en formato YYYY-MM-DD
 */
export const isValidDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Valida que una string no esté vacía
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

