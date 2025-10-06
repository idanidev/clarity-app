import React, { useState } from "react";
import {
  Plus,
  X,
  BarChart3,
  Table,
  Filter,
  Menu,
  Target,
  Download,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const ExpenseTrackerApp = () => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [selectedMonth, setSelectedMonth] = useState("2025-10");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [notification, setNotification] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const [expenses, setExpenses] = useState([
    {
      id: 1,
      amount: 450.5,
      category: "Alimentacion",
      subcategory: "Supermercado",
      date: "2025-10-01",
      paymentMethod: "Tarjeta",
      recurring: false,
    },
    {
      id: 2,
      amount: 320,
      category: "Transporte",
      subcategory: "Combustible",
      date: "2025-10-03",
      paymentMethod: "Efectivo",
      recurring: false,
    },
    {
      id: 3,
      amount: 15.99,
      category: "Ocio",
      subcategory: "Netflix",
      date: "2025-10-05",
      paymentMethod: "Tarjeta",
      recurring: true,
    },
  ]);

  const [budgets, setBudgets] = useState([
    { category: "Alimentacion", amount: 500 },
    { category: "Transporte", amount: 200 },
  ]);

  const [categories, setCategories] = useState({
    Alimentacion: ["Supermercado", "Restaurantes", "Cafeterias"],
    Transporte: ["Combustible", "Transporte publico", "Taxi/Uber"],
    Vivienda: ["Alquiler", "Hipoteca", "Suministros"],
    Ocio: ["Entretenimiento", "Streaming", "Deportes"],
    Salud: ["Medico", "Farmacia", "Gimnasio"],
    Compras: ["Ropa", "Electronica", "Otros"],
  });

  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "",
    subcategory: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Tarjeta",
    recurring: false,
  });

  const [newBudget, setNewBudget] = useState({ category: "", amount: "" });
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState("");

  const filteredExpenses = expenses.filter((exp) => {
    const expMonth = exp.date.slice(0, 7);
    const matchesMonth = expMonth === selectedMonth;
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

  const exceededBudgets = budgets.filter((budget) => {
    const spent = categoryTotals[budget.category] || 0;
    return spent > budget.amount;
  });

  const showNotification = (message, type = "warning") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddExpense = () => {
    if (newExpense.amount && newExpense.category && newExpense.subcategory) {
      const expenseAmount = parseFloat(newExpense.amount);
      if (editingExpense) {
        setExpenses(
          expenses.map((exp) =>
            exp.id === editingExpense.id
              ? { ...exp, ...newExpense, amount: expenseAmount }
              : exp
          )
        );
        setEditingExpense(null);
        showNotification("Gasto actualizado", "success");
      } else {
        setExpenses([
          ...expenses,
          { id: Date.now(), ...newExpense, amount: expenseAmount },
        ]);
        const categorySpent =
          (categoryTotals[newExpense.category] || 0) + expenseAmount;
        const budget = budgets.find((b) => b.category === newExpense.category);
        if (budget && categorySpent > budget.amount) {
          showNotification(
            `Presupuesto superado en ${newExpense.category}`,
            "warning"
          );
        } else {
          showNotification("Gasto anadido", "success");
        }
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
      {notification && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            notification.type === "success"
              ? "bg-green-500/90 border-green-400"
              : "bg-orange-500/90 border-orange-400"
          } text-white`}
        >
          <p className="font-medium text-sm">{notification.message}</p>
        </div>
      )}

      <div className="backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Mis Gastos</h1>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-white/10"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {showMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="absolute right-4 top-20 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl p-2 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowCategories(true);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white"
            >
              <Filter className="w-5 h-5" />
              <span>Categorias</span>
            </button>
            <button
              onClick={() => {
                setShowBudgets(true);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white"
            >
              <Target className="w-5 h-5" />
              <span>Presupuestos</span>
            </button>
            <button
              onClick={() => {
                let csv =
                  "Fecha,Cantidad,Categoria,Subcategoria,Metodo,Recurrente\n";
                filteredExpenses.forEach(
                  (e) =>
                    (csv += `${e.date},${e.amount},${e.category},${
                      e.subcategory
                    },${e.paymentMethod},${e.recurring ? "Si" : "No"}\n`)
                );
                const blob = new Blob([csv], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `gastos-${selectedMonth}.csv`;
                a.click();
                setShowMenu(false);
                showNotification("CSV exportado", "success");
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white"
            >
              <Download className="w-5 h-5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 shadow-2xl border border-white/20">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-purple-200">Octubre 2025</p>
            <button
              onClick={() => setShowFilters(true)}
              className="p-2 rounded-full hover:bg-white/10"
            >
              <Filter
                className={`w-5 h-5 ${
                  filterCategory !== "Todas"
                    ? "text-pink-400"
                    : "text-purple-300"
                }`}
              />
            </button>
          </div>
          <p className="text-5xl font-bold text-white">
            {totalExpenses.toFixed(2)}
          </p>
          <p className="text-sm text-purple-200 mt-1">Total este mes</p>
        </div>

        {exceededBudgets.map((budget) => (
          <div
            key={budget.category}
            className="backdrop-blur-xl bg-orange-500/20 border border-orange-400/30 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-300 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-white">{budget.category}</p>
                <p className="text-sm text-orange-200">
                  {categoryTotals[budget.category].toFixed(2)} de{" "}
                  {budget.amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {!showAddExpense && (
          <button
            onClick={() => setShowAddExpense(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl p-6 shadow-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xl font-semibold">Anadir Gasto</span>
          </button>
        )}

        {showAddExpense && (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
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
                className="p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5 text-purple-200" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  className="w-full text-3xl font-bold bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
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
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="bg-slate-800">
                    Seleccionar
                  </option>
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-800">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              {newExpense.category && (
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
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
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="" className="bg-slate-800">
                      Seleccionar
                    </option>
                    {categories[newExpense.category].map((sub) => (
                      <option key={sub} value={sub} className="bg-slate-800">
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Metodo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setNewExpense({ ...newExpense, paymentMethod: "Tarjeta" })
                    }
                    className={`py-3 rounded-2xl font-medium transition ${
                      newExpense.paymentMethod === "Tarjeta"
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-purple-200 border border-white/20"
                    }`}
                  >
                    Tarjeta
                  </button>
                  <button
                    onClick={() =>
                      setNewExpense({
                        ...newExpense,
                        paymentMethod: "Efectivo",
                      })
                    }
                    className={`py-3 rounded-2xl font-medium transition ${
                      newExpense.paymentMethod === "Efectivo"
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-purple-200 border border-white/20"
                    }`}
                  >
                    Efectivo
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4">
                <span className="font-medium text-white">Recurrente</span>
                <button
                  onClick={() =>
                    setNewExpense({
                      ...newExpense,
                      recurring: !newExpense.recurring,
                    })
                  }
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    newExpense.recurring ? "bg-purple-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      newExpense.recurring ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <button
                onClick={handleAddExpense}
                disabled={
                  !newExpense.amount ||
                  !newExpense.category ||
                  !newExpense.subcategory
                }
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 rounded-2xl"
              >
                {editingExpense ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-1 border border-white/20 flex gap-1">
          <button
            onClick={() => setViewMode("chart")}
            className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              viewMode === "chart"
                ? "bg-purple-500 text-white"
                : "text-purple-200"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Grafica
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              viewMode === "table"
                ? "bg-purple-500 text-white"
                : "text-purple-200"
            }`}
          >
            <Table className="w-5 h-5" />
            Tabla
          </button>
        </div>

        {viewMode === "chart" ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">
              Gastos por Categoria
            </h3>
            {Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const budget = budgets.find((b) => b.category === cat);
                const pct = budget
                  ? (amt / budget.amount) * 100
                  : (amt / totalExpenses) * 100;
                const over = budget && amt > budget.amount;
                return (
                  <div
                    key={cat}
                    className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-white">{cat}</span>
                      <span
                        className={`text-sm ${
                          over ? "text-orange-300" : "text-purple-200"
                        }`}
                      >
                        {amt.toFixed(2)}
                        {budget && ` / ${budget.amount.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          over
                            ? "bg-gradient-to-r from-orange-500 to-red-500"
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Lista de Gastos</h3>
            {filteredExpenses
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((exp) => (
                <div
                  key={exp.id}
                  className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xl font-bold text-white">
                        {exp.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-purple-300">
                        {exp.category} • {exp.subcategory}
                      </p>
                      <p className="text-xs text-purple-200 mt-1">
                        {new Date(exp.date).toLocaleDateString("es-ES")} •{" "}
                        {exp.paymentMethod}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {exp.recurring && (
                        <span className="bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full">
                          Recurrente
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditingExpense(exp);
                          setNewExpense({
                            amount: exp.amount.toString(),
                            category: exp.category,
                            subcategory: exp.subcategory,
                            date: exp.date,
                            paymentMethod: exp.paymentMethod,
                            recurring: exp.recurring,
                          });
                          setShowAddExpense(true);
                        }}
                        className="p-2 rounded-full hover:bg-white/10"
                      >
                        <Pencil className="w-4 h-4 text-purple-200" />
                      </button>
                      <button
                        onClick={() => {
                          setExpenses(expenses.filter((e) => e.id !== exp.id));
                          showNotification("Eliminado", "success");
                        }}
                        className="p-2 rounded-full hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4 text-red-300" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {showFilters && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-3xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">Filtros</h2>
            <div className="space-y-4">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white"
              >
                <option className="bg-slate-800">Todas</option>
                {Object.keys(categories).map((c) => (
                  <option key={c} className="bg-slate-800">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-2xl"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {showBudgets && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setShowBudgets(false)}
        >
          <div
            className="backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-3xl w-full max-w-md p-6 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">Presupuestos</h2>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <select
                  value={newBudget.category}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, category: e.target.value })
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white mb-2"
                >
                  <option className="bg-slate-800">Seleccionar</option>
                  {Object.keys(categories).map((c) => (
                    <option key={c} className="bg-slate-800">
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={newBudget.amount}
                  onChange={(e) =>
                    setNewBudget({ ...newBudget, amount: e.target.value })
                  }
                  placeholder="Cantidad"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 mb-2"
                />
                <button
                  onClick={() => {
                    if (newBudget.category && newBudget.amount) {
                      const ex = budgets.find(
                        (b) => b.category === newBudget.category
                      );
                      if (ex) {
                        setBudgets(
                          budgets.map((b) =>
                            b.category === newBudget.category
                              ? { ...b, amount: parseFloat(newBudget.amount) }
                              : b
                          )
                        );
                      } else {
                        setBudgets([
                          ...budgets,
                          {
                            category: newBudget.category,
                            amount: parseFloat(newBudget.amount),
                          },
                        ]);
                      }
                      setNewBudget({ category: "", amount: "" });
                      showNotification("Presupuesto configurado", "success");
                    }
                  }}
                  disabled={!newBudget.category || !newBudget.amount}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-2 rounded-xl disabled:from-gray-500"
                >
                  Anadir
                </button>
              </div>
              {budgets.map((b) => (
                <div
                  key={b.category}
                  className="flex justify-between items-center backdrop-blur-xl bg-white/10 rounded-xl p-4 border border-white/20"
                >
                  <span className="text-white font-medium">{b.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-purple-200">
                      {b.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        setBudgets(
                          budgets.filter((x) => x.category !== b.category)
                        );
                        showNotification("Eliminado", "success");
                      }}
                      className="text-red-300 p-2 rounded-lg hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowBudgets(false)}
              className="w-full mt-6 bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/20"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showCategories && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setShowCategories(false)}
        >
          <div
            className="backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-3xl w-full max-w-md p-6 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">Categorias</h2>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nueva categoria"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50"
                  />
                  <button
                    onClick={() => {
                      if (newCategory && !categories[newCategory]) {
                        setCategories({ ...categories, [newCategory]: [] });
                        setNewCategory("");
                        showNotification("Anadida", "success");
                      }
                    }}
                    disabled={!newCategory}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl disabled:from-gray-500"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <select
                  value={selectedCategoryForSub}
                  onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white mb-2"
                >
                  <option className="bg-slate-800">
                    Seleccionar categoria
                  </option>
                  {Object.keys(categories).map((c) => (
                    <option key={c} className="bg-slate-800">
                      {c}
                    </option>
                  ))}
                </select>
                {selectedCategoryForSub && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      placeholder="Nueva subcategoria"
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50"
                    />
                    <button
                      onClick={() => {
                        if (
                          newSubcategory &&
                          !categories[selectedCategoryForSub].includes(
                            newSubcategory
                          )
                        ) {
                          setCategories({
                            ...categories,
                            [selectedCategoryForSub]: [
                              ...categories[selectedCategoryForSub],
                              newSubcategory,
                            ],
                          });
                          setNewSubcategory("");
                          showNotification("Anadida", "success");
                        }
                      }}
                      disabled={!newSubcategory}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl disabled:from-gray-500"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              {Object.entries(categories).map(([cat, subs]) => (
                <div
                  key={cat}
                  className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-white">{cat}</span>
                    <button
                      onClick={() => {
                        const c = { ...categories };
                        delete c[cat];
                        setCategories(c);
                        setExpenses(expenses.filter((e) => e.category !== cat));
                        setBudgets(budgets.filter((b) => b.category !== cat));
                        showNotification("Eliminada", "success");
                      }}
                      className="text-red-300 p-2 rounded-lg hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 pl-4">
                    {subs.map((sub) => (
                      <div
                        key={sub}
                        className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2 border border-white/10"
                      >
                        <span className="text-sm text-purple-200">{sub}</span>
                        <button
                          onClick={() => {
                            setCategories({
                              ...categories,
                              [cat]: categories[cat].filter((s) => s !== sub),
                            });
                            setExpenses(
                              expenses.filter(
                                (e) =>
                                  !(e.category === cat && e.subcategory === sub)
                              )
                            );
                            showNotification("Eliminada", "success");
                          }}
                          className="text-red-300 p-1 rounded hover:bg-red-500/20"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {subs.length === 0 && (
                      <p className="text-xs text-purple-300 italic">
                        Sin subcategorias
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowCategories(false)}
              className="w-full mt-6 bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/20"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTrackerApp;
