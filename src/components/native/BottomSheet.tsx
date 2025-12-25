import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';
import { useModalBackButton } from '../../hooks/useBackButton';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Título del sheet */
  title?: string;
  /** Altura máxima (porcentaje de pantalla) */
  maxHeight?: number;
  /** Mostrar handle de arrastre */
  showHandle?: boolean;
  /** Cerrar al hacer click en backdrop */
  closeOnBackdrop?: boolean;
  /** Modo oscuro */
  darkMode?: boolean;
  /** Deshabilitar gesture para cerrar */
  disableGesture?: boolean;
}

/**
 * iOS-style Bottom Sheet Modal
 * Se desliza desde abajo y se cierra arrastrando hacia abajo
 * 
 * @example
 * <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Opciones">
 *   <FilterOptions />
 * </BottomSheet>
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxHeight = 85,
  showHandle = true,
  closeOnBackdrop = true,
  darkMode = false,
  disableGesture = false,
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const { lightImpact, mediumImpact } = useHaptics();

  // Back button handler para Android
  useModalBackButton(isOpen, onClose);

  // Prevenir scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      lightImpact();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, lightImpact]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disableGesture) return;
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, [disableGesture]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disableGesture) return;
    
    const currentY = e.touches[0].clientY;
    const delta = currentY - startY.current;
    
    // Solo permitir arrastrar hacia abajo
    if (delta > 0) {
      setDragOffset(delta);
    }
  }, [isDragging, disableGesture]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Si se arrastró más del 30% de la altura, cerrar
    const sheetHeight = sheetRef.current?.offsetHeight || 0;
    if (dragOffset > sheetHeight * 0.3) {
      mediumImpact();
      onClose();
    }
    
    setDragOffset(0);
  }, [isDragging, dragOffset, onClose, mediumImpact]);

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop) {
      lightImpact();
      onClose();
    }
  }, [closeOnBackdrop, onClose, lightImpact]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          opacity: isOpen ? 1 - (dragOffset / 500) : 0,
        }}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        }`}
        style={{
          maxHeight: `${maxHeight}vh`,
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div 
              className={`w-10 h-1 rounded-full ${
                darkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            darkMode ? 'border-gray-800' : 'border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </h2>
            <button
              onClick={() => {
                lightImpact();
                onClose();
              }}
              className={`p-2 rounded-full transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-800 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div 
          className="overflow-y-auto native-scroll"
          style={{ maxHeight: `calc(${maxHeight}vh - 80px)` }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BottomSheet;
