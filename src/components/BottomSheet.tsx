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

/**
 * BottomSheet optimizado para iOS Capacitor
 * - Fija el problema del espacio blanco/negro en safe-area
 * - Hardware accelerated animations con requestAnimationFrame
 * - Memoized para evitar re-renders
 * - Touch handlers optimizados para 60fps
 */
const BottomSheet = memo(
  ({
    visible,
    onClose,
    title,
    darkMode,
    maxHeight = "90vh",
    children,
  }: BottomSheetProps) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const currentY = useRef(0);
    const isDragging = useRef(false);
    const lastY = useRef(0);
    const velocity = useRef(0);
    const lastTime = useRef(0);
    const rafId = useRef<number | null>(null);

    // Deshabilitar scroll del body cuando el bottom sheet está visible
    useDisableBodyScroll(visible);

    // Color de fondo según tema
    const sheetBgColor = darkMode ? '#1f2937' : '#ffffff';

    // ✅ Función para actualizar transform usando RAF
    const updateTransform = useCallback(() => {
      if (!sheetRef.current || !isDragging.current) return;

      const diff = currentY.current - startY.current;

      if (diff > 0) {
        sheetRef.current.style.transform = `translate3d(0, ${diff}px, 0)`;
      }

      rafId.current = null;
    }, []);

    // ✅ Handlers para el handle de arrastre (no el contenido completo)
    const handleTouchStart = useCallback((e: TouchEvent) => {
      const touch = e.touches[0];
      startY.current = touch.clientY;
      lastY.current = touch.clientY;
      currentY.current = touch.clientY;
      isDragging.current = true;
      velocity.current = 0;
      lastTime.current = Date.now();

      if (sheetRef.current) {
        sheetRef.current.style.transition = "none";
      }
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
      if (!isDragging.current || !sheetRef.current) return;

      const touch = e.touches[0];
      const now = Date.now();
      const timeDelta = now - lastTime.current;

      if (timeDelta > 0) {
        const yDelta = touch.clientY - lastY.current;
        velocity.current = yDelta / timeDelta;
      }

      currentY.current = touch.clientY;
      lastY.current = touch.clientY;
      lastTime.current = now;

      if (!rafId.current) {
        rafId.current = requestAnimationFrame(updateTransform);
      }

      const diff = currentY.current - startY.current;
      if (diff > 0) {
        e.preventDefault();
      }
    }, [updateTransform]);

    const handleTouchEnd = useCallback(() => {
      if (!isDragging.current || !sheetRef.current) return;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      const diff = currentY.current - startY.current;
      const threshold = 150;
      const velocityThreshold = 0.5;

      if (diff > threshold || (diff > 50 && velocity.current > velocityThreshold)) {
        sheetRef.current.style.transition = "transform 0.3s cubic-bezier(0.36, 0, 0.1, 1)";
        sheetRef.current.style.transform = `translate3d(0, 100%, 0)`;

        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        sheetRef.current.style.transition = "transform 0.3s cubic-bezier(0.36, 0, 0.1, 1)";
        sheetRef.current.style.transform = "translate3d(0, 0, 0)";

        setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = "";
          }
        }, 300);
      }

      isDragging.current = false;
      startY.current = 0;
      currentY.current = 0;
      lastY.current = 0;
      velocity.current = 0;
    }, [onClose]);

    // ✅ Event listeners solo en el handle, no en todo el sheet
    useEffect(() => {
      const handle = handleRef.current;
      if (!handle || !visible) return;

      const options = { passive: false };
      handle.addEventListener("touchstart", handleTouchStart, options);
      handle.addEventListener("touchmove", handleTouchMove, options);
      handle.addEventListener("touchend", handleTouchEnd);
      handle.addEventListener("touchcancel", handleTouchEnd);

      return () => {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }

        handle.removeEventListener("touchstart", handleTouchStart);
        handle.removeEventListener("touchmove", handleTouchMove);
        handle.removeEventListener("touchend", handleTouchEnd);
        handle.removeEventListener("touchcancel", handleTouchEnd);
      };
    }, [visible, handleTouchStart, handleTouchMove, handleTouchEnd]);

    // Resetear posición cuando se cierra
    useEffect(() => {
      if (!visible && sheetRef.current) {
        sheetRef.current.style.transform = "translate3d(0, 0, 0)";
        sheetRef.current.style.transition = "";
      }
    }, [visible]);

    if (!visible) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
      <>
        {/* 
          CLAVE: Un div que cubre TODA la pantalla incluyendo safe-areas
          con el color de fondo correcto según el tema.
          Esto evita el espacio blanco/negro.
        */}
        <div
          style={{
            position: 'fixed',
            zIndex: 9999998,
            // Extender mucho más allá de los límites de la pantalla
            top: '-500px',
            left: '-500px',
            right: '-500px',
            bottom: '-500px',
            // Color de fondo que coincide con el sheet
            backgroundColor: sheetBgColor,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />

        {/* Backdrop semitransparente */}
        <div
          style={{
            position: 'fixed',
            zIndex: 9999999,
            top: '-100px',
            left: '-100px',
            right: '-100px',
            bottom: '-100px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        />

        {/* Container del sheet */}
        <div
          style={{
            position: 'fixed',
            zIndex: 10000000,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            pointerEvents: 'none',
          }}
        >
          {/* Sheet principal */}
          <div
            ref={sheetRef}
            style={{
              position: 'relative',
              maxHeight,
              backgroundColor: sheetBgColor,
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              pointerEvents: 'auto',
              animation: 'slideUpNative 0.3s cubic-bezier(0.36, 0, 0.1, 1)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle visual para swipe - área de arrastre */}
            <div
              ref={handleRef}
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-manipulation"
              style={{
                backgroundColor: sheetBgColor,
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div
                className={`w-12 h-1.5 rounded-full transition-all ${
                  darkMode ? "bg-gray-600" : "bg-gray-300"
                }`}
              />
            </div>

            {/* Header fijo */}
            <div
              className={`px-6 py-4 flex justify-between items-center border-b flex-shrink-0 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
              style={{ backgroundColor: sheetBgColor }}
            >
              <h3
                className={`text-2xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                type="button"
                className={`p-2 rounded-lg transition-colors touch-manipulation flex items-center justify-center ${
                  darkMode
                    ? "hover:bg-gray-700 active:bg-gray-600 text-gray-400"
                    : "hover:bg-gray-100 active:bg-gray-200 text-gray-600"
                }`}
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido scrollable */}
            <div
              className="overflow-y-auto overscroll-contain flex-1"
              data-scrollable="true"
              style={{
                maxHeight: `calc(${maxHeight} - 140px)`,
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                backgroundColor: sheetBgColor,
              }}
            >
              {children}
            </div>

            {/* Padding inferior para safe-area */}
            <div
              style={{
                height: 'env(safe-area-inset-bottom, 0px)',
                minHeight: '20px',
                backgroundColor: sheetBgColor,
                flexShrink: 0,
              }}
            />
          </div>

          {/* 
            Extensión inferior: cubre el espacio debajo del sheet
            incluyendo cualquier gap del safe-area
          */}
          <div
            style={{
              position: 'absolute',
              bottom: '-200px',
              left: 0,
              right: 0,
              height: '250px',
              backgroundColor: sheetBgColor,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
        </div>
      </>,
      document.body
    );
  }
);

BottomSheet.displayName = "BottomSheet";

export default BottomSheet;
