// ============================================
// BottomSheet.tsx - Modal adaptativo móvil/desktop
// iOS/Android-style bottom sheet en móvil, modal centrado en desktop
// ============================================
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { getTransition } from "../config/framerMotion";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  darkMode: boolean;
  showDragHandle?: boolean;
  maxHeight?: string;
  className?: string;
}

const isNative = Capacitor.isNativePlatform();

const BottomSheet = ({
  visible,
  onClose,
  title,
  children,
  darkMode,
  showDragHandle = true,
  maxHeight = "90vh",
  className = "",
}: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  // Dismiss keyboard on backdrop tap (iOS)
  useEffect(() => {
    if (!visible) return;

    const handleTap = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("backdrop")) {
        document.activeElement?.blur();
      }
    };

    document.addEventListener("touchend", handleTap);
    return () => document.removeEventListener("touchend", handleTap);
  }, [visible]);

  // Swipe to dismiss (móvil)
  useEffect(() => {
    if (!visible || !sheetRef.current) return;

    const sheet = sheetRef.current;
    let startYPos = 0;
    let currentYPos = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startYPos = e.touches[0].clientY;
      isDragging.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      currentYPos = e.touches[0].clientY;
      const deltaY = currentYPos - startYPos;

      if (deltaY > 0) {
        sheet.style.transform = `translateY(${deltaY}px)`;
        sheet.style.opacity = `${Math.max(0, 1 - deltaY / 200)}`;
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const deltaY = currentYPos - startYPos;
      if (deltaY > 100) {
        // Swipe down suficiente para cerrar
        if (isNative) {
          try {
            await Haptics.impact({ style: ImpactStyle.Medium });
          } catch {}
        }
        onClose();
      } else {
        // Reset position
        sheet.style.transform = "";
        sheet.style.opacity = "";
      }
    };

    sheet.addEventListener("touchstart", handleTouchStart);
    sheet.addEventListener("touchmove", handleTouchMove);
    sheet.addEventListener("touchend", handleTouchEnd);

    return () => {
      sheet.removeEventListener("touchstart", handleTouchStart);
      sheet.removeEventListener("touchmove", handleTouchMove);
      sheet.removeEventListener("touchend", handleTouchEnd);
    };
  }, [visible, onClose]);

  // ESC key to close
  useEffect(() => {
    if (!visible) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [visible, onClose]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={getTransition("fast")}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 backdrop"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={
              isMobile
                ? { y: "100%", opacity: 0 }
                : { scale: 0.95, opacity: 0 }
            }
            animate={
              isMobile
                ? { y: 0, opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            exit={
              isMobile
                ? { y: "100%", opacity: 0 }
                : { scale: 0.95, opacity: 0 }
            }
            transition={getTransition("modal")}
            className={`
              fixed z-50
              ${isMobile ? "bottom-0 inset-x-0 rounded-t-2xl" : "inset-0 m-auto max-w-md max-h-[90vh] rounded-2xl"}
              ${darkMode ? "bg-gray-900" : "bg-white"}
              shadow-2xl
              pb-safe
              ${className}
            `}
            style={{
              maxHeight: isMobile ? maxHeight : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle (solo móvil) */}
            {isMobile && showDragHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div
                  className={`w-12 h-1 rounded-full ${
                    darkMode ? "bg-gray-700" : "bg-gray-300"
                  }`}
                />
              </div>
            )}

            {/* Header */}
            {(title || !isMobile) && (
              <div
                className={`sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center border-b ${
                  darkMode
                    ? "bg-gray-900/95 border-gray-700"
                    : "bg-white/95 border-gray-200"
                } backdrop-blur`}
              >
                {title && (
                  <h3
                    className={`text-lg sm:text-xl font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {title}
                  </h3>
                )}
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                    darkMode
                      ? "hover:bg-gray-800 text-gray-300"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                  title="Cerrar"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            )}

            {/* Content */}
            <div
              className={`overflow-y-auto ${
                isMobile ? "px-4 pb-6" : "px-6 py-6"
              }`}
              style={{
                maxHeight: isMobile
                  ? `calc(${maxHeight} - 80px)`
                  : "calc(90vh - 100px)",
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;

