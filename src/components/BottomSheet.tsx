import { X } from "@/components/icons";
import { memo, ReactNode, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDisableBodyScroll } from "../hooks/useDisableBodyScroll";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  darkMode: boolean;
  maxHeight?: string;
  children: ReactNode;
}

const BottomSheet = memo(
  ({
    visible,
    onClose,
    title,
    darkMode,
    maxHeight = "85vh",
    children,
  }: BottomSheetProps) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const currentY = useRef(0);
    const isDragging = useRef(false);
    const velocity = useRef(0);
    const lastY = useRef(0);
    const lastTime = useRef(0);

    useDisableBodyScroll(visible);

    const sheetBgColor = darkMode ? '#1f2937' : '#ffffff';

    // Manejar inicio del drag
    const onDragStart = useCallback((clientY: number) => {
      startY.current = clientY;
      currentY.current = clientY;
      lastY.current = clientY;
      isDragging.current = true;
      velocity.current = 0;
      lastTime.current = Date.now();
      
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'none';
      }
    }, []);

    // Manejar movimiento del drag
    const onDragMove = useCallback((clientY: number) => {
      if (!isDragging.current || !sheetRef.current) return;
      
      const now = Date.now();
      const timeDelta = now - lastTime.current;
      
      if (timeDelta > 0) {
        velocity.current = (clientY - lastY.current) / timeDelta;
      }
      
      currentY.current = clientY;
      lastY.current = clientY;
      lastTime.current = now;
      
      const diff = currentY.current - startY.current;
      
      // Solo mover si arrastramos hacia abajo
      if (diff > 0) {
        sheetRef.current.style.transform = `translateY(${diff}px)`;
      }
    }, []);

    // Manejar fin del drag
    const onDragEnd = useCallback(() => {
      if (!isDragging.current || !sheetRef.current) return;
      
      isDragging.current = false;
      
      const diff = currentY.current - startY.current;
      const threshold = 100;
      const velocityThreshold = 0.3;
      
      // Cerrar si arrastró lo suficiente o con velocidad
      if (diff > threshold || (diff > 30 && velocity.current > velocityThreshold)) {
        sheetRef.current.style.transition = 'transform 0.25s ease-out';
        sheetRef.current.style.transform = 'translateY(100%)';
        setTimeout(() => onClose(), 250);
      } else {
        // Volver a posición original
        sheetRef.current.style.transition = 'transform 0.25s ease-out';
        sheetRef.current.style.transform = 'translateY(0)';
      }
      
      // Reset
      startY.current = 0;
      currentY.current = 0;
      lastY.current = 0;
      velocity.current = 0;
    }, [onClose]);

    // Touch events para el área de drag
    useEffect(() => {
      const dragArea = dragAreaRef.current;
      if (!dragArea || !visible) return;

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDragStart(e.touches[0].clientY);
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDragMove(e.touches[0].clientY);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDragEnd();
      };

      // Mouse events para desktop
      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        onDragStart(e.clientY);
        
        const handleMouseMove = (e: MouseEvent) => {
          onDragMove(e.clientY);
        };
        
        const handleMouseUp = () => {
          onDragEnd();
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      };

      dragArea.addEventListener('touchstart', handleTouchStart, { passive: false });
      dragArea.addEventListener('touchmove', handleTouchMove, { passive: false });
      dragArea.addEventListener('touchend', handleTouchEnd, { passive: false });
      dragArea.addEventListener('touchcancel', handleTouchEnd, { passive: false });
      dragArea.addEventListener('mousedown', handleMouseDown);

      return () => {
        dragArea.removeEventListener('touchstart', handleTouchStart);
        dragArea.removeEventListener('touchmove', handleTouchMove);
        dragArea.removeEventListener('touchend', handleTouchEnd);
        dragArea.removeEventListener('touchcancel', handleTouchEnd);
        dragArea.removeEventListener('mousedown', handleMouseDown);
      };
    }, [visible, onDragStart, onDragMove, onDragEnd]);

    // Reset transform cuando se cierra
    useEffect(() => {
      if (!visible && sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
        sheetRef.current.style.transition = '';
      }
    }, [visible]);

    if (!visible) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />

        {/* Sheet Container */}
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000000,
          }}
        >
          <div
            ref={sheetRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight,
              backgroundColor: sheetBgColor,
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
              transform: 'translateY(0)',
              animation: 'slideUpNative 0.3s ease-out',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'env(safe-area-inset-bottom, 20px)',
            }}
          >
            {/* Área de drag - GRANDE y clickeable */}
            <div
              ref={dragAreaRef}
              style={{
                padding: '16px 24px 12px',
                cursor: 'grab',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: sheetBgColor,
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '5px',
                  borderRadius: '3px',
                  backgroundColor: darkMode ? '#6b7280' : '#d1d5db',
                }}
              />
            </div>

            {/* Header */}
            <div
              style={{
                padding: '8px 24px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                backgroundColor: sheetBgColor,
              }}
            >
              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: darkMode ? '#ffffff' : '#111827',
                  margin: 0,
                }}
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                type="button"
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  minHeight: '44px',
                  color: darkMode ? '#9ca3af' : '#4b5563',
                }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div
              ref={contentRef}
              data-scrollable="true"
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                backgroundColor: sheetBgColor,
                touchAction: 'pan-y',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  }
);

BottomSheet.displayName = "BottomSheet";

export default BottomSheet;
