/**
 * Formatea una fecha como DD/MM/YYYY
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formatea una fecha con hora
 */
export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Obtiene el nombre del mes
 */
export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthIndex];
};

/**
 * Obtiene el mes actual en formato YYYY-MM
 */
export const getCurrentMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

/**
 * Obtiene el primer día del mes
 */
export const getFirstDayOfMonth = (month: string): string => {
  return `${month}-01`;
};

/**
 * Obtiene el último día del mes
 */
export const getLastDayOfMonth = (month: string): string => {
  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate();
  return `${month}-${lastDay.toString().padStart(2, '0')}`;
};

/**
 * Formatea un mes YYYY-MM como "Mes Año"
 */
export const formatMonth = (month: string): string => {
  const [year, monthNum] = month.split('-').map(Number);
  return `${getMonthName(monthNum - 1)} ${year}`;
};

