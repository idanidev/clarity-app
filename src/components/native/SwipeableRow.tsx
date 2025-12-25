import React, { useCallback, useState } from 'react';
import { useSwipeable, SwipeEventData } from 'react-swipeable';
import { Trash2, Edit2 } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  /** Umbral en píxeles para activar la acción */
  threshold?: number;
  /** Si está deshabilitado el swipe */
  disabled?: boolean;
  /** Modo oscuro */
  darkMode?: boolean;
}

/**
 * Componente de fila con swipe para eliminar/editar
 * Funciona en iOS y Android con haptic feedback
 * 
 * @example
 * <SwipeableRow onDelete={() => handleDelete(id)} onEdit={() => handleEdit(id)}>
 *   <ExpenseCard expense={expense} />
 * </SwipeableRow>
 */
export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  onEdit,
  threshold = 80,
  disabled = false,
  darkMode = false,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const { lightImpact, mediumImpact, warningNotification } = useHaptics();

  const handleSwipeStart = useCallback(() => {
    setIsSwiping(true);
    lightImpact();
  }, [lightImpact]);

  const handleSwiping = useCallback((eventData: SwipeEventData) => {
    if (disabled) return;
    
    const { deltaX } = eventData;
    
    // Solo permitir swipe hacia la izquierda (mostrar acciones)
    if (deltaX < 0) {
      const offset = Math.min(Math.abs(deltaX), threshold * 1.5);
      setSwipeOffset(-offset);
      
      // Haptic cuando se cruza el umbral
      if (Math.abs(deltaX) >= threshold && swipeOffset > -threshold) {
        mediumImpact();
      }
    }
  }, [disabled, threshold, swipeOffset, mediumImpact]);

  const handleSwipeEnd = useCallback(() => {
    setIsSwiping(false);
    
    if (Math.abs(swipeOffset) >= threshold) {
      // Mantener abierto mostrando las acciones
      setSwipeOffset(-threshold);
    } else {
      // Cerrar
      setSwipeOffset(0);
    }
  }, [swipeOffset, threshold]);

  const handleDelete = useCallback(() => {
    warningNotification();
    setSwipeOffset(0);
    onDelete?.();
  }, [onDelete, warningNotification]);

  const handleEdit = useCallback(() => {
    lightImpact();
    setSwipeOffset(0);
    onEdit?.();
  }, [onEdit, lightImpact]);

  const closeSwipe = useCallback(() => {
    setSwipeOffset(0);
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipeStart: handleSwipeStart,
    onSwiping: handleSwiping,
    onSwiped: handleSwipeEnd,
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 10,
  });

  const isOpen = Math.abs(swipeOffset) >= threshold;

  return (
    <div className="relative overflow-hidden" {...swipeHandlers}>
      {/* Acciones de fondo */}
      <div 
        className={`absolute inset-y-0 right-0 flex items-center transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: threshold }}
      >
        {onEdit && (
          <button
            onClick={handleEdit}
            className={`h-full flex-1 flex items-center justify-center ${
              darkMode ? 'bg-blue-600' : 'bg-blue-500'
            } text-white`}
            aria-label="Editar"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className={`h-full flex-1 flex items-center justify-center ${
              darkMode ? 'bg-red-600' : 'bg-red-500'
            } text-white`}
            aria-label="Eliminar"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div
        className="relative bg-inherit transition-transform"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
        onClick={isOpen ? closeSwipe : undefined}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableRow;
