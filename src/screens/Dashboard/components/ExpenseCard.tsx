import { memo, useState, useCallback, useRef, useEffect } from "react";
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
import { MoreVertical } from "lucide-react";
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

// Action Menu Component
interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  darkMode: boolean;
}

const ActionMenu = ({ isOpen, onClose, onEdit, onDelete, darkMode }: ActionMenuProps) => {
  const { mediumImpact } = useHaptics();

  if (!isOpen) return null;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    mediumImpact();
    onEdit();
    onClose();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    mediumImpact();
    onDelete();
    onClose();
  };

  return (
    <>
      {/* Overlay invisible para cerrar al tocar fuera */}
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Menú dropdown */}
      <div
        role="menu"
        className={`
          absolute right-0 top-full mt-1 z-50
          rounded-xl shadow-xl border overflow-hidden
          min-w-[140px]
          ${darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200 shadow-lg'
          }
        `}
      >
        <button
          role="menuitem"
          onClick={handleEdit}
          className={`
            w-full px-4 py-3 flex items-center gap-3 text-left
            transition-colors touch-manipulation
            ${darkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-gray-50 active:bg-gray-100'}
          `}
        >
          <Edit2 className="w-4 h-4 text-blue-500" />
          <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
            Editar
          </span>
        </button>

        <div className={`h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

        <button
          role="menuitem"
          onClick={handleDelete}
          className={`
            w-full px-4 py-3 flex items-center gap-3 text-left
            transition-colors touch-manipulation
            ${darkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-gray-50 active:bg-gray-100'}
          `}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
          <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
            Eliminar
          </span>
        </button>
      </div>
    </>
  );
};

const ExpenseCard = memo(({ expense, onEdit, onDelete, darkMode }: ExpenseCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { lightImpact } = useHaptics();

  const CategoryIcon = categoryIcons[expense.category] || Wallet;
  const paymentMethod = (expense.paymentMethod || 'Tarjeta') as PaymentMethod;
  const paymentStyle = paymentStyles[paymentMethod] || paymentStyles.Tarjeta;

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    lightImpact();
    setMenuOpen(prev => !prev);
  }, [lightImpact]);

  const handleEdit = useCallback(() => {
    onEdit?.(expense);
  }, [expense, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(expense);
  }, [expense, onDelete]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <div
      className={`relative rounded-lg sm:rounded-xl p-2.5 sm:p-3
        ${darkMode
          ? "bg-gray-800 border border-gray-700/50"
          : "bg-white border border-purple-100/80 shadow-sm"
        }
        ${expense.recurring || expense.isRecurring ? "border-l-4 border-l-purple-500" : ""}
      `}
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className={`text-sm sm:text-base font-bold whitespace-nowrap ${
            darkMode ? "text-white" : "text-gray-900"
          }`}>
            {formatCurrency(expense.amount)}
          </p>

          {/* Action menu button - Always visible */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleMenu}
              className={`
                p-2 rounded-lg transition-colors touch-manipulation
                min-w-[44px] min-h-[44px] flex items-center justify-center
                ${darkMode
                  ? 'hover:bg-gray-700 active:bg-gray-600'
                  : 'hover:bg-gray-100 active:bg-gray-200'
                }
              `}
              aria-label="Acciones"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <MoreVertical className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>

            <ActionMenu
              isOpen={menuOpen}
              onClose={closeMenu}
              onEdit={handleEdit}
              onDelete={handleDelete}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

ExpenseCard.displayName = "ExpenseCard";

export default ExpenseCard;
