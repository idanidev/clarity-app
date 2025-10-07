import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  AlertTriangle,
  BarChart3,
  Check,
  Download,
  Filter,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Table as TableIcon,
  Target,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Auth from "./components/Auth";
import { auth } from "./firebase";
import {
  addExpense as addExpenseDB,
  deleteExpense as deleteExpenseDB,
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
  const [showFilters, setShowFilters] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [notification, setNotification] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const [expenses, setExpenses] = useState([]);

  const [categories, setCategories] = useState({
    Alimentacion: ["Supermercado", "Restaurantes", "Cafeterias"],
    Transporte: ["Combustible", "Transporte publico", "Taxi"],
    Vivienda: ["Alquiler", "Hipoteca", "Suministros"],
    Ocio: ["Streaming", "Deportes", "Hobbies"],
    Salud: ["Medico", "Farmacia", "Gimnasio"],
    Compras: ["Ropa", "Electronica", "Otros"],
    Educacion: ["Cursos", "Libros", "Material"],
  });

  const [budgets, setBudgets] = useState({});

  const [newExpense, setNewExpense] = useState({
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

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        saveCategories(user.uid, categories);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [categories, user]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        saveBudgets(user.uid, budgets);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [budgets, user]);

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

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.category || !newExpense.subcategory) {
      showNotification("Por favor completa todos los campos", "warning");
      return;
    }

    try {
      const expenseData = {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
      };

      await addExpenseDB(user.uid, expenseData);

      const budget = budgets[expenseData.category];
      const spent = categoryTotals[expenseData.category] || 0;
      const newSpent = spent + expenseData.amount;

      if (budget && newSpent > budget * 0.9) {
        showNotification(
          `Alerta! Has gastado ${((newSpent / budget) * 100).toFixed(
            0
          )}% del presupuesto de ${expenseData.category}`,
          "warning"
        );
      } else {
        showNotification("Gasto anadido correctamente", "success");
      }

      setNewExpense({
        amount: "",
        category: "",
        subcategory: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "Tarjeta",
        recurring: false,
      });
      setShowAddExpense(false);
      setViewMode("table");
    } catch (error) {
      showNotification("Error al anadir gasto", "warning");
      console.error(error);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpenseDB(user.uid, id);
      showNotification("Gasto eliminado", "success");
    } catch (error) {
      showNotification("Error al eliminar gasto", "warning");
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setNewExpense(expense);
    setShowAddExpense(true);
  };

  const handleUpdateExpense = async () => {
    try {
      await updateExpenseDB(user.uid, editingExpense.id, {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
      });
      showNotification("Gasto actualizado", "success");
      setEditingExpense(null);
      setNewExpense({
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

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (categories[newCategory]) {
      showNotification("La categoria ya existe", "warning");
      return;
    }
    setCategories({ ...categories, [newCategory]: [] });
    showNotification("Categoria anadida", "success");
    setNewCategory("");
  };

  const handleAddSubcategory = () => {
    if (!newSubcategory.trim() || !selectedCategoryForSub) return;
    if (categories[selectedCategoryForSub].includes(newSubcategory)) {
      showNotification("La subcategoria ya existe", "warning");
      return;
    }
    setCategories({
      ...categories,
      [selectedCategoryForSub]: [
        ...categories[selectedCategoryForSub],
        newSubcategory,
      ],
    });
    showNotification("Subcategoria anadida", "success");
    setNewSubcategory("");
  };

  const handleDeleteCategory = (category) => {
    const { [category]: removed, ...rest } = categories;
    setCategories(rest);
    const { [category]: removedBudget, ...restBudgets } = budgets;
    setBudgets(restBudgets);
    showNotification("Categoria eliminada", "success");
  };

  const handleDeleteSubcategory = (category, subcategory) => {
    setCategories({
      ...categories,
      [category]: categories[category].filter((sub) => sub !== subcategory),
    });
    showNotification("Subcategoria eliminada", "success");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification("Sesion cerrada", "success");
    } catch (error) {
      showNotification("Error al cerrar sesion", "warning");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Fecha",
      "Categoria",
      "Subcategoria",
      "Monto",
      "Metodo de Pago",
      "Recurrente",
    ];
    const rows = filteredExpenses.map((exp) => [
      exp.date,
      exp.category,
      exp.subcategory,
      exp.amount,
      exp.paymentMethod,
      exp.recurring ? "Si" : "No",
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
      <div className="backdrop-blur-xl bg-white/40 border-b border-white/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Clarity
            </h1>
            <p className="text-xs text-purple-600">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setViewMode(viewMode === "chart" ? "table" : "chart")
              }
              className="p-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/60 transition-all"
            >
              {viewMode === "chart" ? (
                <TableIcon className="w-5 h-5 text-purple-600" />
              ) : (
                <BarChart3 className="w-5 h-5 text-purple-600" />
              )}
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className="p-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/60 transition-all"
            >
              <Filter className="w-5 h-5 text-purple-600" />
            </button>
            <button
              onClick={() => setShowBudgets(true)}
              className="p-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/60 transition-all"
            >
              <Target className="w-5 h-5 text-purple-600" />
            </button>
            <button
              onClick={() => setShowCategories(true)}
              className="p-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/60 transition-all"
            >
              <Menu className="w-5 h-5 text-purple-600" />
            </button>
            <button
              onClick={exportToCSV}
              className="p-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/60 transition-all"
            >
              <Download className="w-5 h-5 text-purple-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/60 transition-all"
            >
              <LogOut className="w-5 h-5 text-purple-600" />
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-2xl backdrop-blur-xl border ${
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-3xl p-6 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
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
        </div>

        {viewMode === "chart" ? (
          <div className="space-y-4">
            {Object.entries(categoryTotals).length === 0 ? (
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-8 text-center">
                <p className="text-purple-600">No hay gastos en este periodo</p>
              </div>
            ) : (
              Object.entries(categoryTotals).map(([category, amount]) => {
                const budget = budgets[category];
                const percentage = budget ? (amount / budget) * 100 : 0;
                return (
                  <div
                    key={category}
                    className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-4 shadow-lg"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-purple-900">
                        {category}
                      </span>
                      <span className="text-sm text-purple-600">
                        €{amount.toFixed(2)}
                      </span>
                    </div>
                    {budget > 0 && (
                      <>
                        <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
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
                        <p className="text-xs text-purple-600 mt-1">
                          {percentage.toFixed(0)}% de €{budget} presupuesto
                        </p>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-8 text-center">
                <p className="text-purple-600">No hay gastos en este periodo</p>
              </div>
            ) : (
              filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-purple-900">
                          {expense.category}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                          {expense.subcategory}
                        </span>
                      </div>
                      <p className="text-sm text-purple-600">
                        {new Date(expense.date).toLocaleDateString("es-ES")}
                      </p>
                      <div className="flex gap-2 mt-1">
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
                      <span className="text-xl font-bold text-purple-900">
                        €{expense.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="p-2 rounded-lg hover:bg-purple-100 transition-all"
                      >
                        <Pencil className="w-4 h-4 text-purple-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 rounded-lg hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

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
                  Monto
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
                  Categoria
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
                  <option value="">Selecciona categoria</option>
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
                    Subcategoria
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
                    <option value="">Selecciona subcategoria</option>
                    {categories[newExpense.category].map((sub) => (
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
                  Metodo de pago
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
                {editingExpense ? "Actualizar Gasto" : "Anadir Gasto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="backdrop-blur-xl bg-white/95 rounded-3xl w-full max-w-md p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-900">Filtros</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 rounded-full hover:bg-purple-100"
              >
                <X className="w-5 h-5 text-purple-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Mes
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Categoria
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                >
                  <option value="Todas">Todas</option>
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

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
                Presupuestos
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
                const budget = budgets[category] || 0;
                const percentage = budget ? (spent / budget) * 100 : 0;

                return (
                  <div key={category} className="bg-purple-50 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-purple-900">
                        {category}
                      </span>
                      <span className="text-sm text-purple-600">
                        €{spent.toFixed(2)} / €{budget}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) =>
                        setBudgets({
                          ...budgets,
                          [category]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none mb-2"
                      placeholder="Establecer presupuesto"
                    />
                    {budget > 0 && (
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
              onClick={() => setShowBudgets(false)}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
            >
              Guardar Presupuestos
            </button>
          </div>
        </div>
      )}

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
                Gestionar Categorias
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
                Anadir Categoria
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Nueva categoria"
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
                Anadir Subcategoria
              </h3>
              <select
                value={selectedCategoryForSub}
                onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none mb-2"
              >
                <option value="">Selecciona categoria</option>
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
                    placeholder="Nueva subcategoria"
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
                      onClick={() => handleDeleteCategory(category)}
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
                          onClick={() => handleDeleteSubcategory(category, sub)}
                          className="p-1 rounded hover:bg-red-100 transition-all"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ))}
                    {subcategories.length === 0 && (
                      <p className="text-xs text-purple-400 italic">
                        Sin subcategorias
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
