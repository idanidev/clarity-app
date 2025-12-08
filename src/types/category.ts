export interface Category {
  name: string;
  subcategories?: string[];
  icon?: string;
  color?: string;
}

export interface Categories {
  [categoryName: string]: Category;
}

export interface Budget {
  category: string;
  amount: number;
  spent?: number;
  percentage?: number;
}

export interface Budgets {
  [categoryName: string]: number;
}

