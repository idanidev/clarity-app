import { useState } from "react";
import {
  CheckCircle,
  LayoutDashboard,
  Palette,
  Smartphone,
  Sparkles,
  X,
  BarChart3,
  Filter,
  MousePointerClick,
  Move,
  Calendar,
  TrendingUp,
  DollarSign,
  Bell,
  Edit2,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
} from "lucide-react";

/**
 * Compara dos versiones semánticas (ej: "1.0.0", "1.1.0")
 * Retorna: -1 si v1 < v2, 0 si v1 === v2, 1 si v1 > v2
 */
const compareVersions = (v1, v2) => {
  if (!v1) return -1; // Si no hay versión vista, mostrar todos
  if (!v2) return 1;
  
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
};

// Componente de demostración de deslizamiento - Réplica exacta del ExpenseCard
const SwipeDemo = ({ darkMode, textClass, textSecondaryClass }) => {
  const [animationState, setAnimationState] = useState("none"); // "none" | "left" | "right"

  const startAnimation = (direction) => {
    setAnimationState(direction);
    setTimeout(() => setAnimationState("none"), 2500);
  };

  // Datos del ejemplo de gasto
  const exampleExpense = {
    name: "Amazon",
    subcategory: "Electronica",
    category: "Compras",
    amount: 29.99,
    date: new Date().toISOString(),
    paymentMethod: "Tarjeta",
  };

  const paymentStyle = {
    bg: darkMode ? "bg-blue-500/20" : "bg-blue-100",
    border: darkMode ? "border-blue-400/30" : "border-blue-300",
    text: darkMode ? "text-blue-200" : "text-blue-700",
  };

  return (
    <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl overflow-hidden ${
      darkMode ? "bg-gray-800/50 border border-gray-700" : "bg-purple-50/50 border border-purple-200"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <p className={`text-xs sm:text-sm font-semibold ${textClass}`}>
          💡 Prueba la funcionalidad:
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => startAnimation("right")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              darkMode 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            ← Editar
          </button>
          <button
            onClick={() => startAnimation("left")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              darkMode 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            Eliminar →
          </button>
        </div>
      </div>
      
      <div className="relative overflow-hidden rounded-lg sm:rounded-xl w-full">
        {/* Botón de editar (izquierda, aparece al deslizar a la derecha) */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-14 sm:w-18 md:w-24 flex items-center justify-center transition-transform duration-500 z-10 ${
            animationState === "right" ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button className="w-full h-full bg-blue-600 flex items-center justify-center shadow-lg">
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" />
              <span className="text-[8px] sm:text-[9px] md:text-xs text-white font-medium leading-tight">Editar</span>
            </div>
          </button>
        </div>

        {/* Botón de eliminar (derecha, aparece al deslizar a la izquierda) */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-14 sm:w-18 md:w-24 flex items-center justify-center transition-transform duration-500 z-10 ${
            animationState === "left" ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button className="w-full h-full bg-red-600 flex items-center justify-center shadow-lg">
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" />
              <span className="text-[8px] sm:text-[9px] md:text-xs text-white font-medium leading-tight">Eliminar</span>
            </div>
          </button>
        </div>

        {/* Tarjeta de ejemplo de gasto - Réplica exacta del ExpenseCard */}
        <div
          className={`relative transition-transform duration-500 ${
            animationState === "left" 
              ? "-translate-x-14 sm:-translate-x-18 md:-translate-x-24" 
              : animationState === "right"
              ? "translate-x-14 sm:translate-x-18 md:translate-x-24"
              : "translate-x-0"
          } rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 ${
            darkMode 
              ? "bg-gray-800/40 border border-gray-700/50" 
              : "bg-white border border-purple-100/80 shadow-sm"
          } ${animationState !== "none" ? "bg-purple-500/10 border-purple-500/30 shadow-lg" : ""} w-full`}
        >
          <div className="flex justify-between items-center gap-1.5 sm:gap-2">
            <div className="flex-1 min-w-0 pr-1 sm:pr-2">
              {/* Nombre del gasto y subcategoría */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                <ShoppingBag className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`} />
                {exampleExpense.name && (
                  <h4 className={`text-xs sm:text-sm md:text-base font-semibold truncate ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}>
                    {exampleExpense.name}
                  </h4>
                )}
                {exampleExpense.subcategory && (
                  <>
                    <span className="text-gray-500 text-[10px] sm:text-xs">•</span>
                    <span className={`text-xs sm:text-sm md:text-base font-medium truncate ${
                      darkMode ? "text-purple-300" : "text-purple-600"
                    }`}>
                      {exampleExpense.subcategory}
                    </span>
                  </>
                )}
              </div>

              {/* Date and payment method */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap text-[10px] sm:text-[11px] md:text-xs text-gray-400 mt-0.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {new Date(exampleExpense.date).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className={`text-[10px] sm:text-[11px] md:text-xs px-1 sm:px-1.5 py-0.5 rounded-full border flex-shrink-0 font-medium ${
                  darkMode 
                    ? `${paymentStyle.bg} ${paymentStyle.border} ${paymentStyle.text}`
                    : `${paymentStyle.bg} ${paymentStyle.border} ${paymentStyle.text}`
                }`}>
                  {exampleExpense.paymentMethod}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="flex flex-col items-end flex-shrink-0">
              <p className={`text-xs sm:text-sm md:text-base font-bold whitespace-nowrap ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
                €{exampleExpense.amount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Flechas indicadoras - Responsive y dentro del contenedor */}
        {animationState === "none" && (
          <>
            {/* Flecha izquierda para editar */}
            <div className="absolute left-1 sm:left-2 md:left-3 top-1/2 -translate-y-1/2 pointer-events-none z-20">
              <div className="flex flex-col items-center gap-0.5 sm:gap-1 animate-pulse">
                <ArrowLeft className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rotate-180 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-semibold ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                  Editar
                </span>
              </div>
            </div>
            
            {/* Flecha derecha para eliminar */}
            <div className="absolute right-1 sm:right-2 md:right-3 top-1/2 -translate-y-1/2 pointer-events-none z-20">
              <div className="flex flex-col items-center gap-0.5 sm:gap-1 animate-pulse">
                <ArrowLeft className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ${darkMode ? "text-red-400" : "text-red-600"}`} />
                <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-semibold ${darkMode ? "text-red-300" : "text-red-700"}`}>
                  Eliminar
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ChangelogModal = ({ visible, darkMode, cardClass, textClass, textSecondaryClass, onClose, lastSeenVersion, currentVersion }) => {
  if (!visible) {
    return null;
  }

  // Todos los cambios con sus versiones
  const allChanges = [
    {
      version: "2.1.0",
      icon: Move,
      title: "Editar y borrar deslizando en móvil",
      description:
        "¡Ahora puedes editar o eliminar gastos directamente desde la lista! En móvil, desliza un gasto hacia la izquierda para ver las opciones de editar y borrar. Es rápido e intuitivo.",
      hasDemo: true,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      version: "2.1.0",
      icon: Calendar,
      title: "Calendario de gastos en gráficos",
      description:
        "Visualiza tus gastos día a día en un calendario mensual interactivo. Cada día muestra el total gastado con colores que indican la intensidad del gasto. El calendario respeta tus filtros de mes, así que puedes ver cualquier mes que quieras.",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      version: "2.1.0",
      icon: TrendingUp,
      title: "Gráfico semanal de gastos",
      description:
        "Nuevo gráfico de barras que muestra tus gastos día a día de la semana actual. Perfecto para ver en qué días gastas más y mantener el control de tus finanzas semanales.",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      version: "2.1.0",
      icon: DollarSign,
      title: "Ingresos mejorados",
      description:
        "Ahora puedes dejar el campo de ingresos vacío si tus ingresos varían cada mes. Además, recibirás un recordatorio automático al final de cada mes para actualizar tus ingresos si no son fijos.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      version: "2.1.0",
      icon: Bell,
      title: "Recordatorios de ingresos variables",
      description:
        "Si tus ingresos cambian cada mes, Clarity te recordará automáticamente al final del mes para que actualices tus ingresos y mantengas tus objetivos al día.",
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      version: "2.0.1",
      icon: BarChart3,
      title: "Vista de gráfica mejorada",
      description:
        "La leyenda y tabla de categorías ahora son más compactas en móvil, permitiendo ver toda la información sin desplazarte. Optimizado para aprovechar mejor el espacio en pantallas pequeñas.",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      version: "2.0.1",
      icon: Filter,
      title: "Filtros mejorados: modo anual y modo 'Todos'",
      description:
        "Ahora puedes filtrar tus gastos directamente desde la vista de gráfica con tres opciones: modo mensual (mes específico), modo anual (año completo) y modo 'Todos' (todos los gastos desde el principio). Además, puedes limpiar los filtros con un solo clic. Los filtros están disponibles tanto en móvil como en escritorio.",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      version: "2.0.1",
      icon: MousePointerClick,
      title: "Interacción mejorada del gráfico",
      description:
        "Haz clic en cualquier sección del gráfico para ver los detalles de la categoría. El tooltip ya no aparece al pasar el mouse, solo cuando seleccionas una categoría haciendo clic. El borde se resalta para indicar la selección.",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      version: "1.0.0",
      icon: Smartphone,
      title: "Navegación móvil optimizada",
      description:
        "Los botones flotantes ahora te llevan al inicio automáticamente y el menú móvil se simplificó para centrarse en la gestión de categorías, presupuestos y consejos.",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      version: "1.0.0",
      icon: LayoutDashboard,
      title: "Acciones de escritorio más limpias",
      description:
        "El encabezado en ordenador elimina accesos redundantes y mantiene el foco en la gestión, consejos, exportaciones y ajustes con una interfaz más ligera.",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      version: "1.0.0",
      icon: Palette,
      title: "Colores personalizados para categorías",
      description:
        "Elige y personaliza el color de cada categoría. Los colores se reflejan en gráficos y en la tabla principal.",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      version: "1.0.0",
      icon: Sparkles,
      title: "Edición de categorías",
      description:
        "Edita nombre y color de tus categorías existentes y aplica los cambios automáticamente a tus gastos relacionados.",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      version: "1.0.0",
      icon: CheckCircle,
      title: "Menú de consejos",
      description:
        "Descubre recomendaciones prácticas y un consejo Pro para iOS para no olvidar registrar tus gastos.",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  // Filtrar cambios: mostrar solo los desde la última versión vista hasta la actual
  const visibleChanges = allChanges.filter((change) => {
    // Si no hay versión vista, mostrar todos
    if (!lastSeenVersion) return true;
    
    // Mostrar cambios cuya versión es mayor que la última vista
    // y menor o igual a la versión actual
    const changeVersion = change.version;
    const isNewerThanLastSeen = compareVersions(lastSeenVersion, changeVersion) < 0;
    const isNotNewerThanCurrent = compareVersions(changeVersion, currentVersion) <= 0;
    
    return isNewerThanLastSeen && isNotNewerThanCurrent;
  });

  // Agrupar cambios por versión
  const changesByVersion = visibleChanges.reduce((acc, change) => {
    if (!acc[change.version]) {
      acc[change.version] = [];
    }
    acc[change.version].push(change);
    return acc;
  }, {});

  // Ordenar versiones de más reciente a más antigua
  const sortedVersions = Object.keys(changesByVersion).sort((a, b) => compareVersions(a, b) * -1);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={onClose}
    >
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-2xl w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 z-10 px-6 py-4 flex justify-between items-center ${
            darkMode
              ? "bg-gray-800/95 border-b border-gray-700"
              : "bg-white/80 border-b border-purple-100"
          } backdrop-blur`}
        >
          <div>
            <h3 className={`text-2xl font-bold ${textClass} flex items-center gap-2`}>
              <Sparkles className="w-6 h-6 text-amber-500" />
              ¡Nuevas Funcionalidades!
            </h3>
            <p className={`text-sm ${textSecondaryClass} mt-1`}>
              {sortedVersions.length > 0 
                ? lastSeenVersion
                  ? `Novedades desde v${lastSeenVersion} hasta v${currentVersion}`
                  : `Todas las mejoras hasta v${currentVersion}`
                : "Descubre las últimas mejoras en Clarity"
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-6 h-6 ${textClass}`} />
          </button>
        </div>

        <div className="px-6 py-6">
          {sortedVersions.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-lg font-semibold ${textClass} mb-2`}>
                No hay nuevas funcionalidades
              </p>
              <p className={textSecondaryClass}>
                Ya estás al día con todas las mejoras
              </p>
            </div>
          ) : (
            <div className="space-y-6 mb-6">
              {sortedVersions.map((version) => {
                const versionChanges = changesByVersion[version];
                const isLatestVersion = version === currentVersion;
                
                return (
                  <div key={version} className="space-y-4">
                    {/* Encabezado de versión */}
                    <div className={`flex items-center gap-3 pb-2 border-b ${
                      darkMode ? "border-gray-700" : "border-purple-200"
                    }`}>
                      <span className={`text-sm font-bold ${
                        isLatestVersion ? "text-purple-600" : textSecondaryClass
                      }`}>
                        v{version}
                      </span>
                      {isLatestVersion && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          darkMode 
                            ? "bg-purple-900/50 text-purple-300" 
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          Última versión
                        </span>
                      )}
                    </div>
                    
                    {/* Cambios de esta versión */}
                    <div className="space-y-4 pl-2">
                      {versionChanges.map((change, index) => {
                        const Icon = change.icon;
                        return (
                          <div
                            key={`${version}-${index}`}
                            className={`p-4 rounded-xl border ${
                              darkMode ? "bg-gray-700/50 border-gray-600" : "bg-white/50 border-purple-100"
                            } transition-all`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-10 h-10 rounded-xl ${change.bgColor} flex items-center justify-center flex-shrink-0 ${
                                darkMode ? "opacity-80" : ""
                              }`}>
                                <Icon className={`w-5 h-5 ${change.color}`} />
                              </div>
                              <div className="flex-1">
                                <h4 className={`text-lg font-semibold ${textClass} mb-2`}>
                                  {change.title}
                                </h4>
                                <p className={`text-sm ${textSecondaryClass} mb-2`}>
                                  {change.description}
                                </p>
                                {change.hasDemo && (
                                  <SwipeDemo darkMode={darkMode} textClass={textClass} textSecondaryClass={textSecondaryClass} />
                                )}
                                {change.example && !change.hasDemo && (
                                  <div className={`mt-3 p-3 rounded-lg ${
                                    darkMode ? "bg-purple-900/30 border border-purple-700/50" : "bg-purple-50 border border-purple-200"
                                  }`}>
                                    <p className={`text-sm font-medium ${darkMode ? "text-purple-300" : "text-purple-700"}`}>
                                      {change.example}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className={`p-4 rounded-xl ${
            darkMode ? "bg-green-900/30 border-green-800" : "bg-green-50 border-green-200"
          } border flex items-start gap-3 mb-6`}>
            <CheckCircle className={`w-5 h-5 ${darkMode ? "text-green-400" : "text-green-600"} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`font-semibold ${textClass} mb-1`}>
                ¿Tienes sugerencias?
              </p>
              <p className={`text-sm ${textSecondaryClass}`}>
                Tu opinión es importante para nosotros. Si tienes ideas para mejorar Clarity, 
                no dudes en contactarnos.
              </p>
            </div>
          </div>
        </div>

        <div className={`px-6 pb-6 flex justify-end`}>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            ¡Genial, gracias!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;

