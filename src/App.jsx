import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  LogOut,
  Menu as MenuIcon,
  Moon,
  Pencil,
  Plus,
  Settings as SettingsIcon,
  Sun,
  Table as TableIcon,
  Target,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import { auth } from "./firebase";
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
  updateExpense as updateExpenseDB,
  updateRecurringExpense,
} from "./services/firestoreService";

const ClarityExpenseApp = () => {
  // Estados principales
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  // Estados de UI
  const [activeView, setActiveView] = useState("table");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);

  // NUEVOS Estados para modo oscuro y ajustes
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
  });

  // Estados de filtros
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Estados de formularios
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    category: "",
    subcategory: "",
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "Tarjeta",
    recurring: false,
  });

  const [editingExpense, setEditingExpense] = useState(null);

  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState("");

  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const [expandedCategories, setExpandedCategories] = useState({});

  // Cargar tema del usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await initializeUser(currentUser.uid, {
          email: currentUser.email,
        });

        const userCategories = await getUserCategories(currentUser.uid);
        const userBudgets = await getUserBudgets(currentUser.uid);
        const userTheme = await getUserTheme(currentUser.uid);

        setCategories(userCategories);
        setBudgets(userBudgets);
        setDarkMode(userTheme === "dark");

        // Inicializar categorías expandidas
        const initialExpanded = {};
        Object.keys(userCategories).forEach((cat) => {
          initialExpanded[cat] = true;
        });
        setExpandedCategories(initialExpanded);

        // Suscribirse a gastos
        const unsubscribeExpenses = subscribeToExpenses(
          currentUser.uid,
          (expensesData) => {
            setExpenses(expensesData);
            setLoading(false);
          }
        );

        // Cargar gastos recurrentes
        const recurring = await getRecurringExpenses(currentUser.uid);
        setRecurringExpenses(recurring);

        return () => unsubscribeExpenses();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Toggle tema oscuro
  const toggleDarkMode = async () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    if (user) {
      await saveTheme(user.uid, newTheme ? "dark" : "light");
    }
  };

  // Funciones de gastos recurrentes
  const handleAddRecurring = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addRecurringExpense(user.uid, {
        ...newRecurring,
        amount: parseFloat(newRecurring.amount),
      });

      setNewRecurring({
        name: "",
        amount: "",
        category: "",
        subcategory: "",
        dayOfMonth: 1,
        paymentMethod: "Tarjeta",
        active: true,
      });

      const updated = await getRecurringExpenses(user.uid);
      setRecurringExpenses(updated);

      showNotification("Gasto recurrente añadido", "success");
    } catch (error) {
      showNotification("Error al añadir gasto recurrente", "error");
    }
  };

  const handleUpdateRecurring = async (id, updates) => {
    if (!user) return;

    try {
      await updateRecurringExpense(user.uid, id, updates);
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
      const updated = await getRecurringExpenses(user.uid);
      setRecurringExpenses(updated);
      showNotification("Gasto recurrente eliminado", "success");
    } catch (error) {
      showNotification("Error al eliminar", "error");
    }
  };

  // Funciones existentes
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
        recurring: false,
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
      setUser(null);
      setExpenses([]);
      setCategories({});
      setBudgets({});
      showNotification("Sesión cerrada correctamente");
    } catch (error) {
      showNotification("Error al cerrar sesión", "error");
    }
  };

  // Cálculos y filtros
  const filteredExpenses = expenses.filter((expense) => {
    const matchesMonth = expense.date.startsWith(selectedMonth);
    const matchesCategory =
      selectedCategory === "all" || expense.category === selectedCategory;
    return matchesMonth && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = {};
    }
    if (!acc[expense.category][expense.subcategory]) {
      acc[expense.category][expense.subcategory] = [];
    }
    acc[expense.category][expense.subcategory].push(expense);
    return acc;
  }, {});

  const categoryTotals = Object.entries(expensesByCategory).map(
    ([category, subcategories]) => {
      const total = Object.values(subcategories)
        .flat()
        .reduce((sum, exp) => sum + exp.amount, 0);
      return { category, total };
    }
  );

  const overBudgetCategories = Object.entries(budgets)
    .filter(([category, budget]) => {
      const categoryTotal =
        categoryTotals.find((ct) => ct.category === category)?.total || 0;
      return categoryTotal > budget;
    })
    .map(([category]) => category);

  // Obtener gastos recientes (últimos 10)
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  // Clases de tema
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
    return <Auth />;
  }

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {/* Header */}
      <div
        className={`${
          darkMode ? "bg-gray-800/95" : "bg-white/60"
        } backdrop-blur-md border-b ${
          darkMode ? "border-gray-700" : "border-white/60"
        } sticky top-0 z-40`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Clarity
            </h1>
            <p className={`text-xs ${textSecondaryClass}`}>{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {overBudgetCategories.length > 0 && (
              <button
                onClick={() => setShowBudgets(true)}
                className="relative p-2 rounded-xl bg-red-100 hover:bg-red-200 border border-red-200 transition-all"
                title="Presupuesto superado"
              >
                <BellRing className="w-6 h-6 text-red-600" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {overBudgetCategories.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setShowMenu(true)}
              className={`p-2 rounded-xl ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-white/60 hover:bg-white/80"
              } border ${
                darkMode ? "border-gray-600" : "border-white/60"
              } transition-all`}
            >
              <MenuIcon
                className={`w-6 h-6 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notificación */}
      {notification && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[120] px-6 py-3 rounded-2xl backdrop-blur-xl border ${
            notification.type === "success"
              ? "bg-green-500/90 border-green-400"
              : "bg-orange-500/90 border-orange-400"
          } text-white font-medium shadow-lg animate-bounce`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Resumen Superior - Cards Informativos */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`${cardClass} rounded-2xl p-4 border shadow-lg`}>
            <div className="flex flex-col items-center text-center">
              <Target className={`w-5 h-5 mb-2 ${textSecondaryClass}`} />
              <span
                className={`text-xs font-medium mb-1 ${textSecondaryClass}`}
              >
                Total
              </span>
              <p className={`text-xl md:text-2xl font-bold ${textClass}`}>
                €{totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>

          <div className={`${cardClass} rounded-2xl p-4 border shadow-lg`}>
            <div className="flex flex-col items-center text-center">
              <BarChart3 className={`w-5 h-5 mb-2 ${textSecondaryClass}`} />
              <span
                className={`text-xs font-medium mb-1 ${textSecondaryClass}`}
              >
                Gastos
              </span>
              <p className={`text-xl md:text-2xl font-bold ${textClass}`}>
                {filteredExpenses.length}
              </p>
            </div>
          </div>

          <div className={`${cardClass} rounded-2xl p-4 border shadow-lg`}>
            <div className="flex flex-col items-center text-center">
              <Clock className={`w-5 h-5 mb-2 ${textSecondaryClass}`} />
              <span
                className={`text-xs font-medium mb-1 ${textSecondaryClass}`}
              >
                Promedio
              </span>
              <p className={`text-xl md:text-2xl font-bold ${textClass}`}>
                €
                {filteredExpenses.length > 0
                  ? (totalExpenses / new Date().getDate()).toFixed(2)
                  : "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Controles - Compactos */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Añadir Gasto</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-white hover:bg-gray-50"
            } border ${
              darkMode ? "border-gray-600" : "border-purple-200"
            } ${textClass} font-semibold transition-all active:scale-95`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Panel de Filtros */}
        {showFilters && (
          <div className={`${cardClass} rounded-2xl p-4 border shadow-lg mb-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-xs font-medium ${textClass} mb-1`}
                >
                  Mes
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${inputClass} text-sm focus:ring-2 focus:border-transparent`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-medium ${textClass} mb-1`}
                >
                  Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${inputClass} text-sm focus:ring-2 focus:border-transparent`}
                >
                  <option value="all">Todas</option>
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tabs de Vista - Solo iconos en móvil, con texto en desktop */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveView("table")}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              activeView === "table"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-white text-purple-600 hover:bg-purple-50"
            }`}
          >
            <TableIcon className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Tabla</span>
          </button>

          <button
            onClick={() => setActiveView("chart")}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              activeView === "chart"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-white text-purple-600 hover:bg-purple-50"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Gráfica</span>
          </button>

          <button
            onClick={() => setActiveView("recent")}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              activeView === "recent"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-white text-purple-600 hover:bg-purple-50"
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Recientes</span>
          </button>

          <button
            onClick={() => setActiveView("budgets")}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              activeView === "budgets"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-white text-purple-600 hover:bg-purple-50"
            }`}
          >
            <Target className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Presupuestos</span>
          </button>
        </div>

        {/* Vista de Tabla */}
        {activeView === "table" && (
          <div
            className={`${cardClass} rounded-2xl border shadow-lg overflow-hidden`}
          >
            {Object.keys(expensesByCategory).length === 0 ? (
              <div className="p-12 text-center">
                <AlertTriangle
                  className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
                />
                <p className={`text-xl font-semibold ${textClass} mb-2`}>
                  No hay gastos
                </p>
                <p className={textSecondaryClass}>
                  Añade tu primer gasto para comenzar
                </p>
              </div>
            ) : (
              <div className="divide-y divide-purple-100">
                {Object.entries(expensesByCategory).map(
                  ([category, subcategories]) => {
                    const categoryTotal = Object.values(subcategories)
                      .flat()
                      .reduce((sum, exp) => sum + exp.amount, 0);
                    const isExpanded = expandedCategories[category];

                    return (
                      <div key={category}>
                        <button
                          onClick={() => toggleCategory(category)}
                          className={`w-full ${
                            darkMode
                              ? "bg-gray-700/50 hover:bg-gray-700"
                              : "bg-purple-100/80 hover:bg-purple-100"
                          } px-6 py-4 flex justify-between items-center transition-all`}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronUp
                                className={`w-5 h-5 ${textSecondaryClass}`}
                              />
                            ) : (
                              <ChevronDown
                                className={`w-5 h-5 ${textSecondaryClass}`}
                              />
                            )}
                            <span className={`text-lg font-bold ${textClass}`}>
                              {category}
                            </span>
                          </div>
                          <span className={`text-xl font-bold ${textClass}`}>
                            €{categoryTotal.toFixed(2)}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="divide-y divide-purple-50">
                            {Object.entries(subcategories).map(
                              ([subcategory, exps]) => {
                                const subtotal = exps.reduce(
                                  (sum, exp) => sum + exp.amount,
                                  0
                                );

                                return (
                                  <div
                                    key={subcategory}
                                    className="border-b border-purple-100 last:border-b-0"
                                  >
                                    <div
                                      className={`${
                                        darkMode
                                          ? "bg-gray-700/30"
                                          : "bg-purple-50/50"
                                      } px-4 py-2 flex justify-between items-center`}
                                    >
                                      <span
                                        className={`font-medium ${
                                          darkMode
                                            ? "text-purple-300"
                                            : "text-purple-800"
                                        }`}
                                      >
                                        {subcategory}
                                      </span>
                                      <span
                                        className={`text-sm font-semibold ${
                                          darkMode
                                            ? "text-purple-400"
                                            : "text-purple-700"
                                        }`}
                                      >
                                        €{subtotal.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="divide-y divide-purple-100">
                                      {exps.map((expense) => (
                                        <div
                                          key={expense.id}
                                          className={`px-4 py-3 ${
                                            darkMode
                                              ? "hover:bg-gray-700/30"
                                              : "hover:bg-white/30"
                                          } transition-all flex justify-between items-center`}
                                        >
                                          <div className="flex-1">
                                            <p
                                              className={`text-sm font-semibold ${textClass} mb-1`}
                                            >
                                              {expense.name ||
                                                "Gasto sin nombre"}
                                            </p>
                                            <div className="flex items-center gap-2 mb-1">
                                              <span
                                                className={`text-sm ${textSecondaryClass}`}
                                              >
                                                {new Date(
                                                  expense.date
                                                ).toLocaleDateString("es-ES")}
                                              </span>
                                              <span
                                                className={`text-xs ${
                                                  darkMode
                                                    ? "bg-gray-700"
                                                    : "bg-white/60"
                                                } px-2 py-1 rounded-full ${textSecondaryClass}`}
                                              >
                                                {expense.paymentMethod}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span
                                              className={`font-bold ${textClass}`}
                                            >
                                              €{expense.amount.toFixed(2)}
                                            </span>
                                            <button
                                              onClick={() =>
                                                handleEditExpense(expense)
                                              }
                                              className={`p-2 rounded-lg ${
                                                darkMode
                                                  ? "hover:bg-purple-900/50"
                                                  : "hover:bg-purple-100"
                                              } transition-all`}
                                            >
                                              <Pencil
                                                className={`w-4 h-4 ${
                                                  darkMode
                                                    ? "text-purple-400"
                                                    : "text-purple-600"
                                                }`}
                                              />
                                            </button>
                                            <button
                                              onClick={() =>
                                                setShowDeleteConfirm({
                                                  type: "expense",
                                                  id: expense.id,
                                                })
                                              }
                                              className={`p-2 rounded-lg ${
                                                darkMode
                                                  ? "hover:bg-red-900/50"
                                                  : "hover:bg-red-100"
                                              } transition-all`}
                                            >
                                              <Trash2 className="w-4 h-4 text-red-600" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        {/* Vista de Gráfica */}
        {activeView === "chart" && (
          <div className={`${cardClass} rounded-2xl p-6 border shadow-lg`}>
            <h3 className={`text-xl font-bold ${textClass} mb-6`}>
              Distribución por Categoría
            </h3>

            {categoryTotals.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle
                  className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
                />
                <p className={textSecondaryClass}>
                  No hay gastos en este período
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Gráfica Circular */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-64 h-64">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {(() => {
                        let currentAngle = 0;
                        const colors = [
                          "text-purple-500",
                          "text-blue-500",
                          "text-pink-500",
                          "text-indigo-500",
                          "text-violet-500",
                          "text-fuchsia-500",
                        ];

                        return categoryTotals
                          .sort((a, b) => b.total - a.total)
                          .map((item, index) => {
                            const percentage =
                              (item.total / totalExpenses) * 100;
                            const angle = (percentage / 100) * 360;
                            const startAngle = currentAngle;
                            currentAngle += angle;

                            const startX =
                              50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                            const startY =
                              50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                            const endX =
                              50 +
                              40 * Math.cos((currentAngle * Math.PI) / 180);
                            const endY =
                              50 +
                              40 * Math.sin((currentAngle * Math.PI) / 180);
                            const largeArc = angle > 180 ? 1 : 0;

                            return (
                              <path
                                key={item.category}
                                d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                                className={`fill-current ${
                                  colors[index % colors.length]
                                } opacity-90 hover:opacity-100 transition-all cursor-pointer`}
                                strokeWidth="0.5"
                                stroke="white"
                              />
                            );
                          });
                      })()}

                      {/* Círculo blanco interior para el centro */}
                      <circle
                        cx="50"
                        cy="50"
                        r="20"
                        fill="white"
                        className="transform rotate-90"
                      />
                    </svg>

                    {/* Centro de la gráfica - Mejorado */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`text-center ${
                          darkMode ? "text-gray-900" : "text-purple-900"
                        }`}
                      >
                        <p className="text-xs font-medium mb-0.5">Total</p>
                        <p className="text-2xl font-bold">
                          €{totalExpenses.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categorías Expandibles con barras de detalle */}
                <div className="space-y-3">
                  {Object.entries(expensesByCategory)
                    .sort(([, subsA], [, subsB]) => {
                      const totalA = Object.values(subsA)
                        .flat()
                        .reduce((sum, exp) => sum + exp.amount, 0);
                      const totalB = Object.values(subsB)
                        .flat()
                        .reduce((sum, exp) => sum + exp.amount, 0);
                      return totalB - totalA;
                    })
                    .map(([category, subcategories], index) => {
                      const categoryTotal = Object.values(subcategories)
                        .flat()
                        .reduce((sum, exp) => sum + exp.amount, 0);
                      const percentage = (categoryTotal / totalExpenses) * 100;
                      const isExpanded = expandedCategories[category];

                      const colors = [
                        "from-purple-500 to-purple-600",
                        "from-blue-500 to-blue-600",
                        "from-pink-500 to-pink-600",
                        "from-indigo-500 to-indigo-600",
                        "from-violet-500 to-violet-600",
                        "from-fuchsia-500 to-fuchsia-600",
                      ];

                      const dotColors = [
                        "bg-purple-500",
                        "bg-blue-500",
                        "bg-pink-500",
                        "bg-indigo-500",
                        "bg-violet-500",
                        "bg-fuchsia-500",
                      ];

                      return (
                        <div
                          key={category}
                          className={`${
                            darkMode ? "bg-gray-700/30" : "bg-white/50"
                          } rounded-xl overflow-hidden`}
                        >
                          {/* Header de categoría - Clickeable */}
                          <button
                            onClick={() => toggleCategory(category)}
                            className={`w-full px-4 py-3 flex justify-between items-center ${
                              darkMode
                                ? "hover:bg-gray-700/50"
                                : "hover:bg-purple-50/50"
                            } transition-all`}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronUp
                                  className={`w-5 h-5 ${
                                    darkMode
                                      ? "text-purple-400"
                                      : "text-purple-600"
                                  }`}
                                />
                              ) : (
                                <ChevronDown
                                  className={`w-5 h-5 ${
                                    darkMode
                                      ? "text-purple-400"
                                      : "text-purple-600"
                                  }`}
                                />
                              )}
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  dotColors[index % dotColors.length]
                                }`}
                              ></div>
                              <span className={`font-semibold ${textClass}`}>
                                {category}
                              </span>
                            </div>
                            <span className={`font-bold ${textClass}`}>
                              €{categoryTotal.toFixed(2)} (
                              {percentage.toFixed(1)}%)
                            </span>
                          </button>

                          {/* Barra de progreso de categoría */}
                          <div className="px-4 pb-2">
                            <div
                              className={`w-full ${
                                darkMode ? "bg-gray-700" : "bg-purple-100"
                              } rounded-full h-2 overflow-hidden`}
                            >
                              <div
                                className={`h-full bg-gradient-to-r ${
                                  colors[index % colors.length]
                                } transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Subcategorías - Expandibles */}
                          {isExpanded && (
                            <div className="px-4 pb-3 space-y-2">
                              {Object.entries(subcategories).map(
                                ([subcategory, exps]) => {
                                  const subtotal = exps.reduce(
                                    (sum, exp) => sum + exp.amount,
                                    0
                                  );
                                  const subPercentage = (
                                    (subtotal / categoryTotal) *
                                    100
                                  ).toFixed(1);

                                  return (
                                    <div
                                      key={subcategory}
                                      className={`p-2 rounded-lg ${
                                        darkMode
                                          ? "bg-gray-600/50"
                                          : "bg-white/50"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span
                                          className={`text-sm font-medium ${textClass}`}
                                        >
                                          {subcategory}
                                        </span>
                                        <span
                                          className={`text-xs font-semibold ${textSecondaryClass}`}
                                        >
                                          €{subtotal.toFixed(2)} (
                                          {subPercentage}%)
                                        </span>
                                      </div>
                                      <div
                                        className={`w-full ${
                                          darkMode
                                            ? "bg-gray-700"
                                            : "bg-purple-100"
                                        } rounded-full h-1.5 overflow-hidden`}
                                      >
                                        <div
                                          className={`h-full bg-gradient-to-r ${
                                            colors[index % colors.length]
                                          } opacity-70`}
                                          style={{ width: `${subPercentage}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vista de Presupuestos */}
        {activeView === "budgets" && (
          <div className="space-y-4">
            {Object.keys(budgets).length === 0 ? (
              <div
                className={`${cardClass} rounded-2xl p-12 border shadow-lg text-center`}
              >
                <Target
                  className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
                />
                <p className={`text-xl font-semibold ${textClass} mb-2`}>
                  No hay presupuestos
                </p>
                <p className={textSecondaryClass}>
                  Crea un presupuesto para controlar tus gastos
                </p>
              </div>
            ) : (
              Object.entries(budgets).map(([category, budget]) => {
                const spent =
                  categoryTotals.find((ct) => ct.category === category)
                    ?.total || 0;
                const percentage = (spent / budget) * 100;
                const isOverBudget = spent > budget;

                return (
                  <div
                    key={category}
                    className={`${cardClass} rounded-2xl p-6 border shadow-lg ${
                      isOverBudget ? "border-red-300" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className={`text-lg font-bold ${textClass}`}>
                          {category}
                        </h4>
                        <p className={`text-sm ${textSecondaryClass}`}>
                          Presupuesto: €{budget.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setShowDeleteConfirm({
                            type: "budget",
                            category,
                          })
                        }
                        className={`p-2 rounded-lg ${
                          darkMode ? "hover:bg-red-900/50" : "hover:bg-red-100"
                        } transition-all`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${textClass}`}>
                          Gastado: €{spent.toFixed(2)}
                        </span>
                        <span
                          className={`font-bold ${
                            isOverBudget ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div
                        className={`w-full ${
                          darkMode ? "bg-gray-700" : "bg-gray-200"
                        } rounded-full h-3 overflow-hidden`}
                      >
                        <div
                          className={`h-full transition-all duration-500 ${
                            isOverBudget
                              ? "bg-gradient-to-r from-red-500 to-red-600"
                              : "bg-gradient-to-r from-green-500 to-green-600"
                          }`}
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        ></div>
                      </div>
                      {isOverBudget && (
                        <p className="text-sm text-red-600 font-medium flex items-center gap-2 mt-2">
                          <AlertTriangle className="w-4 h-4" />
                          ¡Presupuesto superado en €
                          {(spent - budget).toFixed(2)}!
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Vista de Recientes */}
        {activeView === "recent" && (
          <div
            className={`${cardClass} rounded-2xl p-4 sm:p-6 border shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg sm:text-xl font-bold ${textClass}`}>
                Últimos Gastos Añadidos
              </h3>
              <span className={`text-sm ${textSecondaryClass}`}>
                ({recentExpenses.length})
              </span>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="text-center py-12">
                <Clock
                  className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
                />
                <p className={`text-xl font-semibold ${textClass} mb-2`}>
                  No hay gastos todavía
                </p>
                <p className={textSecondaryClass}>
                  Añade tu primer gasto para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className={`p-3 sm:p-4 rounded-xl ${
                      darkMode ? "bg-gray-700" : "bg-white"
                    } border ${
                      darkMode ? "border-gray-600" : "border-purple-100"
                    } hover:shadow-md transition-all`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${textClass} truncate`}>
                          {expense.name}
                        </p>
                        <p
                          className={`text-xs sm:text-sm ${textSecondaryClass} truncate`}
                        >
                          {expense.category} • {expense.subcategory}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`font-bold ${textClass} text-sm sm:text-base`}
                        >
                          €{expense.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className={`p-1.5 sm:p-2 rounded-lg ${
                            darkMode
                              ? "hover:bg-purple-900/50"
                              : "hover:bg-purple-100"
                          } transition-all`}
                        >
                          <Pencil
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              darkMode ? "text-purple-400" : "text-purple-600"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() =>
                            setShowDeleteConfirm({
                              type: "expense",
                              id: expense.id,
                            })
                          }
                          className={`p-1.5 sm:p-2 rounded-lg ${
                            darkMode
                              ? "hover:bg-red-900/50"
                              : "hover:bg-red-100"
                          } transition-all`}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className={textSecondaryClass}>
                        {new Date(expense.date).toLocaleDateString("es-ES")}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          darkMode ? "bg-gray-600" : "bg-purple-100"
                        } ${textSecondaryClass}`}
                      >
                        {expense.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Añadir Gasto */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${cardClass} rounded-2xl p-6 max-w-md w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-bold ${textClass}`}>
                Añadir Gasto
              </h3>
              <button
                onClick={() => setShowAddExpense(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                } transition-all`}
              >
                <X className={`w-6 h-6 ${textClass}`} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Nombre del gasto
                </label>
                <input
                  type="text"
                  value={newExpense.name}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, name: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                  placeholder="Ej: Compra supermercado"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Cantidad
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Categoría
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      category: e.target.value,
                      subcategory: "",
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {newExpense.category && (
                <div>
                  <label
                    className={`block text-sm font-medium ${textClass} mb-2`}
                  >
                    Subcategoría
                  </label>
                  <select
                    value={newExpense.subcategory}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        subcategory: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                    required
                  >
                    <option value="">Selecciona una subcategoría</option>
                    {categories[newExpense.category]?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Fecha
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Método de pago
                </label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      paymentMethod: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                >
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Bizum">Bizum</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Añadir Gasto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Gasto */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${cardClass} rounded-2xl p-6 max-w-md w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-bold ${textClass}`}>
                Editar Gasto
              </h3>
              <button
                onClick={() => setEditingExpense(null)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                } transition-all`}
              >
                <X className={`w-6 h-6 ${textClass}`} />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Nombre del gasto
                </label>
                <input
                  type="text"
                  value={editingExpense.name}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      name: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Cantidad
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingExpense.amount}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      amount: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Categoría
                </label>
                <select
                  value={editingExpense.category}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      category: e.target.value,
                      subcategory: "",
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                >
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Subcategoría
                </label>
                <select
                  value={editingExpense.subcategory}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      subcategory: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                >
                  {categories[editingExpense.category]?.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Fecha
                </label>
                <input
                  type="date"
                  value={editingExpense.date}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      date: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Método de pago
                </label>
                <select
                  value={editingExpense.paymentMethod}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      paymentMethod: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                >
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Bizum">Bizum</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Panel Lateral Menú */}
      {showMenu && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          ></div>
          <div
            className={`absolute right-0 top-0 h-full w-80 ${
              darkMode ? "bg-gray-800" : "bg-white"
            } shadow-2xl p-6 overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className={`text-2xl font-bold ${textClass}`}>Menú</h3>
              <button
                onClick={() => setShowMenu(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                } transition-all`}
              >
                <X className={`w-6 h-6 ${textClass}`} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowSettings(true);
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-purple-50 hover:bg-purple-100"
                } transition-all`}
              >
                <SettingsIcon
                  className={`w-5 h-5 ${
                    darkMode ? "text-purple-400" : "text-purple-600"
                  }`}
                />
                <span className={`font-medium ${textClass}`}>Ajustes</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowCategories(true);
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-purple-50 hover:bg-purple-100"
                } transition-all`}
              >
                <Filter
                  className={`w-5 h-5 ${
                    darkMode ? "text-purple-400" : "text-purple-600"
                  }`}
                />
                <span className={`font-medium ${textClass}`}>
                  Gestionar Categorías
                </span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowBudgets(true);
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-purple-50 hover:bg-purple-100"
                } transition-all`}
              >
                <Target
                  className={`w-5 h-5 ${
                    darkMode ? "text-purple-400" : "text-purple-600"
                  }`}
                />
                <span className={`font-medium ${textClass}`}>
                  Gestionar Presupuestos
                </span>
              </button>

              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 p-4 rounded-xl ${
                  darkMode
                    ? "bg-red-900/50 hover:bg-red-900"
                    : "bg-red-50 hover:bg-red-100"
                } transition-all`}
              >
                <LogOut className="w-5 h-5 text-red-600" />
                <span
                  className={`font-medium ${
                    darkMode ? "text-red-400" : "text-red-600"
                  }`}
                >
                  Cerrar Sesión
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajustes */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${cardClass} rounded-2xl p-6 max-w-2xl w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-bold ${textClass}`}>Ajustes</h3>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                } transition-all`}
              >
                <X className={`w-6 h-6 ${textClass}`} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Toggle Modo Oscuro */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {darkMode ? (
                      <Moon
                        className={`w-5 h-5 ${
                          darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                      />
                    ) : (
                      <Sun
                        className={`w-5 h-5 ${
                          darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                      />
                    )}
                    <div>
                      <p className={`font-medium ${textClass}`}>
                        Modo {darkMode ? "Oscuro" : "Claro"}
                      </p>
                      <p className={`text-sm ${textSecondaryClass}`}>
                        Cambia el tema de la aplicación
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      darkMode ? "bg-purple-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        darkMode ? "translate-x-7" : ""
                      }`}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Gestionar Gastos Recurrentes */}
              <div>
                <h4 className={`text-lg font-bold ${textClass} mb-4`}>
                  Gastos Recurrentes
                </h4>

                {/* Formulario añadir recurrente */}
                <form onSubmit={handleAddRecurring} className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={newRecurring.name}
                    onChange={(e) =>
                      setNewRecurring({ ...newRecurring, name: e.target.value })
                    }
                    className={`w-full px-4 py-2 rounded-xl border ${inputClass} text-sm focus:ring-2 focus:border-transparent`}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cantidad"
                      value={newRecurring.amount}
                      onChange={(e) =>
                        setNewRecurring({
                          ...newRecurring,
                          amount: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 rounded-xl border ${inputClass} text-sm focus:ring-2 focus:border-transparent`}
                      required
                    />

                    <select
                      value={newRecurring.category}
                      onChange={(e) =>
                        setNewRecurring({
                          ...newRecurring,
                          category: e.target.value,
                          subcategory: "",
                        })
                      }
                      className={`w-full px-4 py-2 rounded-xl border ${inputClass} text-sm focus:ring-2 focus:border-transparent`}
                      required
                    >
                      <option value="">Categoría</option>
                      {Object.keys(categories).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {newRecurring.category && (
                    <select
                      value={newRecurring.subcategory}
                      onChange={(e) =>
                        setNewRecurring({
                          ...newRecurring,
                          subcategory: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 rounded-xl border ${inputClass} text-sm focus:ring-2 focus:border-transparent`}
                      required
                    >
                      <option value="">Subcategoría</option>
                      {categories[newRecurring.category]?.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Día del mes"
                      value={newRecurring.dayOfMonth}
                      onChange={(e) =>
                        setNewRecurring({
                          ...newRecurring,
                          dayOfMonth: parseInt(e.target.value),
                        })
                      }
                      className={`w-full px-4 py-2 rounded-xl border ${inputClass} text-sm focus:ring-2 focus:border-transparent`}
                      required
                    />

                    <select
                      value={newRecurring.paymentMethod}
                      onChange={(e) =>
                        setNewRecurring({
                          ...newRecurring,
                          paymentMethod: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 rounded-xl border ${inputClass} text-sm focus:ring-2 focus:border-transparent`}
                    >
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Bizum">Bizum</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all text-sm"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Añadir Recurrente
                  </button>
                </form>

                {/* Lista de recurrentes */}
                {recurringExpenses.length === 0 ? (
                  <p
                    className={`text-center ${textSecondaryClass} py-4 text-sm`}
                  >
                    No hay gastos recurrentes
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recurringExpenses.map((recurring) => (
                      <div
                        key={recurring.id}
                        className={`p-3 rounded-xl ${
                          darkMode ? "bg-gray-700" : "bg-white"
                        } border ${
                          darkMode ? "border-gray-600" : "border-purple-100"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className={`font-semibold text-sm ${textClass}`}>
                              {recurring.name}
                            </p>
                            <p className={`text-xs ${textSecondaryClass}`}>
                              {recurring.category} • {recurring.subcategory}
                            </p>
                            <p className={`text-xs ${textSecondaryClass} mt-1`}>
                              Día {recurring.dayOfMonth} •{" "}
                              {recurring.paymentMethod}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${textClass}`}>
                              €{recurring.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateRecurring(recurring.id, {
                                  active: !recurring.active,
                                })
                              }
                              className={`p-1 rounded ${
                                recurring.active
                                  ? darkMode
                                    ? "bg-green-900/50"
                                    : "bg-green-100"
                                  : darkMode
                                  ? "bg-gray-600"
                                  : "bg-gray-200"
                              }`}
                            >
                              <Check
                                className={`w-4 h-4 ${
                                  recurring.active
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                              />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteRecurring(recurring.id)
                              }
                              className={`p-1 rounded ${
                                darkMode
                                  ? "hover:bg-red-900/50"
                                  : "hover:bg-red-100"
                              }`}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestionar Categorías */}
      {showCategories && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${cardClass} rounded-2xl p-6 max-w-2xl w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-bold ${textClass}`}>
                Gestionar Categorías
              </h3>
              <button
                onClick={() => setShowCategories(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                } transition-all`}
              >
                <X className={`w-6 h-6 ${textClass}`} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Añadir Categoría */}
              <form onSubmit={handleAddCategory} className="space-y-3">
                <label className={`block text-sm font-medium ${textClass}`}>
                  Nueva Categoría
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={`flex-1 px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                    placeholder="Ej: Salud"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Añadir Subcategoría */}
              <form onSubmit={handleAddSubcategory} className="space-y-3">
                <label className={`block text-sm font-medium ${textClass}`}>
                  Nueva Subcategoría
                </label>
                <select
                  value={selectedCategoryForSub}
                  onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                >
                  <option value="">Selecciona una categoría</option>
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {selectedCategoryForSub && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      className={`flex-1 px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                      placeholder="Ej: Farmacia"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </form>

              {/* Lista de Categorías */}
              <div className="space-y-3">
                <h4 className={`font-semibold ${textClass}`}>
                  Categorías Existentes
                </h4>
                {Object.entries(categories).map(([category, subcategories]) => (
                  <div
                    key={category}
                    className={`p-4 rounded-xl ${
                      darkMode ? "bg-gray-700" : "bg-purple-50"
                    } border ${
                      darkMode ? "border-gray-600" : "border-purple-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className={`font-bold ${textClass}`}>{category}</h5>
                      <button
                        onClick={() =>
                          setShowDeleteConfirm({
                            type: "category",
                            category,
                          })
                        }
                        className={`p-2 rounded-lg ${
                          darkMode ? "hover:bg-red-900/50" : "hover:bg-red-100"
                        } transition-all`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {subcategories.map((sub) => (
                        <div
                          key={sub}
                          className={`flex justify-between items-center p-2 rounded-lg ${
                            darkMode ? "bg-gray-600" : "bg-white"
                          }`}
                        >
                          <span className={`text-sm ${textClass}`}>{sub}</span>
                          <button
                            onClick={() =>
                              setShowDeleteConfirm({
                                type: "subcategory",
                                category,
                                subcategory: sub,
                              })
                            }
                            className={`p-1 rounded ${
                              darkMode
                                ? "hover:bg-red-900/50"
                                : "hover:bg-red-100"
                            } transition-all`}
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestionar Presupuestos */}
      {showBudgets && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${cardClass} rounded-2xl p-6 max-w-md w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-bold ${textClass}`}>
                Gestionar Presupuestos
              </h3>
              <button
                onClick={() => setShowBudgets(false)}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                } transition-all`}
              >
                <X className={`w-6 h-6 ${textClass}`} />
              </button>
            </div>

            <form onSubmit={handleAddBudget} className="space-y-4 mb-6">
              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Categoría
                </label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {Object.keys(categories)
                    .filter((cat) => !budgets[cat])
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  Presupuesto Mensual
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                  placeholder="0.00"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Crear Presupuesto
              </button>
            </form>

            {/* Lista de Presupuestos */}
            <div className="space-y-3">
              <h4 className={`font-semibold ${textClass}`}>
                Presupuestos Activos
              </h4>
              {Object.entries(budgets).map(([category, budget]) => {
                const spent =
                  categoryTotals.find((ct) => ct.category === category)
                    ?.total || 0;
                const percentage = (spent / budget) * 100;

                return (
                  <div
                    key={category}
                    className={`p-4 rounded-xl ${
                      darkMode ? "bg-gray-700" : "bg-purple-50"
                    } border ${
                      darkMode ? "border-gray-600" : "border-purple-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`font-bold ${textClass}`}>{category}</p>
                        <p className={`text-sm ${textSecondaryClass}`}>
                          €{spent.toFixed(2)} / €{budget.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setShowDeleteConfirm({
                            type: "budget",
                            category,
                          })
                        }
                        className={`p-2 rounded-lg ${
                          darkMode ? "hover:bg-red-900/50" : "hover:bg-red-100"
                        } transition-all`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                    <div
                      className={`w-full ${
                        darkMode ? "bg-gray-600" : "bg-white"
                      } rounded-full h-2`}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentage > 100
                            ? "bg-red-600"
                            : "bg-gradient-to-r from-purple-600 to-blue-600"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div
            className={`${cardClass} rounded-2xl p-6 max-w-sm w-full border shadow-2xl`}
          >
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h3 className={`text-xl font-bold ${textClass} mb-2`}>
                ¿Estás seguro?
              </h3>
              <p className={`${textSecondaryClass} mb-6`}>
                Esta acción no se puede deshacer
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className={`flex-1 py-3 rounded-xl ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  } font-semibold transition-all`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === "expense") {
                      handleDeleteExpense(showDeleteConfirm.id);
                    } else if (showDeleteConfirm.type === "category") {
                      handleDeleteCategory(showDeleteConfirm.category);
                    } else if (showDeleteConfirm.type === "subcategory") {
                      handleDeleteSubcategory(
                        showDeleteConfirm.category,
                        showDeleteConfirm.subcategory
                      );
                    } else if (showDeleteConfirm.type === "budget") {
                      handleDeleteBudget(showDeleteConfirm.category);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClarityExpenseApp;
