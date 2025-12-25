import { X } from "@/components/icons";
import { memo, ReactNode, useCallback, useEffect, useRef } from "react";
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
 * BottomSheet optimizado con swipe gesture fluido
 * - Hardware accelerated animations con requestAnimationFrame
 * - Memoized para evitar re-renders
 * - Touch handlers optimizados para 60fps
 * - Detección de velocidad para mejor UX
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
    const startY = useRef(0);
    const currentY = useRef(0);
    const isDragging = useRef(false);
    const lastY = useRef(0);
    const velocity = useRef(0);
    const lastTime = useRef(0);
    const rafId = useRef<number | null>(null);

    // Deshabilitar scroll del body cuando el bottom sheet está visible
    useDisableBodyScroll(visible);

    // ✅ Función para actualizar transform usando RAF
    const updateTransform = useCallback(() => {
      if (!sheetRef.current || !isDragging.current) return;

      const diff = currentY.current - startY.current;

      // Solo permitir arrastrar hacia abajo
      if (diff > 0) {
        // ✅ GPU-accelerated transform con translate3d para mejor rendimiento
        sheetRef.current.style.transform = `translate3d(0, ${diff}px, 0)`;
      }

      rafId.current = null;
    }, []);

    // ✅ Handlers memoizados con requestAnimationFrame
    const handleTouchStart = useCallback((e: TouchEvent) => {
      const touch = e.touches[0];
      startY.current = touch.clientY;
      lastY.current = touch.clientY;
      currentY.current = touch.clientY;
      isDragging.current = true;
      velocity.current = 0;
      lastTime.current = Date.now();

      // Remover transición durante el drag para fluidez
      if (sheetRef.current) {
        sheetRef.current.style.transition = "none";
      }
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
      if (!isDragging.current || !sheetRef.current) return;

      const touch = e.touches[0];
      const now = Date.now();
      const timeDelta = now - lastTime.current;

      // Calcular velocidad para mejor UX
      if (timeDelta > 0) {
        const yDelta = touch.clientY - lastY.current;
        velocity.current = yDelta / timeDelta;
      }

      currentY.current = touch.clientY;
      lastY.current = touch.clientY;
      lastTime.current = now;

      // Usar requestAnimationFrame para fluidez (60fps)
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(updateTransform);
      }

      // Solo prevenir default si estamos arrastrando hacia abajo
      const diff = currentY.current - startY.current;
      if (diff > 0) {
        e.preventDefault();
      }
    }, [updateTransform]);

    const handleTouchEnd = useCallback(() => {
      if (!isDragging.current || !sheetRef.current) return;

      // Cancelar cualquier RAF pendiente
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      const diff = currentY.current - startY.current;
      const threshold = 150; // Aumentado para mejor UX
      const velocityThreshold = 0.5; // Velocidad mínima para cerrar

      // Cerrar si se arrastró suficiente O si la velocidad es alta
      if (diff > threshold || (diff > 50 && velocity.current > velocityThreshold)) {
        // Animación de cierre suave
        sheetRef.current.style.transition = "transform 0.3s cubic-bezier(0.36, 0, 0.1, 1)";
        sheetRef.current.style.transform = `translate3d(0, 100%, 0)`;

        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        // Volver a posición original con animación suave
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

    // ✅ Event listeners con cleanup
    useEffect(() => {
      const sheet = sheetRef.current;
      if (!sheet || !visible) return;

      const options = { passive: false };
      sheet.addEventListener("touchstart", handleTouchStart, options);
      sheet.addEventListener("touchmove", handleTouchMove, options);
      sheet.addEventListener("touchend", handleTouchEnd);
      sheet.addEventListener("touchcancel", handleTouchEnd);

      return () => {
        // Limpiar RAF pendiente
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }

        sheet.removeEventListener("touchstart", handleTouchStart);
        sheet.removeEventListener("touchmove", handleTouchMove);
        sheet.removeEventListener("touchend", handleTouchEnd);
        sheet.removeEventListener("touchcancel", handleTouchEnd);
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

    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center"
        style={{ zIndex: 9999999 }}
        onClick={onClose}
      >
        <div
          ref={sheetRef}
          className={`w-full rounded-t-3xl shadow-2xl ${darkMode ? "bg-gray-800" : "bg-white"
            }`}
          style={{
            maxHeight,
            transform: "translate3d(0, 0, 0)", // ✅ Hardware acceleration con translate3d
            willChange: "transform", // ✅ Optimización GPU
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            WebkitTransform: "translate3d(0, 0, 0)",
            // Animación inicial suave
            animation: visible ? "slideUpNative 0.3s cubic-bezier(0.36, 0, 0.1, 1)" : "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle visual para swipe */}
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-manipulation">
            <div
              className={`w-12 h-1.5 rounded-full transition-all ${darkMode ? "bg-gray-600" : "bg-gray-300"
                }`}
            />
          </div>

          {/* Header fijo */}
          <div
            className={`px-6 py-4 flex justify-between items-center border-b ${darkMode ? "border-gray-700" : "border-gray-200"
              }`}
          >
            <h3
              className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"
                }`}
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              type="button"
              className={`p-2 rounded-lg transition-colors touch-manipulation ${darkMode
                ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contenido scrollable optimizado */}
          <div
            className="overflow-y-auto overscroll-contain scroll-native"
            style={{
              maxHeight: "calc(90vh - 100px)",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              transform: "translateZ(0)",
              WebkitTransform: "translateZ(0)",
              paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

export default BottomSheet;
