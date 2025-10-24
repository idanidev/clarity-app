import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'EUR', locale = 'es-ES') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date, locale = 'es-ES') {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(date, locale = 'es-ES') {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getMonthName(monthString, locale = 'es-ES') {
  const [year, month] = monthString.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
}
