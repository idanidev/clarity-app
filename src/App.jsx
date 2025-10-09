import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  Check,
  Download,
  Filter,
  LogOut,
  Menu as MenuIcon,
  Pencil,
  Plus,
  Settings,
  Table as TableIcon,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import { auth } from "./firebase";
import {
  addExpense as addExpenseDB,
  deleteExpense as deleteExpenseDB,
  getUserBudgets,
  getUserCategories,
  initializeUser,
  saveBudgets,
  saveCategories,
  subscribeToExpenses,
  updateExpense as updateExpenseDB,
} from "./services/firestoreService";

const ClarityExpenseApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [notification, setNotification] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [budgets, setBudgets] = useState({});

  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    category: "",
    subcategory: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Tarjeta",
    recurring: false,
  });

  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await initializeUser(currentUser.uid, {
          email: currentUser.email,
          displayName: currentUser.displayName,
        });

        const userCategories = await getUserCategories(currentUser.uid);
        if (userCategories) {
          setCategories(userCategories);
        }

        const userBudgets = await getUserBudgets(currentUser.uid);
        if (userBudgets) {
          setBudgets(userBudgets);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToExpenses(user.uid, (fetchedExpenses) => {
      setExpenses(fetchedExpenses);
    });

    return () => unsubscribe();
  }, [user]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesMonth = exp.date.startsWith(selectedMonth);
    const matchesCategory =
      filterCategory === "Todas" || exp.category === filterCategory;
    return matchesMonth && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const categoryTotals = filteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const groupedExpenses = filteredExpenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = {};
    }
    if (!acc[exp.category][exp.subcategory]) {
      acc[exp.category][exp.subcategory] = [];
    }
    acc[exp.category][exp.subcategory].push(exp);
    return acc;
  }, {});

  const configuredBudgets = Object.entries(budgets)
    .map(([category, budget]) => [category, Number(budget) || 0])
    .filter(([, budget]) => budget > 0);

  const overBudgetCategories = configuredBudgets.filter(
    ([category, budget]) => (categoryTotals[category] || 0) > budget
  );

  const handleAddExpense = async () => {
    const trimmedName = newExpense.name.trim();
    if (
      !trimmedName ||
      !newExpense.amount ||
      !newExpense.category ||
      !newExpense.subcategory
    ) {
      showNotification("Por favor completa todos los campos", "warning");
      return;
    }

    try {
      const expenseData = {
        ...newExpense,
        name: trimmedName,
        amount: parseFloat(newExpense.amount),
      };

      await addExpenseDB(user.uid, expenseData);

      const budget = budgets[expenseData.category];
      const spent = categoryTotals[expenseData.category] || 0;
      const newSpent = spent + expenseData.amount;

      if (budget && newSpent > budget * 0.9) {
        showNotification(
          `¡Alerta! Has gastado ${((newSpent / budget) * 100).toFixed(
            0
          )}% del presupuesto de ${expenseData.category}`,
          "warning"
        );
      } else {
        showNotification("Gasto añadido correctamente", "success");
      }

      setNewExpense({
        name: "",
        amount: "",
        category: "",
        subcategory: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "Tarjeta",
        recurring: false,
      });
      setShowAddExpense(false);
    } catch (error) {
      showNotification("Error al añadir gasto", "warning");
      console.error(error);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpenseDB(user.uid, id);
      showNotification("Gasto eliminado", "success");
      setShowDeleteConfirm(null);
    } catch (error) {
      showNotification("Error al eliminar gasto", "warning");
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setNewExpense({
      name: expense.name || "",
      amount:
        typeof expense.amount === "number"
          ? expense.amount.toString()
          : expense.amount || "",
      category: expense.category || "",
      subcategory: expense.subcategory || "",
      date: expense.date || new Date().toISOString().split("T")[0],
      paymentMethod: expense.paymentMethod || "Tarjeta",
      recurring: Boolean(expense.recurring),
    });
    setShowAddExpense(true);
  };

  const handleUpdateExpense = async () => {
    const trimmedName = newExpense.name.trim();
    if (
      !trimmedName ||
      !newExpense.amount ||
      !newExpense.category ||
      !newExpense.subcategory
    ) {
      showNotification("Por favor completa todos los campos", "warning");
      return;
    }

    try {
      await updateExpenseDB(user.uid, editingExpense.id, {
        ...newExpense,
        name: trimmedName,
        amount: parseFloat(newExpense.amount),
      });
      showNotification("Gasto actualizado", "success");
      setEditingExpense(null);
      setNewExpense({
        name: "",
        amount: "",
        category: "",
        subcategory: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "Tarjeta",
        recurring: false,
      });
      setShowAddExpense(false);
    } catch (error) {
      showNotification("Error al actualizar gasto", "warning");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (categories[newCategory]) {
      showNotification("La categoría ya existe", "warning");
      return;
    }

    const newCategories = { ...categories, [newCategory]: [] };
    setCategories(newCategories);
    await saveCategories(user.uid, newCategories);
    showNotification("Categoría añadida", "success");
    setNewCategory("");
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategory.trim() || !selectedCategoryForSub) return;
    if (categories[selectedCategoryForSub].includes(newSubcategory)) {
      showNotification("La subcategoría ya existe", "warning");
      return;
    }

    const newCategories = {
      ...categories,
      [selectedCategoryForSub]: [
        ...categories[selectedCategoryForSub],
        newSubcategory,
      ],
    };
    setCategories(newCategories);
    await saveCategories(user.uid, newCategories);
    showNotification("Subcategoría añadida", "success");
    setNewSubcategory("");
  };

  const handleDeleteCategory = async (category) => {
    const expensesToDelete = expenses.filter(
      (exp) => exp.category === category
    );
    for (const expense of expensesToDelete) {
      await deleteExpenseDB(user.uid, expense.id);
    }

    const updatedCategories = { ...categories };
    delete updatedCategories[category];
    setCategories(updatedCategories);
    await saveCategories(user.uid, updatedCategories);

    const updatedBudgets = { ...budgets };
    delete updatedBudgets[category];
    setBudgets(updatedBudgets);
    await saveBudgets(user.uid, updatedBudgets);

    showNotification("Categoría eliminada", "success");
    setShowDeleteConfirm(null);
  };

  const handleDeleteSubcategory = async (category, subcategory) => {
    const expensesToDelete = expenses.filter(
      (exp) => exp.category === category && exp.subcategory === subcategory
    );
    for (const expense of expensesToDelete) {
      await deleteExpenseDB(user.uid, expense.id);
    }

    const newCategories = {
      ...categories,
      [category]: categories[category].filter((sub) => sub !== subcategory),
    };
    setCategories(newCategories);
    await saveCategories(user.uid, newCategories);
    showNotification("Subcategoría eliminada", "success");
    setShowDeleteConfirm(null);
  };

  const handleSaveBudgets = async () => {
    const sanitizedBudgets = Object.entries(budgets).reduce(
      (acc, [category, value]) => {
        if (value === "" || value === undefined || value === null) {
          return acc;
        }

        const numericValue = Number(value);

        if (!Number.isNaN(numericValue) && numericValue >= 0) {
          acc[category] = numericValue;
        }

        return acc;
      },
      {}
    );

    await saveBudgets(user.uid, sanitizedBudgets);
    setBudgets(sanitizedBudgets);
    showNotification("Presupuestos guardados", "success");
    setShowBudgets(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification("Sesión cerrada", "success");
    } catch (error) {
      showNotification("Error al cerrar sesión", "warning");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Nombre",
      "Fecha",
      "Categoría",
      "Subcategoría",
      "Precio",
      "Método de Pago",
      "Recurrente",
    ];
    const rows = filteredExpenses.map((exp) => [
      exp.name || "",
      exp.date,
      exp.category,
      exp.subcategory,
      exp.amount,
      exp.paymentMethod,
      exp.recurring ? "Sí" : "No",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gastos_${selectedMonth}.csv`;
    a.click();
    showNotification("CSV exportado correctamente", "success");
  };

  const getChartData = () => {
    const total = Object.values(categoryTotals).reduce(
      (sum, val) => sum + val,
      0
    );
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / total) * 100).toFixed(1),
    }));
  };

  const colors = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-teal-500 to-green-500",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/40 border-b border-white/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Clarity
            </h1>
            <p className="text-xs text-purple-600">{user.email}</p>
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
              className="p-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/60 transition-all"
            >
              <MenuIcon className="w-6 h-6 text-purple-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[120] px-6 py-3 rounded-2xl backdrop-blur-xl border ${
            notification.type === "success"
              ? "bg-green-500/90 border-green-400"
              : "bg-orange-500/90 border-orange-400"
          } text-white font-medium shadow-lg animate-bounce pointer-events-none`}
        >
          <div className="flex items-center gap-2 pointer-events-auto">
            {notification.type === "success" ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Card */}
        <div className="relative z-30 backdrop-blur-xl bg-white/40 border border-white/60 rounded-3xl p-6 mb-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-purple-600 font-medium mb-1">
                Total del mes
              </p>
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                €{totalExpenses.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => setShowAddExpense(true)}
              className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>

          {/* Filtros inline */}
          <div className="relative z-30 flex gap-3 flex-wrap items-center">
            {/* Filtro solo icono */}
            <div className="relative inline-flex items-center justify-center w-7 h-7 rounded-lg border border-purple-200 bg-white/80 shadow-sm">
              <Filter className="w-4 h-4 text-purple-600 pointer-events-none" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="Filtrar por categoría"
                title="Filtrar por categoría"
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                <option value="Todas">Todas</option>
                {Object.keys(categories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Mes: misma altura/estilo que el icono */}
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="
        w-full h-7 px-2 rounded-lg border border-purple-200 bg-white/80
        text-sm leading-none outline-none
        focus:border-purple-500 focus:ring-2 focus:ring-purple-200
        [&::-webkit-datetime-edit]:p-0
        [&::-webkit-datetime-edit]:leading-none
        [&::-webkit-calendar-picker-indicator]:opacity-60
      "
              />
            </div>

            {/* Botón vista: misma altura/estilo */}
            <button
              onClick={() =>
                setViewMode(viewMode === "chart" ? "table" : "chart")
              }
              className="
      inline-flex items-center gap-2 h-7 px-2
      rounded-lg border border-purple-200 bg-white/80
      hover:bg-white transition-all
    "
            >
              {viewMode === "chart" ? (
                <>
                  <TableIcon className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-900">Tabla</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-900">Gráfica</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* View Content */}
        {viewMode === "chart" ? (
          <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-3xl p-6 shadow-xl">
            {Object.entries(categoryTotals).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-purple-600">No hay gastos en este período</p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-purple-900 mb-4">
                  Distribución de gastos
                </h2>

                {/* Gráfica Circular */}
                <div className="flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {(() => {
                        let currentAngle = 0;
                        return getChartData().map((item, index) => {
                          const angle = (item.amount / totalExpenses) * 360;
                          const startAngle = currentAngle;
                          currentAngle += angle;

                          const startX =
                            50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                          const startY =
                            50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                          const endX =
                            50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                          const endY =
                            50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                          const largeArc = angle > 180 ? 1 : 0;

                          return (
                            <path
                              key={item.category}
                              d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                              className={`fill-current ${
                                index % 2 === 0
                                  ? "text-purple-500"
                                  : "text-pink-500"
                              }`}
                              opacity={0.8 - index * 0.1}
                            />
                          );
                        });
                      })()}
                      <circle cx="50" cy="50" r="20" className="fill-white" />
                    </svg>
                  </div>
                </div>

                {/* Leyenda */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getChartData().map((item, index) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between bg-white/60 rounded-xl p-3 border border-purple-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full bg-gradient-to-r ${
                            colors[index % colors.length]
                          }`}
                        ></div>
                        <span className="font-medium text-purple-900">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-900">
                          €{item.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-purple-600">
                          {item.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedExpenses).length === 0 ? (
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-8 text-center">
                <p className="text-purple-600">No hay gastos en este período</p>
              </div>
            ) : (
              Object.entries(groupedExpenses).map(
                ([category, subcategories]) => {
                  const categoryTotal = Object.values(subcategories)
                    .flat()
                    .reduce((sum, exp) => sum + exp.amount, 0);

                  return (
                    <div
                      key={category}
                      className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl shadow-lg overflow-hidden"
                    >
                      {/* Category Header */}
                      <div className="p-4 bg-purple-50/50 border-b border-purple-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-purple-900 text-lg">
                              {category}
                            </span>
                            <span className="text-sm text-purple-600">
                              ({Object.values(subcategories).flat().length}{" "}
                              gastos)
                            </span>
                          </div>
                          <span className="text-xl font-bold text-purple-900">
                            €{categoryTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Subcategories - Siempre visibles */}
                      <div>
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
                                <div className="bg-purple-50/50 px-4 py-2 flex justify-between items-center">
                                  <span className="font-medium text-purple-800">
                                    {subcategory}
                                  </span>
                                  <span className="text-sm font-semibold text-purple-700">
                                    €{subtotal.toFixed(2)}
                                  </span>
                                </div>
                                <div className="divide-y divide-purple-100">
                                  {exps.map((expense) => (
                                    <div
                                      key={expense.id}
                                      className="px-4 py-3 hover:bg-white/30 transition-all flex justify-between items-center"
                                    >
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-purple-900 mb-1">
                                          {expense.name || "Gasto sin nombre"}
                                        </p>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm text-purple-600">
                                            {new Date(
                                              expense.date
                                            ).toLocaleDateString("es-ES")}
                                          </span>
                                          <span className="text-xs bg-white/60 px-2 py-1 rounded-full text-purple-600">
                                            {expense.paymentMethod}
                                          </span>
                                          {expense.recurring && (
                                            <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                                              Recurrente
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-purple-900">
                                          €{expense.amount.toFixed(2)}
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleEditExpense(expense)
                                          }
                                          className="p-2 rounded-lg hover:bg-purple-100 transition-all"
                                        >
                                          <Pencil className="w-4 h-4 text-purple-600" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            setShowDeleteConfirm({
                                              type: "expense",
                                              id: expense.id,
                                            })
                                          }
                                          className="p-2 rounded-lg hover:bg-red-100 transition-all"
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
                    </div>
                  );
                }
              )
            )}
          </div>
        )}
      </div>

      {configuredBudgets.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-purple-900">
                  Seguimiento de presupuestos
                </h2>
                <p className="text-sm text-purple-600">
                  Revisa cómo avanzas este mes en cada categoría
                </p>
              </div>
              <button
                onClick={() => setShowBudgets(true)}
                className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-purple-200 text-sm font-medium text-purple-900 transition-all"
              >
                Gestionar presupuestos
              </button>
            </div>

            <div className="space-y-3">
              {configuredBudgets.map(([category, budget]) => {
                const spent = categoryTotals[category] || 0;
                const percentage = budget
                  ? Math.min((spent / budget) * 100, 100)
                  : 0;
                const isOver = spent > budget;

                return (
                  <div
                    key={category}
                    className="bg-white/60 border border-purple-100 rounded-2xl p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-semibold text-purple-900">
                          {category}
                        </p>
                        <p className="text-xs text-purple-500">
                          Presupuesto: €{budget.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            isOver ? "text-red-600" : "text-purple-900"
                          }`}
                        >
                          Gastado: €{spent.toFixed(2)}
                        </p>
                        <p className="text-xs text-purple-500">
                          {isOver
                            ? `Excedido por €${(spent - budget).toFixed(2)}`
                            : `Disponible: €${(budget - spent).toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-purple-100/60 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver
                            ? "bg-red-500"
                            : percentage > 90
                            ? "bg-orange-500"
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`}
                        style={{ width: `${isOver ? 100 : percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación - z-index mayor */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="backdrop-blur-xl bg-white/95 rounded-3xl w-full max-w-md p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-purple-900 mb-2">
                ¿Estás seguro?
              </h3>
              <p className="text-purple-600 mb-6">
                {showDeleteConfirm.type === "expense" &&
                  "Esta acción eliminará el gasto permanentemente."}
                {showDeleteConfirm.type === "category" &&
                  `Esta acción eliminará la categoría "${showDeleteConfirm.name}" y todos sus gastos asociados.`}
                {showDeleteConfirm.type === "subcategory" &&
                  `Esta acción eliminará la subcategoría "${showDeleteConfirm.subname}" y todos sus gastos asociados.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-purple-200 text-purple-900 font-medium hover:bg-purple-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === "expense") {
                      handleDeleteExpense(showDeleteConfirm.id);
                    } else if (showDeleteConfirm.type === "category") {
                      handleDeleteCategory(showDeleteConfirm.name);
                    } else if (showDeleteConfirm.type === "subcategory") {
                      handleDeleteSubcategory(
                        showDeleteConfirm.category,
                        showDeleteConfirm.subname
                      );
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Lateral */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex"
          onClick={() => setShowMenu(false)}
        >
          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
            <div className="backdrop-blur-xl bg-white/95 h-full w-80 shadow-2xl p-6 overflow-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-purple-900">Menú</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 rounded-full hover:bg-purple-100"
                >
                  <X className="w-5 h-5 text-purple-600" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowBudgets(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-100 transition-all text-left"
                >
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-900 font-medium">
                    Presupuestos
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowCategories(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-100 transition-all text-left"
                >
                  <Settings className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-900 font-medium">
                    Gestionar Categorías
                  </span>
                </button>

                <button
                  onClick={() => {
                    exportToCSV();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-100 transition-all text-left"
                >
                  <Download className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-900 font-medium">
                    Exportar CSV
                  </span>
                </button>

                <div className="border-t border-purple-200 my-4"></div>

                <button
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-100 transition-all text-left"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span className="text-red-900 font-medium">
                    Cerrar Sesión
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Añadir Gasto */}
      {showAddExpense && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowAddExpense(false)}
        >
          <div
            className="backdrop-blur-xl bg-white/95 rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-900">
                {editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
              </h2>
              <button
                onClick={() => {
                  setShowAddExpense(false);
                  setEditingExpense(null);
                  setNewExpense({
                    name: "",
                    amount: "",
                    category: "",
                    subcategory: "",
                    date: new Date().toISOString().split("T")[0],
                    paymentMethod: "Tarjeta",
                    recurring: false,
                  });
                }}
                className="p-2 rounded-full hover:bg-purple-100"
              >
                <X className="w-5 h-5 text-purple-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Nombre del gasto
                </label>
                <input
                  type="text"
                  value={newExpense.name}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Ej. Compra semanal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                >
                  <option value="">Selecciona categoría</option>
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {newExpense.category && (
                <div>
                  <label className="block text-sm font-medium text-purple-900 mb-2">
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
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  >
                    <option value="">Selecciona subcategoría</option>
                    {categories[newExpense.category]?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                >
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newExpense.recurring}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      recurring: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-200"
                />
                <span className="text-sm font-medium text-purple-900">
                  Gasto recurrente
                </span>
              </label>

              <button
                onClick={
                  editingExpense ? handleUpdateExpense : handleAddExpense
                }
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
              >
                {editingExpense ? "Actualizar Gasto" : "Añadir Gasto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Presupuestos */}
      {showBudgets && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowBudgets(false)}
        >
          <div
            className="backdrop-blur-xl bg-white/95 rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-900">
                Presupuestos Mensuales
              </h2>
              <button
                onClick={() => setShowBudgets(false)}
                className="p-2 rounded-full hover:bg-purple-100"
              >
                <X className="w-5 h-5 text-purple-600" />
              </button>
            </div>

            <div className="space-y-4">
              {Object.keys(categories).map((category) => {
                const spent = categoryTotals[category] || 0;
                const rawBudget = budgets[category];
                const numericBudget =
                  rawBudget === "" ||
                  rawBudget === undefined ||
                  rawBudget === null
                    ? 0
                    : Number(rawBudget) || 0;
                const displayBudget =
                  rawBudget === 0 ||
                  rawBudget === undefined ||
                  rawBudget === null
                    ? ""
                    : rawBudget;
                const percentage = numericBudget
                  ? (spent / numericBudget) * 100
                  : 0;

                return (
                  <div key={category} className="bg-purple-50 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-purple-900">
                        {category}
                      </span>
                      <span className="text-sm text-purple-600">
                        €{spent.toFixed(2)}
                        {displayBudget !== "" ? ` / €${displayBudget}` : ""}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={displayBudget === "" ? "" : String(displayBudget)}
                      onChange={(e) => {
                        const { value } = e.target;
                        setBudgets({
                          ...budgets,
                          [category]: value === "" ? "" : value,
                        });
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none mb-2"
                      placeholder="Establecer presupuesto"
                    />
                    {numericBudget > 0 && (
                      <>
                        <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentage > 90
                                ? "bg-red-500"
                                : percentage > 70
                                ? "bg-orange-500"
                                : "bg-gradient-to-r from-purple-500 to-pink-500"
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <p
                          className={`text-xs mt-1 ${
                            percentage > 90
                              ? "text-red-600"
                              : percentage > 70
                              ? "text-orange-600"
                              : "text-purple-600"
                          }`}
                        >
                          {percentage.toFixed(0)}% gastado
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSaveBudgets}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
            >
              Guardar Presupuestos
            </button>
          </div>
        </div>
      )}

      {/* Modal Gestionar Categorías */}
      {showCategories && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowCategories(false)}
        >
          <div
            className="backdrop-blur-xl bg-white/95 rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-900">
                Gestionar Categorías
              </h2>
              <button
                onClick={() => setShowCategories(false)}
                className="p-2 rounded-full hover:bg-purple-100"
              >
                <X className="w-5 h-5 text-purple-600" />
              </button>
            </div>

            <div className="bg-purple-50 rounded-2xl p-4 mb-4">
              <h3 className="font-medium text-purple-900 mb-3">
                Añadir Categoría
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Nueva categoría"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-pink-50 rounded-2xl p-4 mb-6">
              <h3 className="font-medium text-purple-900 mb-3">
                Añadir Subcategoría
              </h3>
              <select
                value={selectedCategoryForSub}
                onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none mb-2"
              >
                <option value="">Selecciona categoría</option>
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
                    className="flex-1 px-4 py-2 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                    placeholder="Nueva subcategoría"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleAddSubcategory()
                    }
                  />
                  <button
                    onClick={handleAddSubcategory}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {Object.entries(categories).map(([category, subcategories]) => (
                <div
                  key={category}
                  className="bg-white/60 rounded-2xl p-4 border border-purple-200"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-purple-900">{category}</h3>
                    <button
                      onClick={() =>
                        setShowDeleteConfirm({
                          type: "category",
                          name: category,
                        })
                      }
                      className="p-1 rounded-lg hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {subcategories.map((sub) => (
                      <div
                        key={sub}
                        className="flex justify-between items-center bg-purple-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-purple-700">{sub}</span>
                        <button
                          onClick={() =>
                            setShowDeleteConfirm({
                              type: "subcategory",
                              category,
                              subname: sub,
                            })
                          }
                          className="p-1 rounded hover:bg-red-100 transition-all"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ))}
                    {subcategories.length === 0 && (
                      <p className="text-xs text-purple-400 italic">
                        Sin subcategorías
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCategories(false)}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClarityExpenseApp;
