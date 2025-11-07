import { signOut } from "firebase/auth";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../../firebase";
import { exportToCSV } from "../../utils/exportUtils";
import {
  addExpense as addExpenseDB,
  addRecurringExpense,
  deleteExpense as deleteExpenseDB,
  deleteRecurringExpense,
  getCategorySubcategories,
  getChangelogSeenVersion,
  getRecurringExpenses,
  getUserBudgets,
  getUserCategories,
  getUserLanguage,
  getUserTheme,
  initializeUser,
  markChangelogAsSeen,
  saveBudgets,
  saveCategories,
  saveTheme,
  subscribeToExpenses,
  subscribeToRecurringExpenses,
  updateExpense as updateExpenseDB,
  updateRecurringExpense,
} from "../../services/firestoreService";
import { useLanguage } from "../../contexts/LanguageContext";
// Lazy loading para componentes pesados
const AddExpenseModal = lazy(() => import("./components/AddExpenseModal"));
const BudgetsModal = lazy(() => import("./components/BudgetsModal"));
const CategoriesModal = lazy(() => import("./components/CategoriesModal"));
const ChangelogModal = lazy(() => import("./components/ChangelogModal"));
const DeleteConfirmationDialog = lazy(() => import("./components/DeleteConfirmationDialog"));
const EditExpenseModal = lazy(() => import("./components/EditExpenseModal"));
const RecurringExpensesModal = lazy(() => import("./components/RecurringExpensesModal"));
const SettingsModal = lazy(() => import("./components/SettingsModal"));
const TipsModal = lazy(() => import("./components/TipsModal"));

// Componentes que se usan siempre, sin lazy loading
import Header from "./components/Header";
import MainContent from "./components/MainContent";
import MobileMenu from "./components/MobileMenu";
import Notification from "./components/Notification";

// Componente de carga para modales
const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
  </div>
);

const Dashboard = ({ user }) => {
  const { initializeLanguage } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState("table");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);

  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  
  // Versión actual del changelog - incrementar cuando hay nuevos cambios
  const CURRENT_CHANGELOG_VERSION = "1.0.0";
  const [newRecurring, setNewRecurring] = useState({
    name: "",
    amount: "",
    category: "",
    subcategory: "",
    dayOfMonth: 1,
    frequency: "monthly", // monthly, quarterly, semiannual, annual
    paymentMethod: "Tarjeta",
    active: true,
    endDate: "",
  });

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    category: "",
    subcategory: "",
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "Tarjeta",
    isRecurring: false,
    recurringId: null,
  });

  const [editingExpense, setEditingExpense] = useState(null);

  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#8B5CF6");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);

  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setCategories({});
      setBudgets({});
      setRecurringExpenses([]);
      setDarkMode(false);
      setLoading(false);
      return;
    }

    let unsubscribeExpenses = () => {};
    let unsubscribeRecurring = () => {};
    let isMounted = true;

    const loadUserData = async () => {
      setLoading(true);

      try {
        await initializeUser(user.uid, {
          email: user.email,
        });

        const [userCategories, userBudgets, userTheme, userLanguage, changelogSeen] = await Promise.all([
          getUserCategories(user.uid),
          getUserBudgets(user.uid),
          getUserTheme(user.uid),
          getUserLanguage(user.uid),
          getChangelogSeenVersion(user.uid),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(userCategories);
        setBudgets(userBudgets);
        setDarkMode(userTheme === "dark");
        
        // Inicializar idioma
        if (userLanguage) {
          initializeLanguage(userLanguage);
        }
        
        // Mostrar changelog si el usuario no ha visto esta versión
        if (changelogSeen !== CURRENT_CHANGELOG_VERSION) {
          setShowChangelog(true);
        }

        const initialExpanded = {};
        Object.keys(userCategories).forEach((cat) => {
          initialExpanded[cat] = true;
        });
        setExpandedCategories(initialExpanded);

        unsubscribeExpenses = subscribeToExpenses(user.uid, (expensesData) => {
          if (!isMounted) {
            return;
          }
          setExpenses(expensesData);
          setLoading(false);
        });

        unsubscribeRecurring = subscribeToRecurringExpenses(
          user.uid,
          (recurringData) => {
            if (!isMounted) {
              return;
            }
            setRecurringExpenses(recurringData);
          }
        );
      } catch (error) {
        console.error("Error loading user data", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
      unsubscribeExpenses?.();
      unsubscribeRecurring?.();
    };
  }, [user, initializeLanguage]);

  const toggleDarkMode = async () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    if (user) {
      await saveTheme(user.uid, newTheme ? "dark" : "light");
    }
  };

  const handleAddRecurring = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const recurringData = {
        name: newRecurring.name,
        amount: parseFloat(newRecurring.amount),
        category: newRecurring.category,
        subcategory: newRecurring.subcategory,
        dayOfMonth: parseInt(newRecurring.dayOfMonth, 10),
        frequency: newRecurring.frequency || "monthly",
        paymentMethod: newRecurring.paymentMethod,
        active: true,
      };

      if (newRecurring.endDate) {
        recurringData.endDate = newRecurring.endDate;
      }

      await addRecurringExpense(user.uid, recurringData);

      setNewRecurring({
        name: "",
        amount: "",
        category: "",
        subcategory: "",
        dayOfMonth: 1,
        frequency: "monthly",
        paymentMethod: "Tarjeta",
        active: true,
        endDate: "",
      });

      showNotification("Gasto recurrente añadido correctamente", "success");
    } catch (error) {
      console.error("Error añadiendo gasto recurrente:", error);
      showNotification("Error al añadir gasto recurrente", "error");
    }
  };

  const handleUpdateRecurring = async (id, updates) => {
    if (!user) return;

    try {
      await updateRecurringExpense(user.uid, id, updates);
      setEditingRecurring(null);
      showNotification("Gasto recurrente actualizado", "success");
    } catch (error) {
      showNotification("Error al actualizar", "error");
    }
  };

  const handleEditRecurringSubmit = async (data) => {
    if (!user || !data) return;

    try {
      const updates = {
        name: (data.name ?? "").trim(),
        amount: Number(data.amount ?? 0),
        category: data.category || "",
        subcategory: data.subcategory || "",
        dayOfMonth: Number(data.dayOfMonth ?? 1),
        frequency: data.frequency || "monthly",
        paymentMethod: data.paymentMethod || "Tarjeta",
        endDate: data.endDate || null,
        active: !!data.active,
      };

      await updateRecurringExpense(user.uid, data.id, updates);
      const refreshed = await getRecurringExpenses(user.uid);
      setRecurringExpenses(refreshed);
      setEditingRecurring(null);
      showNotification("Gasto recurrente actualizado", "success");
    } catch (error) {
      console.error(error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteRecurring = async (id) => {
    if (!user) return;

    try {
      await deleteRecurringExpense(user.uid, id);
      showNotification("Gasto recurrente eliminado", "success");
    } catch (error) {
      showNotification("Error al eliminar", "error");
    }
  };

  const toggleCategory = useCallback((category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addExpenseDB(user.uid, {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
      });

      setNewExpense({
        name: "",
        amount: "",
        category: "",
        subcategory: "",
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: "Tarjeta",
        isRecurring: false,
        recurringId: null,
      });

      setShowAddExpense(false);
      showNotification("Gasto añadido correctamente");
    } catch (error) {
      showNotification("Error al añadir el gasto", "error");
    }
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!user || !editingExpense) return;

    try {
      await updateExpenseDB(user.uid, editingExpense.id, {
        name: editingExpense.name,
        amount: parseFloat(editingExpense.amount),
        category: editingExpense.category,
        subcategory: editingExpense.subcategory,
        date: editingExpense.date,
        paymentMethod: editingExpense.paymentMethod,
      });

      setEditingExpense(null);
      showNotification("Gasto actualizado correctamente");
    } catch (error) {
      showNotification("Error al actualizar el gasto", "error");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!user) return;

    try {
      await deleteExpenseDB(user.uid, id);
      setShowDeleteConfirm(null);
      showNotification("Gasto eliminado correctamente");
    } catch (error) {
      showNotification("Error al eliminar el gasto", "error");
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!user || !newCategory.trim()) return;

    try {
      const updatedCategories = {
        ...categories,
        [newCategory]: {
          subcategories: [],
          color: newCategoryColor,
        },
      };

      await saveCategories(user.uid, updatedCategories);
      setCategories(updatedCategories);
      setExpandedCategories((prev) => ({
        ...prev,
        [newCategory]: true,
      }));
      setNewCategory("");
      setNewCategoryColor("#8B5CF6");
      showNotification("Categoría añadida correctamente");
    } catch (error) {
      showNotification("Error al añadir la categoría", "error");
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!user || !selectedCategoryForSub || !newSubcategory.trim()) return;

    try {
      const categoryData = categories[selectedCategoryForSub];
      const subcategories = getCategorySubcategories(categoryData);
      const color = categoryData?.color || "#8B5CF6";
      
      const updatedCategories = {
        ...categories,
        [selectedCategoryForSub]: {
          subcategories: [...subcategories, newSubcategory],
          color: color,
        },
      };

      await saveCategories(user.uid, updatedCategories);
      setCategories(updatedCategories);
      setNewSubcategory("");
      showNotification("Subcategoría añadida correctamente");
    } catch (error) {
      showNotification("Error al añadir la subcategoría", "error");
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!user) return;

    const hasExpenses = expenses.some((exp) => exp.category === category);
    if (hasExpenses) {
      showNotification(
        "No puedes eliminar una categoría que tiene gastos asociados",
        "error"
      );
      return;
    }

    try {
      const updatedCategories = { ...categories };
      delete updatedCategories[category];

      await saveCategories(user.uid, updatedCategories);
      setCategories(updatedCategories);
      setShowDeleteConfirm(null);
      showNotification("Categoría eliminada correctamente");
    } catch (error) {
      showNotification("Error al eliminar la categoría", "error");
    }
  };

  const handleDeleteSubcategory = async (category, subcategory) => {
    if (!user) return;

    const hasExpenses = expenses.some(
      (exp) => exp.category === category && exp.subcategory === subcategory
    );
    if (hasExpenses) {
      showNotification(
        "No puedes eliminar una subcategoría que tiene gastos asociados",
        "error"
      );
      return;
    }

    try {
      const categoryData = categories[category];
      const subcategories = getCategorySubcategories(categoryData);
      const color = categoryData?.color || "#8B5CF6";
      
      const updatedCategories = {
        ...categories,
        [category]: {
          subcategories: subcategories.filter((sub) => sub !== subcategory),
          color: color,
        },
      };

      await saveCategories(user.uid, updatedCategories);
      setCategories(updatedCategories);
      setShowDeleteConfirm(null);
      showNotification("Subcategoría eliminada correctamente");
    } catch (error) {
      showNotification("Error al eliminar la subcategoría", "error");
    }
  };

  const handleEditCategory = async (oldCategoryName, newCategoryName, newColor) => {
    if (!user || !oldCategoryName || !newCategoryName.trim()) return;

    // Check if category name is being changed and new name already exists
    if (oldCategoryName !== newCategoryName && categories[newCategoryName]) {
      showNotification("Ya existe una categoría con ese nombre", "error");
      return;
    }

    try {
      const categoryData = categories[oldCategoryName];
      const subcategories = getCategorySubcategories(categoryData);
      
      const updatedCategories = { ...categories };
      const updatedBudgets = { ...budgets };
      
      // If name changed, we need to update all expenses, budgets, and recurring expenses
      if (oldCategoryName !== newCategoryName) {
        // Delete old category
        delete updatedCategories[oldCategoryName];
        
        // Update budgets if category has a budget
        if (budgets[oldCategoryName]) {
          updatedBudgets[newCategoryName] = budgets[oldCategoryName];
          delete updatedBudgets[oldCategoryName];
          await saveBudgets(user.uid, updatedBudgets);
          setBudgets(updatedBudgets);
        }
        
        // Update expenses with new category name
        const expensesToUpdate = expenses.filter(
          (exp) => exp.category === oldCategoryName
        );
        
        for (const expense of expensesToUpdate) {
          await updateExpenseDB(user.uid, expense.id, {
            ...expense,
            category: newCategoryName,
          });
        }
        
        // Update recurring expenses with new category name
        const recurringToUpdate = recurringExpenses.filter(
          (rec) => rec.category === oldCategoryName
        );
        
        for (const recurring of recurringToUpdate) {
          await updateRecurringExpense(user.uid, recurring.id, {
            ...recurring,
            category: newCategoryName,
          });
        }
      }
      
      // Add/update category with new data
      updatedCategories[newCategoryName] = {
        subcategories: subcategories,
        color: newColor,
      };

      await saveCategories(user.uid, updatedCategories);
      setCategories(updatedCategories);
      setEditingCategory(null);
      showNotification("Categoría actualizada correctamente");
    } catch (error) {
      console.error("Error updating category:", error);
      showNotification("Error al actualizar la categoría", "error");
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!user || !budgetCategory || !budgetAmount) return;

    try {
      const updatedBudgets = {
        ...budgets,
        [budgetCategory]: parseFloat(budgetAmount),
      };

      await saveBudgets(user.uid, updatedBudgets);
      setBudgets(updatedBudgets);
      setBudgetCategory("");
      setBudgetAmount("");
      showNotification("Presupuesto creado correctamente");
    } catch (error) {
      showNotification("Error al crear el presupuesto", "error");
    }
  };

  const handleDeleteBudget = async (category) => {
    if (!user) return;

    try {
      const updatedBudgets = { ...budgets };
      delete updatedBudgets[category];

      await saveBudgets(user.uid, updatedBudgets);
      setBudgets(updatedBudgets);
      setShowDeleteConfirm(null);
      showNotification("Presupuesto eliminado correctamente");
    } catch (error) {
      showNotification("Error al eliminar el presupuesto", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setExpenses([]);
      setCategories({});
      setBudgets({});
      showNotification("Sesión cerrada correctamente");
    } catch (error) {
      showNotification("Error al cerrar sesión", "error");
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesMonth = expense.date.startsWith(selectedMonth);
      const matchesCategory =
        selectedCategory === "all" || expense.category === selectedCategory;
      return matchesMonth && matchesCategory;
    });
  }, [expenses, selectedMonth, selectedCategory]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  const expensesByCategory = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = {};
      }
      if (!acc[expense.category][expense.subcategory]) {
        acc[expense.category][expense.subcategory] = [];
      }
      acc[expense.category][expense.subcategory].push(expense);
      return acc;
    }, {});
  }, [filteredExpenses]);

  const categoryTotals = useMemo(() => {
    return Object.entries(expensesByCategory).map(
      ([category, subcategories]) => {
        const total = Object.values(subcategories)
          .flat()
          .reduce((sum, exp) => sum + exp.amount, 0);
        return { category, total };
      }
    );
  }, [expensesByCategory]);

  const overBudgetCategories = useMemo(() => {
    return Object.entries(budgets)
      .filter(([category, budget]) => {
        const categoryTotal =
          categoryTotals.find((ct) => ct.category === category)?.total || 0;
        return categoryTotal > budget;
      })
      .map(([category]) => category);
  }, [budgets, categoryTotals]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
  }, [expenses]);

  // Aplicar clase al body según modo oscuro/claro
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove("light-mode");
      document.body.classList.add("dark-mode");
      document.documentElement.style.backgroundColor = "#111827";
    } else {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
      document.documentElement.style.backgroundColor = "#faf5ff";
    }
    return () => {
      document.body.classList.remove("dark-mode", "light-mode");
      document.documentElement.style.backgroundColor = "";
    };
  }, [darkMode]);

  // Memoizar clases CSS para evitar recálculos
  const { bgClass, cardClass, textClass, textSecondaryClass, inputClass } = useMemo(() => ({
    bgClass: darkMode
      ? "bg-gray-900"
      : "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50",
    cardClass: darkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-white/80 backdrop-blur-sm border-white/60",
    textClass: darkMode ? "text-gray-100" : "text-purple-900",
    textSecondaryClass: darkMode ? "text-gray-400" : "text-purple-600",
    inputClass: darkMode
      ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-purple-500"
      : "bg-white border-purple-200 text-purple-900 focus:ring-purple-500",
  }), [darkMode]);

  const handleOpenAddExpense = useCallback(() => {
    setShowAddExpense(true);
    setShowManagement(false);
  }, []);

  const handleOpenCategories = useCallback(() => {
    setShowCategories(true);
    setShowManagement(false);
  }, []);

  const handleOpenBudgets = useCallback(() => {
    setShowBudgets(true);
    setShowManagement(false);
  }, []);

  const handleOpenRecurring = useCallback(() => {
    setShowRecurring(true);
    setShowManagement(false);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
    setShowManagement(false);
  }, []);

  const handleOpenTips = useCallback(() => {
    setShowTips(true);
    setShowManagement(false);
  }, []);

  const handleCloseChangelog = useCallback(async () => {
    setShowChangelog(false);
    if (user) {
      try {
        await markChangelogAsSeen(user.uid, CURRENT_CHANGELOG_VERSION);
      } catch (error) {
        console.error("Error marking changelog as seen:", error);
      }
    }
  }, [user]);

  const handleExportCSV = useCallback(() => {
    try {
      exportToCSV(filteredExpenses, `gastos_${selectedMonth}`);
      showNotification("Gastos exportados correctamente");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      showNotification("Error al exportar los gastos", "error");
    }
  }, [filteredExpenses, selectedMonth, showNotification]);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleMonthChange = useCallback((value) => {
    setSelectedMonth(value);
  }, []);

  const handleCategoryFilterChange = useCallback((value) => {
    setSelectedCategory(value);
  }, []);

  const handleViewChange = useCallback((view) => {
    setActiveView(view);
  }, []);

  const handleNotificationClose = useCallback(() => {
    setNotification(null);
  }, []);

  const handleRequestDelete = useCallback((payload) => {
    setShowDeleteConfirm(payload);
  }, []);

  const handleRecurringStartEdit = useCallback((recurring) => {
    setEditingRecurring(recurring);
  }, []);

  const handleRecurringEditChange = useCallback((updated) => {
    setEditingRecurring(updated);
  }, []);

  const handleRecurringClose = useCallback(() => {
    setEditingRecurring(null);
    setShowRecurring(false);
    setShowMenu(false);
  }, []);

  const handleConfirmDeletion = (context) => {
    if (!context) {
      return;
    }

    setShowDeleteConfirm(null);

    if (context.type === "expense") {
      handleDeleteExpense(context.id);
    } else if (context.type === "category") {
      handleDeleteCategory(context.category);
    } else if (context.type === "subcategory") {
      handleDeleteSubcategory(context.category, context.subcategory);
    } else if (context.type === "budget") {
      handleDeleteBudget(context.category);
    } else if (context.type === "recurring") {
      handleDeleteRecurring(context.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-600 font-medium">
            Cargando Clarity...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      <Header
        darkMode={darkMode}
        textClass={textClass}
        textSecondaryClass={textSecondaryClass}
        userEmail={user.email}
        showBudgets={showBudgets}
        showCategories={showCategories}
        showSettings={showSettings}
        showRecurring={showRecurring}
        showManagement={showManagement}
        overBudgetCount={overBudgetCategories.length}
        onToggleManagement={() => setShowManagement((prev) => !prev)}
        onSelectCategories={handleOpenCategories}
        onSelectBudgets={handleOpenBudgets}
        onSelectRecurring={handleOpenRecurring}
        onOpenSettings={handleOpenSettings}
        onOpenTips={handleOpenTips}
        onExportCSV={handleExportCSV}
        onLogout={handleLogout}
        onOpenMenu={() => setShowMenu(true)}
      />

      <MobileMenu
        visible={showMenu}
        darkMode={darkMode}
        textClass={textClass}
        onClose={() => setShowMenu(false)}
        onShowCategories={handleOpenCategories}
        onShowBudgets={handleOpenBudgets}
        onShowRecurring={handleOpenRecurring}
        onShowSettings={handleOpenSettings}
        onShowTips={handleOpenTips}
        onExportCSV={handleExportCSV}
        onLogout={handleLogout}
      />

      <MainContent
        cardClass={cardClass}
        textClass={textClass}
        textSecondaryClass={textSecondaryClass}
        darkMode={darkMode}
        totalExpenses={totalExpenses}
        filteredExpenses={filteredExpenses}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryFilterChange}
        categories={categories}
        activeView={activeView}
        onChangeView={handleViewChange}
        expensesByCategory={expensesByCategory}
        expandedCategories={expandedCategories}
        onToggleCategory={toggleCategory}
        onAddExpenseClick={handleOpenAddExpense}
        onEditExpense={handleEditExpense}
        onRequestDelete={handleRequestDelete}
        categoryTotals={categoryTotals}
        budgets={budgets}
        recentExpenses={recentExpenses}
        recurringExpenses={recurringExpenses}
      />

      <Suspense fallback={showAddExpense ? <ModalLoader /> : null}>
        <AddExpenseModal
          visible={showAddExpense}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          inputClass={inputClass}
          categories={categories}
          newExpense={newExpense}
          onChange={setNewExpense}
          onSubmit={handleAddExpense}
          onClose={() => setShowAddExpense(false)}
        />
      </Suspense>

      <Suspense fallback={editingExpense ? <ModalLoader /> : null}>
        <EditExpenseModal
          expense={editingExpense}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          inputClass={inputClass}
          categories={categories}
          onChange={setEditingExpense}
          onSubmit={handleUpdateExpense}
          onClose={() => setEditingExpense(null)}
        />
      </Suspense>

      <Suspense fallback={showCategories ? <ModalLoader /> : null}>
        <CategoriesModal
          visible={showCategories}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          inputClass={inputClass}
          categories={categories}
          newCategory={newCategory}
          onNewCategoryChange={setNewCategory}
          newCategoryColor={newCategoryColor}
          onNewCategoryColorChange={setNewCategoryColor}
          onAddCategory={handleAddCategory}
          selectedCategoryForSub={selectedCategoryForSub}
          onSelectCategoryForSub={setSelectedCategoryForSub}
          newSubcategory={newSubcategory}
          onNewSubcategoryChange={setNewSubcategory}
          onAddSubcategory={handleAddSubcategory}
          editingCategory={editingCategory}
          onStartEditCategory={setEditingCategory}
          onCancelEditCategory={() => setEditingCategory(null)}
          onSaveEditCategory={() => {
            if (editingCategory) {
              handleEditCategory(
                editingCategory.name,
                editingCategory.newName,
                editingCategory.newColor
              );
            }
          }}
          onRequestDelete={handleRequestDelete}
          onClose={() => {
            setShowCategories(false);
            setEditingCategory(null);
            setNewCategory("");
            setNewCategoryColor("#8B5CF6");
          }}
        />
      </Suspense>

      <Suspense fallback={showBudgets ? <ModalLoader /> : null}>
        <BudgetsModal
          visible={showBudgets}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          textSecondaryClass={textSecondaryClass}
          inputClass={inputClass}
          categories={categories}
          budgets={budgets}
          budgetCategory={budgetCategory}
          onBudgetCategoryChange={setBudgetCategory}
          budgetAmount={budgetAmount}
          onBudgetAmountChange={setBudgetAmount}
          onAddBudget={handleAddBudget}
          categoryTotals={categoryTotals}
          onRequestDelete={handleRequestDelete}
          onClose={() => setShowBudgets(false)}
        />
      </Suspense>

      <Suspense fallback={showRecurring ? <ModalLoader /> : null}>
        <RecurringExpensesModal
          visible={showRecurring}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          textSecondaryClass={textSecondaryClass}
          inputClass={inputClass}
          categories={categories}
          recurringExpenses={recurringExpenses}
          newRecurring={newRecurring}
          onNewRecurringChange={setNewRecurring}
          onAddRecurring={handleAddRecurring}
          onUpdateRecurring={handleUpdateRecurring}
          onRequestDelete={handleRequestDelete}
          onStartEdit={handleRecurringStartEdit}
          editingRecurring={editingRecurring}
          onEditingRecurringChange={handleRecurringEditChange}
          onSubmitEditRecurring={handleEditRecurringSubmit}
          onCancelEdit={() => setEditingRecurring(null)}
          onClose={handleRecurringClose}
        />
      </Suspense>

      <Suspense fallback={showSettings ? <ModalLoader /> : null}>
        <SettingsModal
          visible={showSettings}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          textSecondaryClass={textSecondaryClass}
          toggleDarkMode={toggleDarkMode}
          onClose={() => setShowSettings(false)}
        />
      </Suspense>

      <Suspense fallback={showTips ? <ModalLoader /> : null}>
        <TipsModal
          visible={showTips}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          textSecondaryClass={textSecondaryClass}
          onClose={() => setShowTips(false)}
        />
      </Suspense>

      <Suspense fallback={showChangelog ? <ModalLoader /> : null}>
        <ChangelogModal
          visible={showChangelog}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          textSecondaryClass={textSecondaryClass}
          onClose={handleCloseChangelog}
        />
      </Suspense>

      <Suspense fallback={showDeleteConfirm ? <ModalLoader /> : null}>
        <DeleteConfirmationDialog
          context={showDeleteConfirm}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          textSecondaryClass={textSecondaryClass}
          onCancel={() => setShowDeleteConfirm(null)}
          onConfirm={handleConfirmDeletion}
        />
      </Suspense>

      <Notification
        notification={notification}
        onClose={handleNotificationClose}
      />
    </div>
  );
};

export default Dashboard;
