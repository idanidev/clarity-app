import { TrendingUp, Mic, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { VoiceSettings, VoiceStats, loadVoiceStats } from "./VoiceExpenseButton";

interface VoiceSettingsPanelProps {
  darkMode: boolean;
  settings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
}

// ============================================
// COMPONENTE DE AJUSTES DE VOZ
// Para integrar en el panel de Settings general
// ============================================
const VoiceSettingsPanel = ({ darkMode, settings, onSettingsChange }: VoiceSettingsPanelProps) => {
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<VoiceStats>(loadVoiceStats());

  // Actualizar stats cada vez que se abre el panel
  useEffect(() => {
    setStats(loadVoiceStats());
  }, [showStats]);

  const handleToggle = (key: keyof VoiceSettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleSliderChange = (value: number) => {
    onSettingsChange({
      ...settings,
      silenceTimeout: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${darkMode ? "bg-purple-500/20" : "bg-purple-100"}`}>
          <Mic className={`w-5 h-5 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
            Entrada por Voz
          </h3>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Configura cómo funciona el reconocimiento de voz
          </p>
        </div>
      </div>

      {/* Ajustes */}
      <div className="space-y-4">
        {/* Auto-confirmación */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
              Confirmación automática
            </p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Guardar sin preguntar después de {settings.silenceTimeout / 1000}s de silencio
            </p>
          </div>
          <label className="relative inline-block w-12 h-6 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoConfirm}
              onChange={() => handleToggle('autoConfirm')}
              className="sr-only peer"
            />
            <div className={`
              w-12 h-6 rounded-full transition-colors
              ${settings.autoConfirm
                ? darkMode ? 'bg-purple-600' : 'bg-purple-500'
                : darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }
            `}></div>
            <div className={`
              absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform
              ${settings.autoConfirm ? 'translate-x-6' : 'translate-x-0'}
            `}></div>
          </label>
        </div>

        {/* Vibración */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
              📳 Vibración
            </p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Feedback táctil al detectar y guardar gastos
            </p>
          </div>
          <label className="relative inline-block w-12 h-6 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.vibration}
              onChange={() => handleToggle('vibration')}
              className="sr-only peer"
            />
            <div className={`
              w-12 h-6 rounded-full transition-colors
              ${settings.vibration
                ? darkMode ? 'bg-purple-600' : 'bg-purple-500'
                : darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }
            `}></div>
            <div className={`
              absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform
              ${settings.vibration ? 'translate-x-6' : 'translate-x-0'}
            `}></div>
          </label>
        </div>

        {/* Sugerencias */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
              💡 Sugerencias inteligentes
            </p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Mostrar sugerencias mientras hablas
            </p>
          </div>
          <label className="relative inline-block w-12 h-6 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showSuggestions}
              onChange={() => handleToggle('showSuggestions')}
              className="sr-only peer"
            />
            <div className={`
              w-12 h-6 rounded-full transition-colors
              ${settings.showSuggestions
                ? darkMode ? 'bg-purple-600' : 'bg-purple-500'
                : darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }
            `}></div>
            <div className={`
              absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform
              ${settings.showSuggestions ? 'translate-x-6' : 'translate-x-0'}
            `}></div>
          </label>
        </div>

        {/* Tiempo de silencio */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
              ⏱️ Tiempo de silencio
            </p>
            <span className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {settings.silenceTimeout / 1000}s
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="5000"
            step="500"
            value={settings.silenceTimeout}
            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
            className={`
              w-full h-2 rounded-full appearance-none cursor-pointer
              ${darkMode ? "bg-gray-700" : "bg-gray-200"}
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:${darkMode ? 'bg-purple-500' : 'bg-purple-600'}
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:${darkMode ? 'bg-purple-500' : 'bg-purple-600'}
            `}
          />
          <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Tiempo de espera entre múltiples gastos
          </p>
        </div>
      </div>

      {/* Botón de Estadísticas */}
      <button
        onClick={() => setShowStats(!showStats)}
        className={`
          w-full py-3 px-4 rounded-xl font-medium transition-colors
          flex items-center justify-center gap-2
          ${darkMode
            ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
            : "bg-blue-50 hover:bg-blue-100 text-blue-600"
          }
        `}
      >
        <TrendingUp className="w-4 h-4" />
        {showStats ? 'Ocultar Estadísticas' : 'Ver Estadísticas'}
      </button>

      {/* Panel de Estadísticas */}
      {showStats && (
        <div className="space-y-4 pt-4 border-t"
          style={darkMode ? { borderColor: 'rgb(55, 65, 81)' } : { borderColor: 'rgb(229, 231, 235)' }}
        >
          <h4 className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
            📊 Estadísticas de Uso
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {/* Total de gastos */}
            <div className={`p-4 rounded-xl ${darkMode ? "bg-green-600/10" : "bg-green-50"}`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                Total gastos por voz
              </p>
              <p className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                {stats.totalVoiceExpenses}
              </p>
            </div>

            {/* Precisión */}
            <div className={`p-4 rounded-xl ${darkMode ? "bg-blue-600/10" : "bg-blue-50"}`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? "text-blue-400" : "text-blue-700"}`}>
                Precisión promedio
              </p>
              <p className={`text-2xl font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                {stats.avgConfidence.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Velocidad */}
          <div className={`p-4 rounded-xl ${darkMode ? "bg-yellow-600/10" : "bg-yellow-50"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-4 h-4 ${darkMode ? "text-yellow-400" : "text-yellow-600"}`} />
              <span className={`text-sm font-medium ${darkMode ? "text-yellow-400" : "text-yellow-700"}`}>
                Velocidad
              </span>
            </div>
            <p className={`text-sm ${darkMode ? "text-yellow-300" : "text-yellow-600"}`}>
              Añades gastos {stats.totalVoiceExpenses > 10 ? '3x más rápido' : '2x más rápido'} que manualmente
            </p>
          </div>

          {/* Última vez usado */}
          {stats.lastUsed && (
            <div className={`p-4 rounded-xl ${darkMode ? "bg-purple-600/10" : "bg-purple-50"}`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? "text-purple-400" : "text-purple-700"}`}>
                Última vez usado
              </p>
              <p className={`text-sm ${darkMode ? "text-purple-300" : "text-purple-600"}`}>
                {new Date(stats.lastUsed).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceSettingsPanel;

