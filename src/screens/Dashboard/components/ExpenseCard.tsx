import { memo, useState, useCallback, useRef, TouchEvent } from "react";
import {
  Heart,
  Dumbbell,
  Gamepad2,
  Repeat,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Home,
  Calendar,
  Edit2,
  Trash2,
  Wallet,
  LucideIcon,
} from "@/components/icons";
import { formatCurrency } from "../../../utils/currency";
import { formatDate } from "../../../utils/date";
import type { Expense } from "../../../types";
import { useHaptics } from "../../../hooks/useHaptics";

const categoryIcons: Record<string, LucideIcon> = {
  Salud: Heart,
  Gimnasio: Dumbbell,
  Ocio: Gamepad2,
  Suscripciones: Repeat,
  Comida: UtensilsCrossed,
  Transporte: Car,
  Compras: ShoppingBag,
  Hogar: Home,
  "Coche/Moto": Car,
  Alimentacion: UtensilsCrossed,
  Educacion: Repeat,
};

type PaymentMethod = 'Tarjeta' | 'Efectivo' | 'Transferencia' | 'Bizum';

interface PaymentStyle {
  bg: string;
  border: string;
  text: string;
  bgLight: string;
  borderLight: string;
  textLight: string;
}

const paymentStyles: Record<PaymentMethod, PaymentStyle> = {
  Tarjeta: {
    bg: "bg-blue-500/20",
    border: "border-blue-400/30",
    text: "text-blue-200",
    bgLight: "bg-blue-100",
    borderLight: "border-blue-300",
    textLight: "text-blue-700",
  },
  Efectivo: {
    bg: "bg-green-500/20",
    border: "border-green-400/30",
    text: "text-green-200",
    bgLight: "bg-green-100",
    borderLight: "border-green-300",
    textLight: "text-green-700",
  },
  Transferencia: {
    bg: "bg-purple-500/20",
    border: "border-purple-400/30",
    text: "text-purple-200",
    bgLight: "bg-purple-100",
    borderLight: "border-purple-300",
    textLight: "text-purple-700",
  },
  Bizum: {
    bg: "bg-pink-500/20",
    border: "border-pink-400/30",
    text: "text-pink-200",
    bgLight: "bg-pink-100",
    borderLight: "border-pink-300",
    textLight: "text-pink-700",
  },
};

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  darkMode: boolean;
  isMobile?: boolean;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

const ExpenseCard = memo(({ expense, onEdit, onDelete, darkMode, isMobile = false }: ExpenseCardProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { lightImpact, mediumImpact } = useHaptics();
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentTranslate = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const CategoryIcon = categoryIcons[expense.category] || Wallet;
  const paymentMethod = (expense.paymentMethod || 'Tarjeta') as PaymentMethod;
  const paymentStyle = paymentStyles[paymentMethod] || paymentStyles.Tarjeta;

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    e.stopPropagation();
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    currentTranslate.current = translateX;
    isDragging.current = true;
    isHorizontalSwipe.current = null;
    setIsTransitioning(false);
  }, [isMobile, translateX]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!isMobile || !isDragging.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    
    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }
    
    // Only handle horizontal swipes
    if (!isHorizontalSwipe.current) return;
    
    // Prevent vertical scroll during horizontal swipe
    e.preventDefault();
    
    let newTranslate = currentTranslate.current + deltaX;
    
    // Apply resistance at edges
    if (newTranslate > 0) {
      newTranslate = newTranslate * 0.3; // Resistance when swiping right from closed
    } else if (newTranslate < -ACTION_WIDTH) {
      newTranslate = -ACTION_WIDTH + (newTranslate + ACTION_WIDTH) * 0.3; // Resistance past delete button
    }
    
    setTranslateX(newTranslate);
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !isDragging.current) return;
    isDragging.current = false;
    setIsTransitioning(true);
    
    // Snap to positions
    if (translateX < -SWIPE_THRESHOLD) {
      // Show delete action
      lightImpact();
      setTranslateX(-ACTION_WIDTH);
    } else {
      // Close
      setTranslateX(0);
    }
    
    isHorizontalSwipe.current = null;
  }, [isMobile, translateX, lightImpact]);

  const handleEdit = useCallback(() => {
    mediumImpact();
    setIsTransitioning(true);
    setTranslateX(0);
    setTimeout(() => onEdit?.(expense), 200);
  }, [expense, onEdit, mediumImpact]);

  const handleDelete = useCallback(() => {
    mediumImpact();
    setIsTransitioning(true);
    setTranslateX(0);
    setTimeout(() => onDelete?.(expense), 200);
  }, [expense, onDelete, mediumImpact]);

  const closeSwipe = useCallback(() => {
    if (translateX !== 0) {
      setIsTransitioning(true);
      setTranslateX(0);
    }
  }, [translateX]);

  return (
    <div 
      className="relative overflow-hidden rounded-lg sm:rounded-xl"
      style={{ touchAction: 'pan-y pinch-zoom' }}
    >
      {/* Delete action button (behind card) */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-600"
        style={{ width: ACTION_WIDTH }}
      >
        <button
          onClick={handleDelete}
          className="flex flex-col items-center justify-center w-full h-full"
        >
          <Trash2 className="w-6 h-6 text-white" />
          <span className="text-xs text-white font-medium mt-1">Eliminar</span>
        </button>
      </div>

      {/* Main card - slides over action */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={closeSwipe}
        className={`relative p-2.5 sm:p-3
          ${darkMode 
            ? "bg-gray-800 border border-gray-700/50" 
            : "bg-white border border-purple-100/80 shadow-sm"
          }
          ${expense.recurring || expense.isRecurring ? "border-l-4 border-l-purple-500" : ""}
        `}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1 min-w-0">
            {/* Nombre del gasto y subcategoría */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <CategoryIcon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0 ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`} />
              {expense.name && (
                <h4 className={`text-sm sm:text-base font-semibold truncate ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                  {expense.name}
                </h4>
              )}
              {expense.subcategory && expense.name && expense.subcategory !== expense.name && (
                <span className="text-gray-500 text-xs">•</span>
              )}
              {expense.subcategory && (
                <span className={`text-sm sm:text-base font-medium ${
                  darkMode ? "text-purple-300" : "text-purple-600"
                }`}>
                  {expense.subcategory}
                </span>
              )}
              {!expense.subcategory && !expense.name && (
                <h4 className={`text-xs sm:text-sm font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                  Gasto sin nombre
                </h4>
              )}
            </div>

            {/* Date and payment method */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs text-gray-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {formatDate(expense.date)}
              </span>
              <span className={`text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full border flex-shrink-0 font-medium ${
                darkMode 
                  ? `${paymentStyle.bg} ${paymentStyle.border} ${paymentStyle.text}`
                  : `${paymentStyle.bgLight} ${paymentStyle.borderLight} ${paymentStyle.textLight}`
              }`}>
                {expense.paymentMethod || "Tarjeta"}
              </span>
              {(expense.recurring || expense.isRecurring) && (
                <span className={`text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full border flex-shrink-0 font-medium ${
                  darkMode
                    ? "bg-purple-500/20 border-purple-400/30 text-purple-200"
                    : "bg-purple-100 border-purple-300 text-purple-700"
                }`}>
                  Recurrente
                </span>
              )}
            </div>
          </div>

          {/* Amount and actions */}
          <div className="flex flex-col items-end flex-shrink-0">
            <p className={`text-sm sm:text-base font-bold whitespace-nowrap ${
              darkMode ? "text-white" : "text-gray-900"
            }`}>
              {formatCurrency(expense.amount)}
            </p>
            
            {/* Desktop buttons */}
            {!isMobile && (
              <div className="flex gap-1 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-300" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-300" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ExpenseCard.displayName = "ExpenseCard";

export default ExpenseCard;
