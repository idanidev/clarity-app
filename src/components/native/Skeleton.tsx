import React from 'react';

interface SkeletonProps {
  /** Ancho del skeleton */
  width?: string | number;
  /** Alto del skeleton */
  height?: string | number;
  /** Border radius */
  borderRadius?: string | number;
  /** Modo oscuro */
  darkMode?: boolean;
  /** Clase adicional */
  className?: string;
}

/**
 * Skeleton loading placeholder
 * Muestra un shimmer effect mientras carga el contenido
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  darkMode = false,
  className = '',
}) => (
  <div
    className={`${darkMode ? 'skeleton-dark' : 'skeleton'} ${className}`}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    }}
  />
);

/**
 * Skeleton para una card de gasto
 */
export const ExpenseSkeleton: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => (
  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white/70'} space-y-3`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} borderRadius={20} darkMode={darkMode} />
        <div className="space-y-2">
          <Skeleton width={120} height={16} darkMode={darkMode} />
          <Skeleton width={80} height={12} darkMode={darkMode} />
        </div>
      </div>
      <Skeleton width={60} height={20} darkMode={darkMode} />
    </div>
  </div>
);

/**
 * Skeleton para lista de gastos
 */
export const ExpenseListSkeleton: React.FC<{ 
  count?: number; 
  darkMode?: boolean;
}> = ({ count = 5, darkMode = false }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <ExpenseSkeleton key={i} darkMode={darkMode} />
    ))}
  </div>
);

/**
 * Skeleton para stat card
 */
export const StatCardSkeleton: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => (
  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white/70'} space-y-2`}>
    <Skeleton width={80} height={12} darkMode={darkMode} />
    <Skeleton width={100} height={28} darkMode={darkMode} />
    <Skeleton width="100%" height={8} darkMode={darkMode} />
  </div>
);

/**
 * Skeleton para el dashboard completo
 */
export const DashboardSkeleton: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => (
  <div className="space-y-6 p-4">
    {/* Stats row */}
    <div className="grid grid-cols-2 gap-4">
      <StatCardSkeleton darkMode={darkMode} />
      <StatCardSkeleton darkMode={darkMode} />
    </div>
    
    {/* Chart placeholder */}
    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
      <Skeleton width={120} height={16} darkMode={darkMode} className="mb-4" />
      <Skeleton width="100%" height={200} borderRadius={12} darkMode={darkMode} />
    </div>
    
    {/* Expense list */}
    <div>
      <Skeleton width={100} height={16} darkMode={darkMode} className="mb-3" />
      <ExpenseListSkeleton count={3} darkMode={darkMode} />
    </div>
  </div>
);

export default Skeleton;
