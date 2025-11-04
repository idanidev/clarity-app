import { signOut } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { auth } from "../../firebase";
import {
  addExpense as addExpenseDB,
  addRecurringExpense,
  deleteExpense as deleteExpenseDB,
  deleteRecurringExpense,
  getRecurringExpenses,
  getUserBudgets,
  getUserCategories,
  getUserTheme,
  initializeUser,
  saveBudgets,
  saveCategories,
  saveTheme,
  subscribeToExpenses,
  subscribeToRecurringExpenses,
  updateExpense as updateExpenseDB,
  updateRecurringExpense,
} from "../../services/firestoreService";
import AddExpenseModal from "./components/AddExpenseModal";
import BudgetsModal from "./components/BudgetsModal";
import CategoriesModal from "./components/CategoriesModal";
import DeleteConfirmationDialog from "./components/DeleteConfirmationDialog";
import EditExpenseModal from "./components/EditExpenseModal";
import Header from "./components/Header";
import MainContent from "./components/MainContent";
import MobileMenu from "./components/MobileMenu";
import Notification from "./components/Notification";
import RecurringExpensesModal from "./components/RecurringExpensesModal";
import SettingsModal from "./components/SettingsModal";

const Dashboard = ({ user }) => {
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
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [newRecurring, setNewRecurring] = useState({
    name: "",
    amount: "",
    category: "",
    subcategory: "",
    dayOfMonth: 1,
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
  const [newSubcategory, setNewSubcategory] = useState("");
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState("");

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

        const [userCategories, userBudgets, userTheme] = await Promise.all([
          getUserCategories(user.uid),
          getUserBudgets(user.uid),
          getUserTheme(user.uid),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(userCategories);
        setBudgets(userBudgets);
        setDarkMode(userTheme === "dark");

        const initialExpanded = {};
        Object.keys(userCategories).forEach((cat) => {
          initialExpanded[cat] = true;
        });
        setExpandedCategories(initialExpanded);

        unsubscribeExpenses = subscribeToExpenses(
          user.uid,
          (expensesData) => {
            if (!isMounted) {
              return;
            }
            setExpenses(expensesData);
            setLoading(false);
          }
        );

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
  }, [user]);

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

  const handleEditRecurringSubmit = async (e) => {
    e.preventDefault();
    if (!user || !editingRecurring) return;

    try {
      const updates = {
        name: editingRecurring.name,
        amount: parseFloat(editingRecurring.amount),
        category: editingRecurring.category,
        subcategory: editingRecurring.subcategory,
        dayOfMonth: parseInt(editingRecurring.dayOfMonth, 10),
        paymentMethod: editingRecurring.paymentMethod,
      };

      updates.endDate = editingRecurring.endDate ? editingRecurring.endDate : "";

      await updateRecurringExpense(user.uid, editingRecurring.id, updates);
      const updated = await getRecurringExpenses(user.uid);
      setRecurringExpenses(updated);
      setEditingRecurring(null);
      showNotification("Gasto recurrente actualizado", "success");
    } catch (error) {
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

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
        [newCategory]: [],
      };

      await saveCategories(user.uid, updatedCategories);
      setCategories(updatedCategories);
      setExpandedCategories((prev) => ({
        ...prev,
        [newCategory]: true,
      }));
      setNewCategory("");
      showNotification("Categoría añadida correctamente");
    } catch (error) {
      showNotification("Error al añadir la categoría", "error");
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!user || !selectedCategoryForSub || !newSubcategory.trim()) return;

    try {
      const updatedCategories = {
        ...categories,
        [selectedCategoryForSub]: [
          ...(categories[selectedCategoryForSub] || []),
          newSubcategory,
        ],
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
      const updatedCategories = {
        ...categories,
        [category]: categories[category].filter((sub) => sub !== subcategory),
      };

      await saveCategories(user.uid, updatedCategories);
      setCategories(updatedCategories);
      setShowDeleteConfirm(null);
      showNotification("Subcategoría eliminada correctamente");
    } catch (error) {
      showNotification("Error al eliminar la subcategoría", "error");
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

  const bgClass = darkMode
    ? "bg-gray-900"
    : "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50";
  const cardClass = darkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white/80 backdrop-blur-sm border-white/60";
  const textClass = darkMode ? "text-gray-100" : "text-purple-900";
  const textSecondaryClass = darkMode ? "text-gray-400" : "text-purple-600";
  const inputClass = darkMode
    ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-purple-500"
    : "bg-white border-purple-200 text-purple-900 focus:ring-purple-500";

  const handleNavigateHome = () => {
    setShowAddExpense(false);
    setShowBudgets(false);
    setShowCategories(false);
    setShowSettings(false);
    setShowRecurring(false);
    setShowManagement(false);
  };

  const handleOpenAddExpense = () => {
    setShowAddExpense(true);
    setShowManagement(false);
  };

  const handleOpenCategories = () => {
    setShowCategories(true);
    setShowManagement(false);
  };

  const handleOpenBudgets = () => {
    setShowBudgets(true);
    setShowManagement(false);
  };

  const handleOpenRecurring = () => {
    setShowRecurring(true);
    setShowManagement(false);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    setShowManagement(false);
  };

  const handleToggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const handleMonthChange = (value) => {
    setSelectedMonth(value);
  };

  const handleCategoryFilterChange = (value) => {
    setSelectedCategory(value);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const handleRequestDelete = (payload) => {
    setShowDeleteConfirm(payload);
  };

  const handleRecurringStartEdit = (recurring) => {
    setEditingRecurring(recurring);
  };

  const handleRecurringEditChange = (updated) => {
    setEditingRecurring(updated);
  };

  const handleRecurringClose = () => {
    setEditingRecurring(null);
    setShowRecurring(false);
    setShowMenu(false);
  };

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
        showAddExpense={showAddExpense}
        showBudgets={showBudgets}
        showCategories={showCategories}
        showSettings={showSettings}
        showRecurring={showRecurring}
        showManagement={showManagement}
        overBudgetCount={overBudgetCategories.length}
        onSelectHome={handleNavigateHome}
        onOpenAddExpense={handleOpenAddExpense}
        onToggleManagement={() => setShowManagement((prev) => !prev)}
        onSelectCategories={handleOpenCategories}
        onSelectBudgets={handleOpenBudgets}
        onSelectRecurring={handleOpenRecurring}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
        onOpenMenu={() => setShowMenu(true)}
      />

      <MobileMenu
        visible={showMenu}
        darkMode={darkMode}
        textClass={textClass}
        onClose={() => setShowMenu(false)}
        onNavigateHome={handleNavigateHome}
        onOpenAddExpense={handleOpenAddExpense}
        onShowCategories={handleOpenCategories}
        onShowBudgets={handleOpenBudgets}
        onShowRecurring={handleOpenRecurring}
        onShowSettings={handleOpenSettings}
        onLogout={handleLogout}
      />

      <MainContent
        cardClass={cardClass}
        textClass={textClass}
        textSecondaryClass={textSecondaryClass}
        inputClass={inputClass}
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
      />

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

      <CategoriesModal
        visible={showCategories}
        darkMode={darkMode}
        cardClass={cardClass}
        textClass={textClass}
        inputClass={inputClass}
        categories={categories}
        newCategory={newCategory}
        onNewCategoryChange={setNewCategory}
        onAddCategory={handleAddCategory}
        selectedCategoryForSub={selectedCategoryForSub}
        onSelectCategoryForSub={setSelectedCategoryForSub}
        newSubcategory={newSubcategory}
        onNewSubcategoryChange={setNewSubcategory}
        onAddSubcategory={handleAddSubcategory}
        onRequestDelete={handleRequestDelete}
        onClose={() => setShowCategories(false)}
      />

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

      <SettingsModal
        visible={showSettings}
        darkMode={darkMode}
        cardClass={cardClass}
        textClass={textClass}
        textSecondaryClass={textSecondaryClass}
        toggleDarkMode={toggleDarkMode}
        onClose={() => setShowSettings(false)}
      />

      <DeleteConfirmationDialog
        context={showDeleteConfirm}
        darkMode={darkMode}
        cardClass={cardClass}
        textClass={textClass}
        textSecondaryClass={textSecondaryClass}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={handleConfirmDeletion}
      />

      <Notification notification={notification} onClose={handleNotificationClose} />
    </div>
  );
};

export default Dashboard;
