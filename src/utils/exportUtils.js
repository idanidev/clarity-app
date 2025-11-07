/**
 * Exporta gastos a formato CSV
 * @param {Array} expenses - Array de gastos
 * @param {String} filename - Nombre del archivo (sin extensión)
 */
export const exportToCSV = (expenses, filename = "gastos") => {
  if (!expenses || expenses.length === 0) {
    alert("No hay gastos para exportar");
    return;
  }

  // Encabezados CSV
  const headers = [
    "Fecha",
    "Nombre",
    "Categoría",
    "Subcategoría",
    "Cantidad (€)",
    "Método de Pago",
    "Recurrente",
  ];

  // Convertir gastos a filas CSV
  const rows = expenses.map((expense) => [
    expense.date || "",
    expense.name || "",
    expense.category || "",
    expense.subcategory || "",
    expense.amount?.toFixed(2) || "0.00",
    expense.paymentMethod || "",
    expense.isRecurring ? "Sí" : "No",
  ]);

  // Combinar headers y rows
  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          // Escapar comillas y envolver en comillas si contiene comas
          const cellStr = String(cell || "");
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    )
    .join("\n");

  // Crear BOM para UTF-8 (para Excel)
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Crear enlace de descarga
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpiar URL
  URL.revokeObjectURL(url);
};

/**
 * Formatea una fecha para el nombre del archivo
 */
export const formatDateForFilename = (date) => {
  if (!date) return new Date().toISOString().split("T")[0];
  return date.split("T")[0];
};

