import { useState, useRef, useCallback } from 'react';

export const usePullToRefresh = (onRefresh) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const containerRef = useRef(null);

  const PULL_THRESHOLD = 80; // Píxeles necesarios para activar refresh

  const handleTouchStart = useCallback((e) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    if (distance > 0) {
      // Prevenir scroll nativo mientras se hace pull
      e.preventDefault();
      // Efecto de resistencia (disminuye conforme tiras más)
      setPullDistance(Math.min(distance * 0.5, PULL_THRESHOLD * 1.5));
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Error refreshing:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    pullToRefreshProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

// Componente visual del indicador de pull-to-refresh
export const PullToRefreshIndicator = ({ pullDistance, isRefreshing, threshold = 80, darkMode = false }) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div
      className="absolute top-0 left-0 right-0 flex justify-center overflow-hidden transition-all"
      style={{
        height: showIndicator ? `${Math.min(pullDistance, threshold + 20)}px` : '0px',
        opacity: showIndicator ? 1 : 0,
      }}
    >
      <div className="flex items-center justify-center">
        {isRefreshing ? (
          <div className={`animate-spin rounded-full h-6 w-6 border-2 ${
            darkMode ? 'border-gray-600 border-t-purple-500' : 'border-gray-300 border-t-purple-600'
          }`} />
        ) : (
          <svg
            className={`transition-transform ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: `rotate(${progress * 180}deg)`,
              opacity: progress,
            }}
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        )}
      </div>
    </div>
  );
};

