export type PaymentMethod = 'Tarjeta' | 'Efectivo' | 'Transferencia' | 'Bizum';

export interface Expense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  subcategory?: string;
  date: string; // YYYY-MM-DD format
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  recurring?: boolean;
  recurringId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

// Tipo para formularios donde amount puede empezar como string vacío
export interface ExpenseFormInput {
  name: string;
  amount: number | string;
  category: string;
  subcategory?: string;
  date: string;
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  recurring?: boolean;
  recurringId?: string | null;
  userId?: string;
}

export interface ExpenseFilters {
  month?: string;
  category?: string;
  subcategory?: string;
  paymentMethod?: string;
  searchQuery?: string;
  minAmount?: number;
  maxAmount?: number;
}

