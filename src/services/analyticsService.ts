// src/services/analyticsService.ts
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase";

/**
 * Servicio de Analytics para Firebase
 * Trackea eventos de usuario y comportamiento en la app
 */

// ==================== TIPOS ====================

type EventParams = Record<string, string | number | boolean>;

// ==================== FUNCIÓN BASE ====================

/**
 * Trackea un evento en Firebase Analytics
 * @param eventName - Nombre del evento
 * @param eventParams - Parámetros adicionales del evento
 */
export const trackEvent = (eventName: string, eventParams: EventParams = {}): void => {
  if (!analytics) {
    console.warn("Firebase Analytics no está disponible");
    return;
  }

  try {
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.error("Error tracking event:", error);
  }
};

// ==================== SCREEN VIEWS ====================

/**
 * Trackea cuando un usuario ve una pantalla/vista
 * @param screenName - Nombre de la pantalla
 */
export const trackScreenView = (screenName: string): void => {
  trackEvent("screen_view", {
    screen_name: screenName,
  });
};

// ==================== EXPENSE EVENTS ====================

/**
 * Trackea cuando se añade un gasto
 * @param category - Categoría del gasto
 * @param amount - Cantidad del gasto
 */
export const trackAddExpense = (category: string, amount: number): void => {
  trackEvent("add_expense", {
    category,
    amount,
    currency: "EUR",
  });
};

/**
 * Trackea cuando se edita un gasto
 * @param category - Categoría del gasto
 */
export const trackEditExpense = (category: string): void => {
  trackEvent("edit_expense", {
    category,
  });
};

/**
 * Trackea cuando se elimina un gasto
 */
export const trackDeleteExpense = (): void => {
  trackEvent("delete_expense");
};

// ==================== VIEW EVENTS ====================

/**
 * Trackea cuando se cambia de vista
 * @param viewName - Nombre de la vista (table, chart, goals, etc.)
 */
export const trackViewChange = (viewName: string): void => {
  trackEvent("view_change", {
    view_name: viewName,
  });
};

// ==================== FILTER EVENTS ====================

/**
 * Trackea cuando se aplica un filtro
 * @param filterType - Tipo de filtro (period, month, year, category)
 * @param filterValue - Valor del filtro
 */
export const trackFilter = (filterType: string, filterValue: string): void => {
  trackEvent("apply_filter", {
    filter_type: filterType,
    filter_value: filterValue,
  });
};

// ==================== EXPORT EVENTS ====================

/**
 * Trackea cuando se exporta a CSV
 * @param periodType - Tipo de período exportado
 */
export const trackExportCSV = (periodType: string): void => {
  trackEvent("export_csv", {
    period_type: periodType,
  });
};

// ==================== MODAL EVENTS ====================

/**
 * Trackea cuando se abre un modal
 * @param modalName - Nombre del modal
 */
export const trackOpenModal = (modalName: string): void => {
  trackEvent("open_modal", {
    modal_name: modalName,
  });
};

// ==================== GOAL EVENTS ====================

/**
 * Trackea cuando se guarda un objetivo
 * @param goalType - Tipo de objetivo (total_savings, category_goal)
 */
export const trackSaveGoal = (goalType: string): void => {
  trackEvent("save_goal", {
    goal_type: goalType,
  });
};

// ==================== BUDGET EVENTS ====================

/**
 * Trackea cuando se muestra una alerta de presupuesto
 * @param category - Categoría del presupuesto
 * @param percentage - Porcentaje alcanzado
 */
export const trackBudgetAlert = (category: string, percentage: number): void => {
  trackEvent("budget_alert", {
    category,
    percentage,
  });
};

