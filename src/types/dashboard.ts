// Re-exportar tipos existentes
export type { Expense, ExpenseInput } from './expense';
export type { Categories, Budgets } from './category';

// Tipo para gastos recurrentes
export interface RecurringExpense {
  id?: string;
  name: string;
  amount: number | string;
  category: string;
  subcategory?: string;
  dayOfMonth: number;
  frequency: "monthly" | "quarterly" | "semiannual" | "annual";
  paymentMethod: "Tarjeta" | "Efectivo" | "Transferencia" | "Bizum";
  active: boolean;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Tipo para objetivos
export interface Goals {
  totalSavingsGoal: number;
  categoryGoals: Record<string, number>;
}

// Tipo para configuración de notificaciones
export interface NotificationSettings {
  budgetAlerts: {
    enabled: boolean;
    at80: boolean;
    at90: boolean;
    at100: boolean;
  };
  recurringReminders: {
    enabled: boolean;
  };
  customReminders: {
    enabled: boolean;
    message: string;
  };
  weeklyReminder: {
    enabled: boolean;
    dayOfWeek: number;
    message: string;
  };
  pushNotifications: {
    enabled: boolean;
  };
}

// Tipo para contexto de eliminación
export interface DeleteContext {
  type: string;
  payload: any;
}

// Tipo para totales por categoría
export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

// Tipo para gastos agrupados por categoría
import type { Expense } from './expense';

export interface ExpensesByCategory {
  [category: string]: {
    expenses: Expense[];
    total: number;
  };
}

// Tipo para vista activa
export type ActiveView = "table" | "chart" | "assistant" | "budgets" | "goals";

// Tipo para período de filtro
export type FilterPeriodType = "month" | "year" | "all";

// Tipo para edición de categoría
export interface EditingCategory {
  name: string;
  color: string;
}

// Tipo para edición de subcategoría
export interface EditingSubcategory {
  category: string;
  oldName: string;
  newName: string;
}

// Tipo para datos de gasto desde AI
export interface ExpenseDataFromAI {
  name?: string;
  description?: string;
  amount: number | string;
  category: string;
  subcategory?: string;
  date?: string;
  paymentMethod?: "Tarjeta" | "Efectivo" | "Transferencia" | "Bizum";
}

