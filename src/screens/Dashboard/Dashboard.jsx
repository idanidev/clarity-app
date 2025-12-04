import { signOut } from "firebase/auth";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { auth, messaging } from "../../firebase";
import { exportToCSV } from "../../utils/exportUtils";
import {
  addExpense as addExpenseDB,
  addRecurringExpense,
  deleteExpense as deleteExpenseDB,
  deleteRecurringExpense,
  getCategoryColor,
  getCategorySubcategories,
  getChangelogSeenVersion,
  getOnboardingStatus,
  getRecurringExpenses,
  getUserBudgets,
  getUserCategories,
  getUserGoals,
  getUserIncome,
  getUserLanguage,
  getUserNotificationSettings,
  getUserTheme,
  initializeUser,
  markChangelogAsSeen,
  markOnboardingAsCompleted,
  saveBudgets,
  saveCategories,
  saveGoals,
  saveIncome,
  saveNotificationSettings,
  saveTheme,
  subscribeToExpenses,
  subscribeToRecurringExpenses,
  updateExpense as updateExpenseDB,
  updateRecurringExpense,
} from "../../services/firestoreService";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  trackAddExpense,
  trackDeleteExpense,
  trackEditExpense,
  trackExportCSV,
  trackFilter,
  trackOpenModal,
  trackSaveGoal,
  trackViewChange,
  trackBudgetAlert,
} from "../../services/analyticsService";
import {
  requestNotificationPermission,
  setupForegroundMessageListener,
  areNotificationsEnabled,
  getNotificationPermission,
  setVAPIDKey,
} from "../../services/pushNotificationService";
// Las notificaciones push ahora se manejan desde Cloud Functions
import {
  calculateBadges,
  calculateStreak,
  compareWithPreviousMonth,
  updateMonthlyHistory,
  detectNewlyCompletedGoals,
} from "../../services/goalsService";
// import CelebrationModal from "../../components/CelebrationModal"; // Comentado temporalmente
import AchievementsSection from "../../components/AchievementsSection";
import LongTermGoalsSection from "../../components/LongTermGoalsSection";
// Lazy loading para componentes pesados
const AddExpenseModal = lazy(() => import("./components/AddExpenseModal"));
const CategoriesModal = lazy(() => import("./components/CategoriesModal"));
const ChangelogModal = lazy(() => import("./components/ChangelogModal"));
const DeleteConfirmationDialog = lazy(() => import("./components/DeleteConfirmationDialog"));
const EditExpenseModal = lazy(() => import("./components/EditExpenseModal"));
const GoalsModal = lazy(() => import("./components/GoalsModal"));
const RecurringExpensesModal = lazy(() => import("./components/RecurringExpensesModal"));
const SettingsModal = lazy(() => import("./components/SettingsModal"));
const TipsModal = lazy(() => import("./components/TipsModal"));
const OnboardingModal = lazy(() => import("./components/OnboardingModal"));

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [changelogSeenVersion, setChangelogSeenVersion] = useState(null);
  
  // Versión actual del changelog - incrementar cuando hay nuevos cambios
  const CURRENT_CHANGELOG_VERSION = "2.1.0";
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

  const [filterPeriodType, setFilterPeriodType] = useState("month"); // "month" | "year" | "all"
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Handlers para filtros
  const handleFilterPeriodTypeChange = useCallback((value) => {
    setFilterPeriodType(value);
    trackFilter("period", value);
  }, []);

  const handleMonthChange = useCallback((value) => {
    setSelectedMonth(value);
    trackFilter("month", value);
  }, []);

  const handleYearChange = useCallback((value) => {
    setSelectedYear(value);
    trackFilter("year", value);
  }, []);

  const handleCategoryChange = useCallback((value) => {
    setSelectedCategory(value);
    trackFilter("category", value);
  }, []);

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
  const [editingSubcategory, setEditingSubcategory] = useState(null);

  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const [expandedCategories, setExpandedCategories] = useState({});

  // Nuevos estados para ingresos, objetivos y notificaciones
  const [income, setIncome] = useState(0);
  const [goals, setGoals] = useState({
    totalSavingsGoal: 0,
    categoryGoals: {},
  });
  const [notificationSettings, setNotificationSettings] = useState({
    budgetAlerts: { enabled: true, at80: true, at90: true, at100: true },
    recurringReminders: { enabled: true },
    customReminders: { enabled: true, message: "No olvides registrar tus gastos" },
    weeklyReminder: { enabled: true, dayOfWeek: 0, message: "¡No olvides registrar tus gastos de esta semana en Clarity!" },
    pushNotifications: { enabled: false },
  });
  const [showGoals, setShowGoals] = useState(false);
  // const [showCelebration, setShowCelebration] = useState(false); // Comentado temporalmente
  // const [completedGoal, setCompletedGoal] = useState(null); // Comentado temporalmente
  const [previousGoals, setPreviousGoals] = useState(null);

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

        const [userCategories, userBudgets, userTheme, userLanguage, changelogSeen, userIncome, userGoals, userNotificationSettings, onboardingStatus] = await Promise.all([
          getUserCategories(user.uid),
          getUserBudgets(user.uid),
          getUserTheme(user.uid),
          getUserLanguage(user.uid),
          getChangelogSeenVersion(user.uid),
          getUserIncome(user.uid),
          getUserGoals(user.uid),
          getUserNotificationSettings(user.uid),
          getOnboardingStatus(user.uid),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(userCategories || {});
        setBudgets(userBudgets || {});
        setDarkMode(userTheme === "dark");
        setChangelogSeenVersion(changelogSeen);
        // Solo establecer ingresos si el usuario los ha configurado (no null)
        setIncome(userIncome !== null && userIncome !== undefined ? userIncome : 0);
        // Solo establecer objetivos si el usuario los ha configurado (no null)
        setGoals(userGoals || { totalSavingsGoal: 0, categoryGoals: {} });
        setNotificationSettings(userNotificationSettings || {
          budgetAlerts: { enabled: true, at80: true, at90: true, at100: true },
          recurringReminders: { enabled: true },
          customReminders: { enabled: true, message: "No olvides registrar tus gastos" },
          weeklyReminder: { enabled: true, dayOfWeek: 0, hour: 10, message: "¡No olvides registrar tus gastos de esta semana en Clarity!" },
          pushNotifications: { enabled: false },
        });
        
        // Inicializar idioma
        if (userLanguage) {
          initializeLanguage(userLanguage);
        }
        
        // Mostrar tutorial de onboarding si el usuario aún no lo ha completado
        if (!onboardingStatus?.completed) {
          setShowOnboarding(true);
        }

        // Mostrar changelog solo a usuarios que ya han completado el onboarding
        if (onboardingStatus?.completed && changelogSeen !== CURRENT_CHANGELOG_VERSION) {
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
  
  // Mantener referencia actualizada al callback
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const expenseAmount = parseFloat(newExpense.amount);
      await addExpenseDB(user.uid, {
        ...newExpense,
        amount: expenseAmount,
      });

      trackAddExpense(newExpense.category, expenseAmount);

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
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!user || !editingExpense || isUpdatingExpense) return;

    try {
      setIsUpdatingExpense(true);
      await updateExpenseDB(user.uid, editingExpense.id, {
        name: editingExpense.name,
        amount: parseFloat(editingExpense.amount),
        category: editingExpense.category,
        subcategory: editingExpense.subcategory,
        date: editingExpense.date,
        paymentMethod: editingExpense.paymentMethod,
      });

      trackEditExpense(editingExpense.category);
      setEditingExpense(null);
      showNotification("Gasto actualizado correctamente");
    } catch (error) {
      showNotification("Error al actualizar el gasto", "error");
    } finally {
      setIsUpdatingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!user) return;

    try {
      await deleteExpenseDB(user.uid, id);
      trackDeleteExpense();
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

    // Validar que la categoría no exista (case-insensitive)
    const categoryName = newCategory.trim();
    const existingCategory = Object.keys(categories).find(
      (cat) => cat.toLowerCase() === categoryName.toLowerCase()
    );

    if (existingCategory) {
      showNotification(`La categoría "${existingCategory}" ya existe`, "error");
      return;
    }

    try {
      const updatedCategories = {
        ...categories,
        [categoryName]: {
          subcategories: [],
          color: newCategoryColor,
        },
      };

      await saveCategories(user.uid, updatedCategories);
      setCategories(updatedCategories);
      setExpandedCategories((prev) => ({
        ...prev,
        [categoryName]: true,
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

    // Verificar gastos asociados
    const hasExpenses = expenses.some((exp) => exp.category === category);
    if (hasExpenses) {
      showNotification(
        "No puedes eliminar una categoría que tiene gastos asociados",
        "error"
      );
      return;
    }

    // Verificar gastos recurrentes asociados
    const hasRecurring = recurringExpenses.some((rec) => rec.category === category);
    if (hasRecurring) {
      showNotification(
        "No puedes eliminar una categoría que tiene gastos recurrentes asociados",
        "error"
      );
      return;
    }

    try {
      const updatedCategories = { ...categories };
      delete updatedCategories[category];

      // Usar modo "smart" para eliminar explícitamente
      await saveCategories(user.uid, updatedCategories, { mergeMode: "smart" });
      setCategories(updatedCategories);
      setShowDeleteConfirm(null);
      showNotification("Categoría eliminada correctamente");
    } catch (error) {
      console.error("Error deleting category:", error);
      showNotification("Error al eliminar la categoría", "error");
    }
  };

  const handleDeleteSubcategory = async (category, subcategory) => {
    if (!user) return;

    // Verificar gastos asociados
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

    // Verificar gastos recurrentes asociados
    const hasRecurring = recurringExpenses.some(
      (rec) => rec.category === category && rec.subcategory === subcategory
    );
    if (hasRecurring) {
      showNotification(
        "No puedes eliminar una subcategoría que tiene gastos recurrentes asociados",
        "error"
      );
      return;
    }

    try {
      const categoryData = categories[category];
      if (!categoryData) {
        showNotification("Error: la categoría no existe", "error");
        return;
      }

      const subcategories = getCategorySubcategories(categoryData);
      const color = categoryData?.color || "#8B5CF6";
      
      const updatedCategories = {
        ...categories,
        [category]: {
          subcategories: subcategories.filter((sub) => sub !== subcategory),
          color: color,
        },
      };

      // Usar modo "smart" para eliminar explícitamente
      await saveCategories(user.uid, updatedCategories, { mergeMode: "smart" });
      setCategories(updatedCategories);
      setShowDeleteConfirm(null);
      showNotification("Subcategoría eliminada correctamente");
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      showNotification("Error al eliminar la subcategoría", "error");
    }
  };

  const handleEditCategory = async (oldCategoryName, newCategoryName, newColor) => {
    if (!user || !oldCategoryName || !newCategoryName.trim()) return;

    // Validar que el nuevo nombre no exista (case-insensitive)
    const newNameTrimmed = newCategoryName.trim();
    if (oldCategoryName !== newNameTrimmed) {
      const existingCategory = Object.keys(categories).find(
        (cat) => cat.toLowerCase() === newNameTrimmed.toLowerCase()
      );
      if (existingCategory) {
        showNotification(`Ya existe una categoría con ese nombre: "${existingCategory}"`, "error");
        return;
      }
    }

    try {
      const categoryData = categories[oldCategoryName];
      if (!categoryData) {
        showNotification("Categoría no encontrada", "error");
        return;
      }
      
      const subcategories = getCategorySubcategories(categoryData);
      
      // Crear objeto con todas las categorías actualizadas
      const updatedCategories = { ...categories };
      const updatedBudgets = { ...budgets };
      
      // Si el nombre cambió, necesitamos actualizar gastos, presupuestos y gastos recurrentes
      if (oldCategoryName !== newNameTrimmed) {
        // Eliminar la categoría antigua del objeto
        delete updatedCategories[oldCategoryName];
        
        // Actualizar presupuestos si la categoría tiene uno
        if (budgets[oldCategoryName]) {
          updatedBudgets[newNameTrimmed] = budgets[oldCategoryName];
          delete updatedBudgets[oldCategoryName];
          await saveBudgets(user.uid, updatedBudgets);
          setBudgets(updatedBudgets);
        }
        
        // Actualizar gastos con el nuevo nombre de categoría
        const expensesToUpdate = expenses.filter(
          (exp) => exp.category === oldCategoryName
        );
        
        for (const expense of expensesToUpdate) {
          await updateExpenseDB(user.uid, expense.id, {
            ...expense,
            category: newNameTrimmed,
          });
        }
        
        // Actualizar gastos recurrentes con el nuevo nombre de categoría
        const recurringToUpdate = recurringExpenses.filter(
          (rec) => rec.category === oldCategoryName
        );
        
        for (const recurring of recurringToUpdate) {
          await updateRecurringExpense(user.uid, recurring.id, {
            ...recurring,
            category: newNameTrimmed,
          });
        }
      }
      
      // Añadir/actualizar categoría con los nuevos datos
      updatedCategories[newNameTrimmed] = {
        subcategories: subcategories,
        color: newColor,
      };

      // Usar modo "smart" que eliminará categorías que no están en updatedCategories
      // Si cambió el nombre, la categoría antigua ya fue eliminada del objeto (línea 669)
      // por lo que el modo "smart" la eliminará de Firestore también
      await saveCategories(user.uid, updatedCategories, { mergeMode: "smart" });
      setCategories(updatedCategories);
      setEditingCategory(null);
      showNotification("Categoría actualizada correctamente");
    } catch (error) {
      console.error("Error updating category:", error);
      showNotification("Error al actualizar la categoría", "error");
    }
  };

  const handleEditSubcategory = async (categoryName, oldSubcategoryName, newSubcategoryName) => {
    if (!user || !categoryName || !oldSubcategoryName || !newSubcategoryName.trim()) return;

    // Validar que el nuevo nombre no exista (case-insensitive)
    const newNameTrimmed = newSubcategoryName.trim();
    if (oldSubcategoryName !== newNameTrimmed) {
      const categoryData = categories[categoryName];
      const subcategories = getCategorySubcategories(categoryData);
      const existingSubcategory = subcategories.find(
        (sub) => sub.toLowerCase() === newNameTrimmed.toLowerCase()
      );
      if (existingSubcategory) {
        showNotification(`Ya existe una subcategoría con ese nombre: "${existingSubcategory}"`, "error");
        return;
      }
    }

    try {
      const categoryData = categories[categoryName];
      if (!categoryData) {
        showNotification("Categoría no encontrada", "error");
        return;
      }

      const subcategories = getCategorySubcategories(categoryData);
      const updatedSubcategories = subcategories.map(sub => 
        sub === oldSubcategoryName ? newNameTrimmed : sub
      );

      const updatedCategories = {
        ...categories,
        [categoryName]: {
          ...categoryData,
          subcategories: updatedSubcategories,
        },
      };

      // Actualizar gastos con el nuevo nombre de subcategoría
      const expensesToUpdate = expenses.filter(
        (exp) => exp.category === categoryName && exp.subcategory === oldSubcategoryName
      );

      for (const expense of expensesToUpdate) {
        await updateExpenseDB(user.uid, expense.id, {
          ...expense,
          subcategory: newNameTrimmed,
        });
      }

      // Actualizar gastos recurrentes con el nuevo nombre de subcategoría
      const recurringToUpdate = recurringExpenses.filter(
        (rec) => rec.category === categoryName && rec.subcategory === oldSubcategoryName
      );

      for (const recurring of recurringToUpdate) {
        await updateRecurringExpense(user.uid, recurring.id, {
          ...recurring,
          subcategory: newNameTrimmed,
        });
      }

      await saveCategories(user.uid, updatedCategories, { mergeMode: "smart" });
      setCategories(updatedCategories);
      setEditingSubcategory(null);
      showNotification("Subcategoría actualizada correctamente");
    } catch (error) {
      console.error("Error updating subcategory:", error);
      showNotification("Error al actualizar la subcategoría", "error");
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
      // Filtro de categoría
      const matchesCategory =
        selectedCategory === "all" || expense.category === selectedCategory;

      if (!matchesCategory) return false;

      // Filtro de período
      switch (filterPeriodType) {
        case "all":
          // Todos los gastos
          return true;
        case "year":
          // Año completo
          return expense.date.startsWith(selectedYear);
        case "month":
        default:
          // Mes específico
          return expense.date.startsWith(selectedMonth);
      }
    });
  }, [
    expenses,
    filterPeriodType,
    selectedMonth,
    selectedYear,
    selectedCategory,
  ]);

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

  // Totales de categorías del mes actual (para presupuestos - siempre mes actual)
  const categoryTotalsForBudgets = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const totals = {};
    expenses.forEach((expense) => {
      // Solo contar gastos del mes actual para presupuestos
      if (expense.date.startsWith(currentMonth)) {
        totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
      }
    });
    return Object.entries(totals).map(([category, total]) => ({
      category,
      total,
    }));
  }, [expenses]);

  const overBudgetCategories = useMemo(() => {
    return Object.entries(budgets)
      .filter(([category, budget]) => {
        const categoryTotal =
          categoryTotalsForBudgets.find((ct) => ct.category === category)?.total || 0;
        return categoryTotal > budget;
      })
      .map(([category]) => category);
  }, [budgets, categoryTotalsForBudgets]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
  }, [expenses]);

  // Ref para prevenir loops infinitos en la restauración automática
  const isRestoringRef = useRef(false);
  const lastRestoreHashRef = useRef("");
  
  // Ref para prevenir alertas duplicadas
  const budgetAlertsShownRef = useRef(new Set());
  const unsubscribeRef = useRef(null);
  const listenerConfiguredRef = useRef(false);
  const showNotificationRef = useRef(showNotification);

  // Efecto para restaurar categorías y subcategorías perdidas de forma segura
  useEffect(() => {
    if (!user || loading || isRestoringRef.current) {
      return;
    }

    if (!expenses || expenses.length === 0) {
      return;
    }

    // Si no hay categorías en absoluto, restaurarlas todas desde los gastos
    if (!categories || Object.keys(categories).length === 0) {
      console.warn("[Restauración automática] No hay categorías, restaurando desde gastos...");
      isRestoringRef.current = true;

      const restoredCategories = {};
      const categoryColors = {
        Alimentacion: "#8B5CF6",
        Transporte: "#3B82F6",
        Vivienda: "#EC4899",
        Ocio: "#10B981",
        Salud: "#F59E0B",
        Compras: "#EF4444",
        Educacion: "#6366F1",
      };

      expenses.forEach((expense) => {
        if (!expense?.category) return;

        if (!restoredCategories[expense.category]) {
          // Asegurar que siempre sea un objeto con subcategories (array) y color
          restoredCategories[expense.category] = {
            subcategories: [],
            color: categoryColors[expense.category] || "#8B5CF6",
          };
        }

        // Asegurar que subcategories sea un array antes de hacer push
        if (!Array.isArray(restoredCategories[expense.category].subcategories)) {
          restoredCategories[expense.category].subcategories = [];
        }

        if (expense.subcategory && !restoredCategories[expense.category].subcategories.includes(expense.subcategory)) {
          restoredCategories[expense.category].subcategories.push(expense.subcategory);
        }
      });

      // Ordenar subcategorías
      Object.keys(restoredCategories).forEach((cat) => {
        restoredCategories[cat].subcategories.sort((a, b) => a.localeCompare(b));
      });

      const persistRestored = async () => {
        try {
          await saveCategories(user.uid, restoredCategories, { mergeMode: "merge" });
          setCategories(restoredCategories);
          console.log("[Restauración automática] Categorías restauradas:", Object.keys(restoredCategories));
        } catch (error) {
          console.error("Error restoring categories:", error);
        } finally {
          isRestoringRef.current = false;
        }
      };

      void persistRestored();
      return;
    }

    // Restaurar categorías faltantes que tienen gastos asociados
    const missingCategories = new Set();
    expenses.forEach((expense) => {
      if (expense?.category && !categories[expense.category]) {
        missingCategories.add(expense.category);
      }
    });

    if (missingCategories.size > 0) {
      console.warn("[Restauración automática] Categorías faltantes detectadas:", Array.from(missingCategories));
      isRestoringRef.current = true;

      // Asegurar que categories sea un objeto, nunca un array
      let safeCategories = {};
      if (categories && typeof categories === "object" && !Array.isArray(categories)) {
        safeCategories = { ...categories };
      } else if (Array.isArray(categories)) {
        console.error("[Restauración automática] ERROR: categories es un array, ignorando y usando objeto vacío");
        safeCategories = {};
      }

      const restoredCategories = { ...safeCategories };
      const categoryColors = {
        Alimentacion: "#8B5CF6",
        Transporte: "#3B82F6",
        Vivienda: "#EC4899",
        Ocio: "#10B981",
        Salud: "#F59E0B",
        Compras: "#EF4444",
        Educacion: "#6366F1",
      };

      missingCategories.forEach((categoryName) => {
        const categoryExpenses = expenses.filter((e) => e?.category === categoryName);
        const subcategories = Array.from(
          new Set(categoryExpenses.map((e) => e?.subcategory).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));

        // Asegurar que siempre sea un objeto con subcategories (array) y color
        restoredCategories[categoryName] = {
          subcategories: Array.isArray(subcategories) ? subcategories : [],
          color: categoryColors[categoryName] || "#8B5CF6",
        };
      });

      const persistRestored = async () => {
        try {
          await saveCategories(user.uid, restoredCategories, { mergeMode: "merge" });
          setCategories(restoredCategories);
          console.log("[Restauración automática] Categorías restauradas:", Array.from(missingCategories));
        } catch (error) {
          console.error("Error restoring missing categories:", error);
        } finally {
          isRestoringRef.current = false;
        }
      };

      void persistRestored();
      return;
    }

    // Crear un hash de las categorías y gastos para detectar cambios reales
    const categoriesHash = JSON.stringify(
      Object.keys(categories).sort().map((cat) => ({
        name: cat,
        subs: getCategorySubcategories(categories[cat]).sort(),
      }))
    );
    const expensesHash = JSON.stringify(
      expenses
        .filter((e) => e?.category && e?.subcategory)
        .map((e) => `${e.category}:${e.subcategory}`)
        .sort()
        .slice(0, 100) // Limitar a los primeros 100 para evitar hashes muy grandes
    );
    const currentHash = `${categoriesHash}:${expensesHash}`;

    // Si no ha cambiado nada desde la última vez, no hacer nada
    if (currentHash === lastRestoreHashRef.current) {
      return;
    }

    const missingSubcategoriesByCategory = {};

    expenses.forEach((expense) => {
      if (!expense?.category || !expense?.subcategory) {
        return;
      }

      const categoryData = categories[expense.category];
      if (!categoryData) {
        return;
      }

      const existingSubcategories = getCategorySubcategories(categoryData);
      if (!existingSubcategories.includes(expense.subcategory)) {
        if (!missingSubcategoriesByCategory[expense.category]) {
          missingSubcategoriesByCategory[expense.category] = new Set(
            existingSubcategories
          );
        }
        missingSubcategoriesByCategory[expense.category].add(expense.subcategory);
      }
    });

    const categoriesToUpdate = Object.entries(missingSubcategoriesByCategory);
    if (categoriesToUpdate.length === 0) {
      lastRestoreHashRef.current = currentHash;
      return;
    }

    // Hay subcategorías faltantes, restaurarlas
    isRestoringRef.current = true;

    // Asegurar que categories sea un objeto, nunca un array
    let safeCategories = {};
    if (categories && typeof categories === "object" && !Array.isArray(categories)) {
      safeCategories = { ...categories };
    } else if (Array.isArray(categories)) {
      console.error("[Restauración automática] ERROR: categories es un array, ignorando y usando objeto vacío");
      safeCategories = {};
    }

    const restoredCategories = { ...safeCategories };

    categoriesToUpdate.forEach(([categoryName, subcategorySet]) => {
      const categoryColor = getCategoryColor(categories[categoryName]);
      const existingSubs = getCategorySubcategories(categories[categoryName]);
      const allSubs = Array.from(
        new Set([...existingSubs, ...Array.from(subcategorySet)])
      ).sort((a, b) => a.localeCompare(b));

      restoredCategories[categoryName] = {
        subcategories: allSubs,
        color: categoryColor,
      };

      console.log(
        `[Restauración automática] Restaurando subcategorías en "${categoryName}":`,
        allSubs.filter((sub) => !existingSubs.includes(sub))
      );
    });

    const persistRestored = async () => {
      try {
        // Usar modo "merge" para fusionar subcategorías de forma segura
        const savedCategories = await saveCategories(user.uid, restoredCategories, {
          mergeMode: "merge",
        });
        lastRestoreHashRef.current = JSON.stringify(
          Object.keys(savedCategories).sort().map((cat) => ({
            name: cat,
            subs: getCategorySubcategories(savedCategories[cat]).sort(),
          }))
        );
        setCategories(savedCategories);
      } catch (error) {
        console.error("Error restoring missing subcategories:", error);
      } finally {
        isRestoringRef.current = false;
      }
    };

    void persistRestored();
  }, [user, loading, categories, expenses]);

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

  // Efecto para alertas de presupuesto (80%, 90%, 100%) - Solo cuando cambian los datos
  useEffect(() => {
    if (!user || !notificationSettings?.budgetAlerts?.enabled || !budgets || Object.keys(budgets).length === 0) {
      return;
    }

    // Solo verificar si los gastos han cambiado (no cada vez que se monta el componente)
    const checkBudgetAlerts = () => {
      const today = new Date().toDateString();
      const lastCheckDate = budgetAlertsShownRef.current.lastCheckDate;
      
      // Limpiar alertas mostradas al cambiar de día
      if (lastCheckDate !== today) {
        budgetAlertsShownRef.current.clear();
        budgetAlertsShownRef.current.lastCheckDate = today;
      }

      Object.entries(budgets).forEach(([category, budget]) => {
        const categoryTotal = categoryTotalsForBudgets.find((ct) => ct.category === category)?.total || 0;
        const percentage = (categoryTotal / budget) * 100;
        const alertKey = `${category}-${Math.floor(percentage / 10) * 10}`; // Agrupar por decenas

        // Solo mostrar alerta si no se ha mostrado antes hoy Y si realmente cruzó el umbral
        if (budgetAlertsShownRef.current.has(alertKey)) {
          return;
        }

        const alerts = notificationSettings.budgetAlerts;
        
        // Solo mostrar si realmente alcanzó el umbral (no si ya estaba por encima)
        if (percentage >= 100 && alerts.at100) {
          budgetAlertsShownRef.current.add(alertKey);
          showNotification(
            `⚠️ Presupuesto de ${category} superado al ${percentage.toFixed(0)}%`,
            "error"
          );
          trackBudgetAlert(category, percentage);
        } else if (percentage >= 90 && alerts.at90 && percentage < 100) {
          budgetAlertsShownRef.current.add(alertKey);
          showNotification(
            `⚠️ Presupuesto de ${category} al ${percentage.toFixed(0)}%`,
            "error"
          );
          trackBudgetAlert(category, percentage);
        } else if (percentage >= 80 && alerts.at80 && percentage < 90) {
          budgetAlertsShownRef.current.add(alertKey);
          showNotification(
            `⚠️ Presupuesto de ${category} al ${percentage.toFixed(0)}%`,
            "error"
          );
          trackBudgetAlert(category, percentage);
        }
      });
    };

    // Solo ejecutar si hay cambios reales en los gastos (usar un debounce)
    const timeoutId = setTimeout(() => {
      checkBudgetAlerts();
    }, 1000); // Esperar 1 segundo después de cambios

    return () => clearTimeout(timeoutId);
  }, [budgets, categoryTotalsForBudgets, notificationSettings, user, showNotification]);

  // Efecto para recordatorios de gastos recurrentes - Solo una vez al día
  useEffect(() => {
    if (!user || !notificationSettings?.recurringReminders?.enabled || !recurringExpenses || recurringExpenses.length === 0) {
      return;
    }

    const checkRecurringReminders = () => {
      const today = new Date();
      const dayOfMonth = today.getDate();
      const todayKey = today.toDateString();
      
      // Verificar si ya se mostró hoy
      const lastCheck = localStorage.getItem(`recurringCheck_${user.uid}_${todayKey}`);
      if (lastCheck) {
        return; // Ya se mostró hoy
      }

      const remindersToShow = recurringExpenses
        .filter((recurring) => recurring.active && recurring.dayOfMonth === dayOfMonth);

      if (remindersToShow.length > 0) {
        // Mostrar solo una notificación con todos los recordatorios
        const remindersText = remindersToShow
          .map((r) => `${r.name} (€${r.amount.toFixed(2)})`)
          .join(", ");
        
        showNotification(
          `💡 Recordatorios de hoy: ${remindersText}`,
          "success"
        );
        
        // Marcar como mostrado
        localStorage.setItem(`recurringCheck_${user.uid}_${todayKey}`, "true");
      }
    };

    // Solo verificar una vez cuando se carga la app, no en cada render
    checkRecurringReminders();
  }, [recurringExpenses?.length, notificationSettings?.recurringReminders?.enabled, user?.uid]); // Dependencias más específicas

  // Efecto para recordatorios personalizados - Programar notificación local que se queda en la bandeja
  // Las notificaciones ahora se manejan desde Cloud Functions
  // No necesitamos programar notificaciones locales aquí

  // Inicializar notificaciones push cuando el usuario inicia sesión
  useEffect(() => {
    if (!user) {
      // Limpiar listener y tokens si el usuario cierra sesión
      if (unsubscribeRef.current) {
        console.log("🧹 Limpiando listener de notificaciones push al cerrar sesión...");
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        listenerConfiguredRef.current = false;
      }
      return;
    }

    // Verificar que messaging esté disponible
    if (!messaging) {
      console.warn("Firebase Messaging no está disponible en este navegador");
      return;
    }

    // Clave VAPID obtenida de Firebase Console
    // Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
    const VAPID_KEY_FROM_FIREBASE = "BG-spFoiC7ziY8GRhsx9t5sEX_6yXgs6b87Ax6w6sOJeBk22WTQz2-GWvTgxcXannfTpa8rLqyQsTumeRw2khd8";
    
    if (VAPID_KEY_FROM_FIREBASE) {
      setVAPIDKey(VAPID_KEY_FROM_FIREBASE);
      
      // Asegurar que el Service Worker esté registrado y activo (solo una vez)
      let tokenRequested = false;
      
      const ensureServiceWorkerActive = async () => {
        // Evitar múltiples solicitudes de token
        if (tokenRequested) {
          return;
        }
        
        if ("serviceWorker" in navigator) {
          try {
            // Verificar si hay un Service Worker registrado
            let registration = await navigator.serviceWorker.getRegistration();
            
            if (!registration) {
              console.log("⚠️ No hay Service Worker registrado, registrando...");
              registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
                scope: "/",
                updateViaCache: "none",
              });
              console.log("✅ Service Worker registrado:", registration.scope);
            }
            
            // Esperar a que el Service Worker esté listo
            await navigator.serviceWorker.ready;
            console.log("✅ Service Worker activo y listo");
            
            // Verificar permisos y solicitar token FCM (solo una vez)
            const permission = getNotificationPermission();
            console.log("📱 Permisos de notificación:", permission);
            
            if (permission === "granted") {
              if (!tokenRequested) {
                tokenRequested = true;
                // Solicitar token FCM (esto también lo guarda automáticamente)
                try {
                  console.log("🔑 Solicitando token FCM...");
                  const token = await requestNotificationPermission(user.uid);
                  if (token) {
                    console.log("✅ Token FCM obtenido y guardado:", token.substring(0, 20) + "...");
                  } else {
                    console.warn("⚠️ No se pudo obtener el token FCM");
                    tokenRequested = false; // Permitir reintento si falla
                  }
                } catch (error) {
                  console.error("❌ Error obteniendo token FCM:", error);
                  tokenRequested = false; // Permitir reintento si falla
                }
              }
            } else if (permission === "default") {
              console.log("ℹ️ Permisos de notificación pendientes. El usuario debe concederlos.");
            } else if (permission === "denied") {
              console.warn("⚠️ Permisos de notificación denegados");
            }
          } catch (error) {
            console.error("❌ Error verificando Service Worker:", error);
            tokenRequested = false; // Permitir reintento si falla
          }
        } else {
          console.warn("⚠️ Service Worker no está disponible en este navegador");
        }
      };
      
      // Configurar listener para mensajes en primer plano (solo una vez)
      if (!listenerConfiguredRef.current) {
        listenerConfiguredRef.current = true;
        console.log("🔧 Configurando listener de notificaciones push...");
        
        unsubscribeRef.current = setupForegroundMessageListener((payload) => {
          console.log("📬 ========== CALLBACK EJECUTADO ==========");
          console.log("📬 Payload recibido en callback:", payload);

          const type = payload?.data?.type || "unknown";
          const message =
            payload.notification?.body ||
            payload.data?.message ||
            "Tienes una nueva notificación";

          // Para notificaciones push del servidor (recordatorios diarios/semanales o prueba),
          // dejamos que solo se muestre la notificación del sistema (iOS/Android) para evitar duplicados.
          const isServerReminder =
            type === "reminder" ||
            type === "daily-reminder" ||
            type === "weekly-reminder" ||
            type === "test";

          if (isServerReminder) {
            console.log(
              "📬 Notificación de servidor recibida en primer plano (type=%s). No se muestra banner interno para evitar duplicados.",
              type
            );
            return;
          }

          console.log(
            "📬 Mostrando notificación interna con mensaje:",
            message
          );

          // Usar la referencia actualizada al callback
          if (showNotificationRef.current) {
            showNotificationRef.current(message, "success");
          }
          console.log("📬 Notificación interna mostrada");
        });
        
        if (unsubscribeRef.current) {
          console.log("✅ Listener de notificaciones push configurado correctamente");
        } else {
          console.warn("⚠️ No se pudo configurar el listener de notificaciones push");
          listenerConfiguredRef.current = false;
        }
      }
      
      // Ejecutar solo una vez después de un pequeño delay
      const timeoutId = setTimeout(() => {
        ensureServiceWorkerActive();
      }, 1000);
      
      return () => {
        clearTimeout(timeoutId);
        if (unsubscribeRef.current) {
          console.log("🧹 Limpiando listener de notificaciones push...");
          unsubscribeRef.current();
          unsubscribeRef.current = null;
          listenerConfiguredRef.current = false;
        }
      };
    } else {
      console.warn("VAPID key no configurada. Las notificaciones push no funcionarán hasta que la configures.");
    }
  }, [user]);

  // Handler para solicitar permisos desde SettingsModal
  const handleRequestPushPermission = useCallback(async () => {
    if (!user || !messaging) {
      showNotification("El servicio de notificaciones no está disponible", "error");
      return;
    }

    try {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        // Marcar pushNotifications.enabled = true en la configuración guardada
        const updatedSettings = {
          ...notificationSettings,
          pushNotifications: {
            ...(notificationSettings.pushNotifications || {}),
            enabled: true,
          },
        };

        try {
          await saveNotificationSettings(user.uid, updatedSettings);
          setNotificationSettings(updatedSettings);
        } catch (error) {
          console.error("Error guardando pushNotifications tras activar permisos:", error);
        }

        showNotification("Notificaciones push activadas correctamente", "success");
      }
    } catch (error) {
      console.error("Error solicitando permisos push:", error);
      showNotification("Error al activar notificaciones push", "error");
    }
  }, [user, messaging, notificationSettings, showNotification]);

  // Efecto para actualizar historial mensual y badges automáticamente
  useEffect(() => {
    // No hacer nada si:
    // - No hay usuario
    // - No hay objetivos configurados (goals es null o está vacío)
    // - No hay ingresos configurados (income es null, undefined o 0)
    if (!user || !goals || income === null || income === undefined || income === 0) {
      return;
    }

    // Si el usuario no tiene ningún objetivo configurado todavía,
    // no guardamos nada automáticamente para evitar crear objetivos "vacíos"
    const hasAnyGoalConfigured =
      (goals.monthlySavingsGoal && goals.monthlySavingsGoal > 0) ||
      (goals.totalSavingsGoal && goals.totalSavingsGoal > 0) ||
      (goals.categoryGoals && Object.keys(goals.categoryGoals).length > 0) ||
      (goals.longTermGoals && goals.longTermGoals.length > 0);

    if (!hasAnyGoalConfigured) {
      return;
    }

    const currentMonthExpenses = categoryTotalsForBudgets.reduce((sum, item) => sum + item.total, 0);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    
    // Obtener entrada actual del historial
    const currentHistoryEntry = goals.monthlyHistory?.[currentMonthKey];
    const monthlySavings = income - currentMonthExpenses;
    const monthlyGoal = goals.monthlySavingsGoal || goals.totalSavingsGoal || 0;
    
    // Objetivo esperado según el día del mes (proporcional)
    const expectedSavingsByNow = monthlyGoal > 0
      ? (monthlyGoal * currentDay) / daysInMonth
      : 0;
    
    // Considerar objetivo completado solo si estamos al final de mes
    // y se ha alcanzado o superado el objetivo total
    const isEndOfMonth = currentDay >= daysInMonth - 1;
    const completed = monthlyGoal > 0 && isEndOfMonth && monthlySavings >= monthlyGoal;
    
    // Solo actualizar si el valor cambió o no existe
    const shouldUpdate = !currentHistoryEntry || 
      currentHistoryEntry.savings !== monthlySavings || 
      currentHistoryEntry.completed !== completed;
    
    if (shouldUpdate) {
      // Actualizar historial mensual
      const updatedHistory = updateMonthlyHistory(goals, income, currentMonthExpenses);
      
      // Calcular badges y rachas
      const badges = calculateBadges(goals, updatedHistory, income, currentMonthExpenses);
      const streakMonths = calculateStreak(updatedHistory);
      
      const updatedGoals = {
        ...goals,
        monthlyHistory: updatedHistory,
        achievements: {
          totalCompleted: Object.values(updatedHistory).filter((h) => h.completed).length,
          streakMonths: streakMonths,
          badges: badges.map((badge) => ({
            id: badge.id,
            name: badge.name,
            icon: badge.name.split(" ")[0],
            unlockedAt: new Date().toISOString(),
          })),
        },
      };
      
      // Detectar objetivos recién completados solo si el estado cambió de no completado a completado
      if (currentHistoryEntry && !currentHistoryEntry.completed && completed) {
        const newlyCompleted = detectNewlyCompletedGoals(previousGoals || goals, updatedGoals);
        if (newlyCompleted.length > 0) {
          // setCompletedGoal(newlyCompleted[0]); // Comentado temporalmente
          // setShowCelebration(true); // Comentado temporalmente
          setPreviousGoals(goals);
        }
      }
      
      // Actualizar sin mostrar notificación (actualización automática)
      saveGoals(user.uid, updatedGoals).catch((error) => {
        console.error("Error auto-updating goals:", error);
      });
      
      setGoals(updatedGoals);
    }
  }, [expenses.length, income, categoryTotalsForBudgets.length, user?.uid]); // Solo cuando cambian los gastos o ingresos


  // Memoizar clases CSS para evitar recálculos
  const { bgClass, cardClass, textClass, textSecondaryClass, inputClass } = useMemo(() => ({
    bgClass: darkMode
      ? "bg-gray-900"
      : "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50",
    cardClass: darkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-white/80 backdrop-blur-sm border-white/60",
    textClass: darkMode ? "text-gray-100" : "text-purple-900",
    textSecondaryClass: darkMode ? "text-gray-200" : "text-purple-600",
    inputClass: darkMode
      ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-purple-500"
      : "bg-white border-purple-200 text-purple-900 focus:ring-purple-500",
  }), [darkMode]);

  const handleOpenAddExpense = useCallback(() => {
    setShowAddExpense(true);
    setShowManagement(false);
    trackOpenModal("add_expense");
  }, []);

  const handleOpenCategories = useCallback(() => {
    setShowCategories(true);
    setShowManagement(false);
    trackOpenModal("categories");
  }, []);


  const handleOpenGoals = useCallback(() => {
    setShowGoals(true);
    setShowManagement(false);
    trackOpenModal("goals");
  }, []);

  const handleOpenRecurring = useCallback(() => {
    setShowRecurring(true);
    setShowManagement(false);
    trackOpenModal("recurring");
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
    setShowManagement(false);
    trackOpenModal("settings");
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

  const handleCompleteOnboarding = useCallback(async () => {
    if (user) {
      try {
        await markOnboardingAsCompleted(user.uid);
        setShowOnboarding(false);
      } catch (error) {
        console.error("Error marking onboarding as completed:", error);
      }
    }
  }, [user]);

  const handleSaveIncome = useCallback(async (newIncome) => {
    if (!user) return;
    try {
      // Si es null, undefined o 0, guardar null (no configurado)
      const incomeToSave = newIncome === null || newIncome === undefined || newIncome === 0 ? null : newIncome;
      await saveIncome(user.uid, incomeToSave);
      setIncome(incomeToSave !== null ? incomeToSave : 0); // Para el estado local, usar 0 si es null
      if (incomeToSave === null) {
        showNotification("Ingresos eliminados. Recibirás un recordatorio al final del mes para ingresos variables.");
      } else {
        showNotification("Ingresos actualizados correctamente");
      }
    } catch (error) {
      console.error("Error saving income:", error);
      showNotification("Error al guardar los ingresos", "error");
    }
  }, [user, showNotification]);

  const handleSaveNotificationSettings = useCallback(async (settings) => {
    if (!user) return;
    try {
      await saveNotificationSettings(user.uid, settings);
      setNotificationSettings(settings);
      showNotification("Configuración de notificaciones actualizada", "success");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      showNotification("Error al guardar la configuración", "error");
    }
  }, [user, showNotification]);

  const handleSaveGoals = useCallback(async (newGoals) => {
    if (!user) return;
    try {
      // Actualizar historial mensual
      const currentMonthExpenses = categoryTotalsForBudgets.reduce((sum, item) => sum + item.total, 0);
      const updatedHistory = updateMonthlyHistory(goals, income, currentMonthExpenses);
      
      // Calcular badges y rachas
      const badges = calculateBadges(newGoals, updatedHistory, income, currentMonthExpenses);
      const streakMonths = calculateStreak(updatedHistory);
      
      // Actualizar objetivos con historial y badges
      const goalsToSave = {
        ...newGoals,
        monthlyHistory: updatedHistory,
        achievements: {
          totalCompleted: Object.values(updatedHistory).filter((h) => h.completed).length,
          streakMonths: streakMonths,
          badges: badges.map((badge) => ({
            id: badge.id,
            name: badge.name,
            icon: badge.name.split(" ")[0],
            unlockedAt: new Date().toISOString(),
          })),
        },
      };
      
      // Detectar objetivos recién completados
      const newlyCompleted = detectNewlyCompletedGoals(previousGoals || goals, goalsToSave);
      if (newlyCompleted.length > 0) {
        // setCompletedGoal(newlyCompleted[0]); // Comentado temporalmente
        // setShowCelebration(true); // Comentado temporalmente
      }
      
      // Guardar objetivos anteriores para comparar
      setPreviousGoals(goals);
      
      await saveGoals(user.uid, goalsToSave);
      setGoals(goalsToSave);
      
      // Trackear qué tipo de objetivos se guardaron
      if (newGoals.monthlySavingsGoal > 0 || newGoals.totalSavingsGoal > 0) {
        trackSaveGoal("total_savings");
      }
      if (newGoals.categoryGoals && Object.keys(newGoals.categoryGoals).length > 0) {
        trackSaveGoal("category_goal");
      }
      if (newGoals.longTermGoals && newGoals.longTermGoals.length > 0) {
        trackSaveGoal("long_term_goal");
      }
      
      showNotification("Objetivos actualizados correctamente");
      setShowGoals(false);
    } catch (error) {
      console.error("Error saving goals:", error);
      showNotification("Error al guardar los objetivos", "error");
    }
  }, [user, showNotification, goals, income, categoryTotalsForBudgets, previousGoals]);

  const handleExportCSV = useCallback(() => {
    try {
      let filename = "gastos";
      switch (filterPeriodType) {
        case "all":
          filename = "gastos_todos";
          break;
        case "year":
          filename = `gastos_${selectedYear}`;
          break;
        case "month":
        default:
          filename = `gastos_${selectedMonth}`;
          break;
      }
      exportToCSV(filteredExpenses, filename);
      trackExportCSV(filterPeriodType);
      showNotification("Gastos exportados correctamente");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      showNotification("Error al exportar los gastos", "error");
    }
  }, [filteredExpenses, filterPeriodType, selectedMonth, selectedYear, showNotification, user]);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterPeriodType("month");
    setSelectedMonth(new Date().toISOString().slice(0, 7));
    setSelectedYear(new Date().getFullYear().toString());
    setSelectedCategory("all");
  }, []);

  const handleViewChange = useCallback((view) => {
    setActiveView(view);
    trackViewChange(view);
    // Si cambiamos a una vista que no debe tener filtros, ocultarlos
    if (view === "recent" || view === "budgets" || view === "goals") {
      setShowFilters(false);
    }
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
    } else if (context.type === "categoryGoal") {
      const updatedGoals = { ...goals };
      delete updatedGoals.categoryGoals[context.category];
      handleSaveGoals(updatedGoals);
    } else if (context.type === "longTermGoal") {
      const updatedGoals = { ...goals };
      updatedGoals.longTermGoals = (updatedGoals.longTermGoals || []).filter((g) => g.id !== context.goalId);
      handleSaveGoals(updatedGoals);
    }
  };

  const handleUpdateLongTermGoalAmount = useCallback(async (goalId, newAmount) => {
    if (!user) return;
    try {
      const updatedGoals = {
        ...goals,
        longTermGoals: (goals.longTermGoals || []).map((goal) =>
          goal.id === goalId ? { ...goal, currentAmount: newAmount } : goal
        ),
      };
      
      // Detectar si se completó el objetivo
      const updatedGoal = updatedGoals.longTermGoals.find((g) => g.id === goalId);
      if (updatedGoal && updatedGoal.currentAmount >= updatedGoal.targetAmount && updatedGoal.status === "active") {
        updatedGoal.status = "completed";
        // setCompletedGoal({ // Comentado temporalmente
        //   type: "longTerm",
        //   name: updatedGoal.name,
        //   amount: updatedGoal.currentAmount,
        //   goal: updatedGoal.targetAmount,
        // });
        // setShowCelebration(true); // Comentado temporalmente
      }
      
      await saveGoals(user.uid, updatedGoals);
      setGoals(updatedGoals);
    } catch (error) {
      console.error("Error updating long-term goal:", error);
      showNotification("Error al actualizar el objetivo", "error");
    }
  }, [user, goals, showNotification]);

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
        showCategories={showCategories}
        showSettings={showSettings}
        showRecurring={showRecurring}
        showManagement={showManagement}
        overBudgetCount={overBudgetCategories.length}
        onToggleManagement={() => setShowManagement((prev) => !prev)}
        onSelectCategories={handleOpenCategories}
        onSelectGoals={handleOpenGoals}
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
        filterPeriodType={filterPeriodType}
        onFilterPeriodTypeChange={handleFilterPeriodTypeChange}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        onClearFilters={handleClearFilters}
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
        categoryTotalsForBudgets={categoryTotalsForBudgets}
        budgets={budgets}
        recentExpenses={recentExpenses}
        recurringExpenses={recurringExpenses}
        goals={goals}
        income={income}
        onOpenGoals={handleOpenGoals}
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
          onAddCategory={async (categoryName) => {
            if (!user || !categoryName) return;
            try {
              const updatedCategories = {
                ...categories,
                [categoryName]: {
                  subcategories: [],
                  color: newCategoryColor,
                },
              };
              await saveCategories(user.uid, updatedCategories);
              setCategories(updatedCategories);
              setNewExpense({ ...newExpense, category: categoryName });
              showNotification("Categoría añadida correctamente");
            } catch (error) {
              showNotification("Error al añadir la categoría", "error");
            }
          }}
          onAddSubcategory={async (subcategoryName) => {
            if (!user || !newExpense.category || !subcategoryName) return;
            try {
              const categoryData = categories[newExpense.category];
              const subcategories = getCategorySubcategories(categoryData);
              const updatedCategories = {
                ...categories,
                [newExpense.category]: {
                  subcategories: [...subcategories, subcategoryName],
                  color: categoryData?.color || "#8B5CF6",
                },
              };
              await saveCategories(user.uid, updatedCategories);
              setCategories(updatedCategories);
              setNewExpense({ ...newExpense, subcategory: subcategoryName });
              showNotification("Subcategoría añadida correctamente");
            } catch (error) {
              showNotification("Error al añadir la subcategoría", "error");
            }
          }}
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
          editingSubcategory={editingSubcategory}
          onStartEditSubcategory={setEditingSubcategory}
          onCancelEditSubcategory={() => setEditingSubcategory(null)}
          onSaveEditSubcategory={() => {
            if (editingSubcategory) {
              handleEditSubcategory(
                editingSubcategory.category,
                editingSubcategory.oldName,
                editingSubcategory.newName
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

      <Suspense fallback={showGoals ? <ModalLoader /> : null}>
        <GoalsModal
          visible={showGoals}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          textSecondaryClass={textSecondaryClass}
          inputClass={inputClass}
          categories={categories}
          goals={goals}
          income={income}
          categoryTotals={categoryTotalsForBudgets}
          onSaveGoals={handleSaveGoals}
          onRequestDelete={(context) => setShowDeleteConfirm(context)}
          onClose={() => setShowGoals(false)}
        />
      </Suspense>

      {/* CelebrationModal comentado temporalmente
      <CelebrationModal
        visible={showCelebration}
        goal={completedGoal}
        onClose={() => {
          setShowCelebration(false);
          setCompletedGoal(null);
        }}
        darkMode={darkMode}
      />
      */}

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
          income={income}
          onSaveIncome={handleSaveIncome}
          notificationSettings={notificationSettings}
          onSaveNotificationSettings={handleSaveNotificationSettings}
          onRequestPushPermission={handleRequestPushPermission}
          showNotification={showNotification}
          userId={user?.uid}
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
          lastSeenVersion={changelogSeenVersion}
          currentVersion={CURRENT_CHANGELOG_VERSION}
        />
      </Suspense>

      <Suspense fallback={showOnboarding ? <ModalLoader /> : null}>
        <OnboardingModal
          visible={showOnboarding}
          darkMode={darkMode}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleCompleteOnboarding}
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
