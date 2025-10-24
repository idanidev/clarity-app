import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      // Navigation
      home: 'Inicio',
      expenses: 'Gastos',
      management: 'Gestión',
      categories: 'Categorías',
      budgets: 'Presupuestos',
      recurringExpenses: 'Gastos Recurrentes',
      settings: 'Ajustes',
      logout: 'Cerrar Sesión',

      // Auth
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      email: 'Email',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      continueWith: 'o continúa con',
      google: 'Google',

      // Expenses
      addExpense: 'Añadir Gasto',
      editExpense: 'Editar Gasto',
      expenseName: 'Nombre del gasto',
      amount: 'Cantidad',
      category: 'Categoría',
      subcategory: 'Subcategoría',
      date: 'Fecha',
      paymentMethod: 'Método de pago',
      
      // Payment methods
      card: 'Tarjeta',
      cash: 'Efectivo',
      bizum: 'Bizum',
      transfer: 'Transferencia',

      // Categories
      manageCategories: 'Gestionar Categorías',
      newCategory: 'Nueva Categoría',
      newSubcategory: 'Nueva Subcategoría',
      existingCategories: 'Categorías Existentes',

      // Budgets
      manageBudgets: 'Gestionar Presupuestos',
      createBudget: 'Crear Presupuesto',
      monthlyBudget: 'Presupuesto Mensual',
      activeBudgets: 'Presupuestos Activos',
      budgetExceeded: 'Presupuesto superado en',

      // Stats
      total: 'Total',
      average: 'Promedio',
      spent: 'Gastado',
      recent: 'Recientes',
      distribution: 'Distribución por Categoría',

      // Actions
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      add: 'Añadir',
      confirm: 'Confirmar',

      // Messages
      noExpenses: 'No hay gastos',
      noBudgets: 'No hay presupuestos',
      noCategories: 'No hay categorías',
      addFirstExpense: 'Añade tu primer gasto para comenzar',
      deleteConfirm: '¿Estás seguro?',
      deleteWarning: 'Esta acción no se puede deshacer',
      
      // Notifications
      expenseAdded: 'Gasto añadido correctamente',
      expenseUpdated: 'Gasto actualizado correctamente',
      expenseDeleted: 'Gasto eliminado correctamente',
      categoryAdded: 'Categoría añadida correctamente',
      categoryDeleted: 'Categoría eliminada correctamente',
      budgetCreated: 'Presupuesto creado correctamente',
      budgetDeleted: 'Presupuesto eliminado correctamente',
      
      // Errors
      errorOccurred: 'Ha ocurrido un error',
      cannotDeleteCategory: 'No puedes eliminar una categoría con gastos asociados',
      cannotDeleteSubcategory: 'No puedes eliminar una subcategoría con gastos asociados',

      // Settings
      darkMode: 'Modo Oscuro',
      lightMode: 'Modo Claro',
      changeTheme: 'Cambia el tema de la aplicación',
      aboutClarity: 'Acerca de Clarity',
      version: 'Versión',
      personalExpenseManagement: 'Gestión de gastos personales',

      // Filters
      filters: 'Filtros',
      month: 'Mes',
      all: 'Todas',
      selectCategory: 'Selecciona una categoría',
      selectSubcategory: 'Selecciona una subcategoría',

      // Views
      table: 'Tabla',
      chart: 'Gráfica',
    }
  },
  en: {
    translation: {
      // Navigation
      home: 'Home',
      expenses: 'Expenses',
      management: 'Management',
      categories: 'Categories',
      budgets: 'Budgets',
      recurringExpenses: 'Recurring Expenses',
      settings: 'Settings',
      logout: 'Logout',

      // Auth
      login: 'Login',
      register: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot your password?',
      continueWith: 'or continue with',
      google: 'Google',

      // Expenses
      addExpense: 'Add Expense',
      editExpense: 'Edit Expense',
      expenseName: 'Expense name',
      amount: 'Amount',
      category: 'Category',
      subcategory: 'Subcategory',
      date: 'Date',
      paymentMethod: 'Payment method',
      
      // Payment methods
      card: 'Card',
      cash: 'Cash',
      bizum: 'Bizum',
      transfer: 'Transfer',

      // Categories
      manageCategories: 'Manage Categories',
      newCategory: 'New Category',
      newSubcategory: 'New Subcategory',
      existingCategories: 'Existing Categories',

      // Budgets
      manageBudgets: 'Manage Budgets',
      createBudget: 'Create Budget',
      monthlyBudget: 'Monthly Budget',
      activeBudgets: 'Active Budgets',
      budgetExceeded: 'Budget exceeded by',

      // Stats
      total: 'Total',
      average: 'Average',
      spent: 'Spent',
      recent: 'Recent',
      distribution: 'Distribution by Category',

      // Actions
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      confirm: 'Confirm',

      // Messages
      noExpenses: 'No expenses',
      noBudgets: 'No budgets',
      noCategories: 'No categories',
      addFirstExpense: 'Add your first expense to get started',
      deleteConfirm: 'Are you sure?',
      deleteWarning: 'This action cannot be undone',
      
      // Notifications
      expenseAdded: 'Expense added successfully',
      expenseUpdated: 'Expense updated successfully',
      expenseDeleted: 'Expense deleted successfully',
      categoryAdded: 'Category added successfully',
      categoryDeleted: 'Category deleted successfully',
      budgetCreated: 'Budget created successfully',
      budgetDeleted: 'Budget deleted successfully',
      
      // Errors
      errorOccurred: 'An error occurred',
      cannotDeleteCategory: 'Cannot delete a category with associated expenses',
      cannotDeleteSubcategory: 'Cannot delete a subcategory with associated expenses',

      // Settings
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      changeTheme: 'Change application theme',
      aboutClarity: 'About Clarity',
      version: 'Version',
      personalExpenseManagement: 'Personal expense management',

      // Filters
      filters: 'Filters',
      month: 'Month',
      all: 'All',
      selectCategory: 'Select a category',
      selectSubcategory: 'Select a subcategory',

      // Views
      table: 'Table',
      chart: 'Chart',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
