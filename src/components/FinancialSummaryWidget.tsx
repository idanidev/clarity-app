import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FinancialSummaryWidgetProps {
  income: number | null;
  totalExpenses: number;
  darkMode: boolean;
  onEditIncome: () => void;
}

const FinancialSummaryWidget: React.FC<FinancialSummaryWidgetProps> = ({ 
  income, 
  totalExpenses, 
  darkMode,
  onEditIncome 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const available = (income || 0) - totalExpenses;
  const spentPercentage = income && income > 0 ? ((totalExpenses / income) * 100).toFixed(0) : 0;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowDetails(!showDetails)}
        whileTap={{ scale: 0.98 }}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl transition-all
          ${darkMode 
            ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700' 
            : 'bg-white hover:bg-gray-50 border border-gray-200'
          }
          shadow-sm hover:shadow-md
        `}
      >
        {/* Icono según estado financiero */}
        {available >= 0 ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}

        {/* Monto disponible */}
        <div className="flex flex-col items-start">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Disponible
          </span>
          <span className={`text-sm font-bold ${
            available >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {available.toFixed(0)}€
          </span>
        </div>
      </motion.button>

      {/* Dropdown con detalles */}
      <AnimatePresence>
        {showDetails && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 z-30"
            />

            {/* Panel de detalles */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`
                absolute right-0 top-full mt-2 w-72 z-40
                rounded-2xl shadow-2xl p-4 border
                ${darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
                }
              `}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Resumen del Mes
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(false);
                    onEditIncome();
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Editar ingresos"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Ingresos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Ingresos
                    </span>
                  </div>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {income ? `${income.toFixed(0)}€` : 'No configurado'}
                  </span>
                </div>

                {/* Gastos */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Gastos
                    </span>
                  </div>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {totalExpenses.toFixed(0)}€
                  </span>
                </div>

                {/* Separador */}
                <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                {/* Disponible */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Disponible
                  </span>
                  <span className={`font-bold text-lg ${
                    available >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {available.toFixed(0)}€
                  </span>
                </div>

                {/* Porcentaje gastado */}
                {income && income > 0 && (
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-gray-750' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Gastado este mes
                      </span>
                      <span className={`text-xs font-semibold ${
                        Number(spentPercentage) >= 90 
                          ? 'text-red-600 dark:text-red-400'
                          : Number(spentPercentage) >= 70
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {spentPercentage}%
                      </span>
                    </div>
                    {/* Barra de progreso */}
                    <div className={`h-2 rounded-full overflow-hidden ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Number(spentPercentage), 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          Number(spentPercentage) >= 90
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : Number(spentPercentage) >= 70
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Mensaje si no hay ingresos configurados */}
                {!income && (
                  <div className={`p-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                      : 'bg-purple-50 border-purple-200 text-purple-700'
                  }`}>
                    <p className="text-xs">
                      💡 Configura tus ingresos mensuales para ver un resumen completo
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinancialSummaryWidget;
