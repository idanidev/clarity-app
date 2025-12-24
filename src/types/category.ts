// Tipo para una categoría individual
// Nota: El nombre de la categoría es la key en el objeto Categories
export interface Category {
  name?: string; // Opcional porque la key del objeto es el nombre
  subcategories: string[];
  color: string;
  icon?: string;
}

// Tipo para el objeto de categorías (mapa de nombre -> datos)
export interface Categories {
  [categoryName: string]: Category;
}

// Tipo para un presupuesto individual
export interface Budget {
  category: string;
  amount: number;
  spent?: number;
  percentage?: number;
}

// Tipo para el objeto de presupuestos (mapa de categoría -> límite)
export interface Budgets {
  [categoryName: string]: number;
}

// Tipo para datos de categoría con subcategorías (formato legacy)
export type LegacyCategoryData = string[] | Category;

// Tipo para formato de categorías legacy
export interface LegacyCategories {
  [categoryName: string]: LegacyCategoryData;
}
