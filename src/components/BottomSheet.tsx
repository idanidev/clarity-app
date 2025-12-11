import { X } from "lucide-react";
import { memo, ReactNode, useCallback, useEffect, useRef } from "react";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  darkMode: boolean;
  maxHeight?: string;
  children: ReactNode;
}

/**
 * BottomSheet optimizado con swipe gesture
 * - Hardware accelerated animations
 * - Memoized para evitar re-renders
 * - Touch handlers optimizados
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

    // ✅ Handlers memoizados
    const handleTouchStart = useCallback((e: TouchEvent) => {
      const touch = e.touches[0];
      startY.current = touch.clientY;
      isDragging.current = true;
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
      if (!isDragging.current || !sheetRef.current) return;

      const touch = e.touches[0];
      currentY.current = touch.clientY;
      const diff = currentY.current - startY.current;

      // Solo permitir arrastrar hacia abajo
      if (diff > 0) {
        // ✅ GPU-accelerated transform
        sheetRef.current.style.transform = `translateY(${diff}px)`;
        e.preventDefault();
      }
    }, []);

    const handleTouchEnd = useCallback(() => {
      if (!isDragging.current || !sheetRef.current) return;

      const diff = currentY.current - startY.current;

      if (diff > 100) {
        // Arrastró suficiente para cerrar
        onClose();
      } else {
        // Volver a posición original
        sheetRef.current.style.transition =
          "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        sheetRef.current.style.transform = "translateY(0)";

        setTimeout(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition = "";
          }
        }, 300);
      }

      isDragging.current = false;
      startY.current = 0;
      currentY.current = 0;
    }, [onClose]);

    // ✅ Event listeners con cleanup
    useEffect(() => {
      const sheet = sheetRef.current;
      if (!sheet || !visible) return;

      const options = { passive: false };
      sheet.addEventListener("touchstart", handleTouchStart, options);
      sheet.addEventListener("touchmove", handleTouchMove, options);
      sheet.addEventListener("touchend", handleTouchEnd);

      return () => {
        sheet.removeEventListener("touchstart", handleTouchStart);
        sheet.removeEventListener("touchmove", handleTouchMove);
        sheet.removeEventListener("touchend", handleTouchEnd);
      };
    }, [visible, handleTouchStart, handleTouchMove, handleTouchEnd]);

    if (!visible) return null;

    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50"
        onClick={onClose}
      >
        <div
          ref={sheetRef}
          className={`w-full rounded-t-3xl shadow-2xl ${
            darkMode ? "bg-gray-800" : "bg-white"
          } animate-slide-up`}
          style={{
            maxHeight,
            transform: "translateZ(0)", // ✅ Hardware acceleration
            willChange: "transform", // ✅ Optimización GPU
            backfaceVisibility: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle visual para swipe */}
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div
              className={`w-12 h-1.5 rounded-full transition-all ${
                darkMode ? "bg-gray-600" : "bg-gray-300"
              }`}
            />
          </div>

          {/* Header fijo */}
          <div
            className={`px-6 py-4 flex justify-between items-center border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}
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
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contenido scrollable */}
          <div
            className="overflow-y-auto overscroll-contain"
            style={{
              maxHeight: "calc(90vh - 100px)",
              WebkitOverflowScrolling: "touch",
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
