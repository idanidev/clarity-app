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

const ChangelogModal = ({ visible, darkMode, cardClass, textClass, textSecondaryClass, onClose, lastSeenVersion, currentVersion }) => {
  if (!visible) {
    return null;
  }

  // Todos los cambios con sus versiones
  const allChanges = [
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
                                <p className={`text-sm ${textSecondaryClass}`}>
                                  {change.description}
                                </p>
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

