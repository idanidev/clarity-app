// Re-exportar tipos existentes
export type { Expense, ExpenseInput, ExpenseFilters, ExpenseFormInput, PaymentMethod as ExpensePaymentMethod } from './expense';
export type { Categories, Budgets, Budget } from './category';

// ==================== PAYMENT METHOD ====================
export type PaymentMethod = "Tarjeta" | "Efectivo" | "Transferencia" | "Bizum";

// ==================== RECURRING EXPENSES ====================
export type RecurringFrequency = "monthly" | "quarterly" | "semiannual" | "annual";

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  subcategory?: string;
  dayOfMonth: number;
  frequency: RecurringFrequency;
  paymentMethod: PaymentMethod;
  active: boolean;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type RecurringExpenseInput = Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>;

// Tipo para formularios donde amount puede empezar como string vacío
export interface RecurringExpenseFormInput {
  name: string;
  amount: number | string;
  category: string;
  subcategory?: string;
  dayOfMonth: number;
  frequency: RecurringFrequency;
  paymentMethod: PaymentMethod;
  active: boolean;
  endDate?: string | null;
}

// ==================== LONG TERM GOALS ====================
export type LongTermGoalStatus = 'active' | 'completed' | 'cancelled' | 'paused';

export interface LongTermGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  monthlyContribution?: number;
  status: LongTermGoalStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== MONTHLY HISTORY ====================
export interface MonthlyHistoryEntry {
  savings: number;
  goal: number;
  completed: boolean;
  updatedAt: string;
}

export interface MonthlyHistory {
  [monthKey: string]: MonthlyHistoryEntry; // key format: "YYYY-MM"
}

// ==================== ACHIEVEMENTS ====================
export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: string;
  unlockedAt?: string;
}

export interface Achievements {
  totalCompleted: number;
  streakMonths: number;
  badges: Badge[];
}

// ==================== BADGES ====================
export interface Badge {
  id: string;
  name: string;
  description?: string;
  condition?: string;
  icon?: string;
  unlockedAt?: string;
}

// ==================== GOALS ====================
export interface Goals {
  monthlySavingsGoal?: number;
  totalSavingsGoal?: number; // Puede usarse como alias de monthlySavingsGoal
  categoryGoals?: Record<string, number>;
  longTermGoals?: LongTermGoal[];
  achievements?: Achievements;
  monthlyHistory?: MonthlyHistory;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== NOTIFICATION SETTINGS ====================
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
  monthlyIncomeReminder?: {
    enabled: boolean;
    dayOfMonth: number;
  };
  pushNotifications: {
    enabled: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

// ==================== DELETE CONTEXT ====================
export type DeleteType = 'expense' | 'recurring' | 'category' | 'subcategory' | 'goal' | 'budget' | 'categoryGoal' | 'longTermGoal';

export interface DeleteExpenseContext {
  type: 'expense';
  id: string;
}

export interface DeleteRecurringContext {
  type: 'recurring';
  id: string;
}

export interface DeleteCategoryContext {
  type: 'category';
  category: string;
}

export interface DeleteSubcategoryContext {
  type: 'subcategory';
  category: string;
  subcategory: string;
}

export interface DeleteGoalContext {
  type: 'goal';
  goalId: string;
}

export interface DeleteBudgetContext {
  type: 'budget';
  category: string;
}

export interface DeleteCategoryGoalContext {
  type: 'categoryGoal';
  category: string;
}

export interface DeleteLongTermGoalContext {
  type: 'longTermGoal';
  goalId: string;
}

export type DeleteContext = 
  | DeleteExpenseContext 
  | DeleteRecurringContext 
  | DeleteCategoryContext 
  | DeleteSubcategoryContext
  | DeleteGoalContext
  | DeleteBudgetContext
  | DeleteCategoryGoalContext
  | DeleteLongTermGoalContext;

// ==================== CATEGORY TOTALS ====================
export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

// ==================== EXPENSES BY CATEGORY ====================
import type { Expense } from './expense';

export interface ExpensesByCategory {
  [category: string]: {
    expenses: Expense[];
    total: number;
  };
}

// ==================== VIEW TYPES ====================
export type ActiveView = "table" | "chart" | "assistant" | "budgets" | "goals";
export type FilterPeriodType = "month" | "year" | "all";

// ==================== EDITING STATES ====================
export interface EditingCategory {
  name: string;
  color: string;
  newName?: string;
  newColor?: string;
}

export interface EditingSubcategory {
  category: string;
  oldName: string;
  newName: string;
}

// ==================== AI EXPENSE DATA ====================
export interface ExpenseDataFromAI {
  name?: string;
  description?: string;
  amount: number | string;
  category: string;
  subcategory?: string;
  date?: string;
  paymentMethod?: PaymentMethod;
}

// ==================== NOTIFICATION DISPLAY ====================
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// ==================== USER DATA ====================
export interface UserData {
  email: string;
  categories?: Categories;
  budgets?: Budgets;
  theme?: 'light' | 'dark';
  language?: string;
  income?: number | null;
  goals?: Goals;
  notificationSettings?: NotificationSettings;
  fcmTokens?: string[];
  changelogSeen?: string;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== COMPARISON DATA ====================
export interface MonthComparison {
  previousSavings: number;
  difference: number;
  percentage: number;
  isBetter: boolean;
}

// ==================== GOAL PROGRESS ====================
export interface LongTermGoalProgress {
  progress: number;
  remaining: number;
  daysRemaining: number | null;
  monthlyContribution: number;
  isOnTrack: boolean;
}

// ==================== COMPLETED GOAL NOTIFICATION ====================
export interface CompletedGoalNotification {
  type: 'monthly' | 'longTerm';
  name: string;
  amount: number;
  goal: number;
}

// Re-export Category from category.ts
export type { Category } from './category';
