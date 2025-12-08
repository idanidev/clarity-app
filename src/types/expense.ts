export interface Expense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  subcategory?: string;
  date: string; // YYYY-MM-DD format
  paymentMethod: 'Tarjeta' | 'Efectivo' | 'Transferencia';
  isRecurring?: boolean;
  recurringId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export interface ExpenseFilters {
  month?: string;
  category?: string;
  subcategory?: string;
  paymentMethod?: string;
  searchQuery?: string;
  minAmount?: number;
  maxAmount?: number;
}

