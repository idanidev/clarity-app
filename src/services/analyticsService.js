// src/services/analyticsService.js
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase";

/**
 * Trackea un evento en Firebase Analytics
 * @param {string} eventName - Nombre del evento
 * @param {object} eventParams - Parámetros adicionales del evento
 */
export const trackEvent = (eventName, eventParams = {}) => {
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

/**
 * Trackea cuando un usuario ve una pantalla/vista
 * @param {string} screenName - Nombre de la pantalla
 */
export const trackScreenView = (screenName) => {
  trackEvent("screen_view", {
    screen_name: screenName,
  });
};

/**
 * Trackea cuando se añade un gasto
 * @param {string} category - Categoría del gasto
 * @param {number} amount - Cantidad del gasto
 */
export const trackAddExpense = (category, amount) => {
  trackEvent("add_expense", {
    category,
    amount,
    currency: "EUR",
  });
};

/**
 * Trackea cuando se edita un gasto
 * @param {string} category - Categoría del gasto
 */
export const trackEditExpense = (category) => {
  trackEvent("edit_expense", {
    category,
  });
};

/**
 * Trackea cuando se elimina un gasto
 */
export const trackDeleteExpense = () => {
  trackEvent("delete_expense");
};

/**
 * Trackea cuando se cambia de vista
 * @param {string} viewName - Nombre de la vista (table, chart, goals, etc.)
 */
export const trackViewChange = (viewName) => {
  trackEvent("view_change", {
    view_name: viewName,
  });
};

/**
 * Trackea cuando se aplica un filtro
 * @param {string} filterType - Tipo de filtro (period, month, year, category)
 * @param {string} filterValue - Valor del filtro
 */
export const trackFilter = (filterType, filterValue) => {
  trackEvent("apply_filter", {
    filter_type: filterType,
    filter_value: filterValue,
  });
};

/**
 * Trackea cuando se exporta a CSV
 * @param {string} periodType - Tipo de período exportado
 */
export const trackExportCSV = (periodType) => {
  trackEvent("export_csv", {
    period_type: periodType,
  });
};

/**
 * Trackea cuando se abre un modal
 * @param {string} modalName - Nombre del modal
 */
export const trackOpenModal = (modalName) => {
  trackEvent("open_modal", {
    modal_name: modalName,
  });
};

/**
 * Trackea cuando se guarda un objetivo
 * @param {string} goalType - Tipo de objetivo (total_savings, category_goal)
 */
export const trackSaveGoal = (goalType) => {
  trackEvent("save_goal", {
    goal_type: goalType,
  });
};

/**
 * Trackea cuando se muestra una alerta de presupuesto
 * @param {string} category - Categoría del presupuesto
 * @param {number} percentage - Porcentaje alcanzado
 */
export const trackBudgetAlert = (category, percentage) => {
  trackEvent("budget_alert", {
    category,
    percentage,
  });
};



