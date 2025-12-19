import { motion } from 'framer-motion';
import { useMemo } from 'react';

const AnimatedProgressBar = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'purple',
  size = 'md',
  darkMode = false,
  animated = true,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-rose-500',
    yellow: 'from-yellow-500 to-orange-500',
    blue: 'from-blue-500 to-cyan-500',
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  // Determinar color basado en porcentaje (semáforo)
  const autoColor = useMemo(() => {
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'yellow';
    return 'green';
  }, [percentage]);

  const finalColor = color === 'purple' ? autoColor : color;

  return (
    <div className="w-full">
      {/* Label y porcentaje */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={`text-sm font-bold ${
              darkMode ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}

      {/* Barra de fondo */}
      <div className={`
        w-full rounded-full overflow-hidden
        ${sizeClasses[size]}
        ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}
      `}>
        {/* Barra de progreso animada */}
        <motion.div
          className={`h-full bg-gradient-to-r ${colorClasses[finalColor]} rounded-full relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 1 : 0,
            ease: 'easeOut',
            delay: 0.1,
          }}
        >
          {/* Efecto de brillo que se mueve */}
          {animated && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'linear',
              }}
              style={{ width: '50%' }}
            />
          )}
        </motion.div>
      </div>

      {/* Valores numéricos opcionales */}
      {max !== 100 && (
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {value.toFixed(2)}€
          </span>
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {max.toFixed(2)}€
          </span>
        </div>
      )}
    </div>
  );
};

export default AnimatedProgressBar;

