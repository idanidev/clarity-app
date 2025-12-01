import { memo, useState } from "react";
import { useSwipeable } from "react-swipeable";
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
  CreditCard,
  Wallet,
} from "lucide-react";

const categoryIcons = {
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

const paymentStyles = {
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

const ExpenseCard = memo(({ expense, onEdit, onDelete, darkMode, isMobile = false }) => {
  const [showActions, setShowActions] = useState("none");
  const [swipeOffset, setSwipeOffset] = useState(0);

  const CategoryIcon = categoryIcons[expense.category] || Wallet;
  const paymentStyle = paymentStyles[expense.paymentMethod] || paymentStyles.Tarjeta;

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile) {
        setShowActions("delete");
        setSwipeOffset(0);
      }
    },
    onSwipedRight: () => {
      if (isMobile) {
        setShowActions("edit");
        setSwipeOffset(0);
      }
    },
    onSwiping: (eventData) => {
      if (isMobile && Math.abs(eventData.deltaX) > 10) {
        setSwipeOffset(eventData.deltaX);
      }
    },
    onSwiped: () => {
      setSwipeOffset(0);
    },
    trackMouse: false,
    delta: 30,
    preventScrollOnSwipe: true,
    touchEventOptions: { passive: false },
  });

  const handleActionClick = (action) => {
    setShowActions("none");
    if (action === "edit" && onEdit) {
      onEdit(expense);
    } else if (action === "delete" && onDelete) {
      onDelete(expense);
    }
  };

  // Cerrar acciones de swipe al hacer click fuera
  const handleCardClick = (e) => {
    if (isMobile && showActions !== "none" && !e.target.closest('button')) {
      setShowActions("none");
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons (mobile swipe) - más visibles */}
      {isMobile && (
        <>
          <div
            className={`absolute left-0 top-0 bottom-0 w-24 flex items-center justify-center transition-transform duration-300 z-10 ${
              showActions === "edit" ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              onClick={() => handleActionClick("edit")}
              className="w-full h-full bg-blue-600 flex items-center justify-center shadow-lg"
            >
              <div className="flex flex-col items-center gap-1">
                <Edit2 className="w-7 h-7 text-white" />
                <span className="text-xs text-white font-medium">Editar</span>
              </div>
            </button>
          </div>
          <div
            className={`absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center transition-transform duration-300 z-10 ${
              showActions === "delete" ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <button
              onClick={() => handleActionClick("delete")}
              className="w-full h-full bg-red-600 flex items-center justify-center shadow-lg"
            >
              <div className="flex flex-col items-center gap-1">
                <Trash2 className="w-7 h-7 text-white" />
                <span className="text-xs text-white font-medium">Eliminar</span>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Main card - más visual y cómoda */}
      <div
        {...handlers}
        onClick={handleCardClick}
        className={`relative rounded-lg sm:rounded-xl p-2.5 sm:p-3
          ${darkMode 
            ? "bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60" 
            : "bg-white border border-purple-100/80 hover:bg-purple-50/50 shadow-sm"
          }
          transition-all duration-300
          hover:-translate-y-0.5
          hover:shadow-md
          active:scale-[0.98]
          ${expense.recurring || expense.isRecurring ? "border-l-4 border-l-purple-500" : ""}
          ${showActions !== "none" ? "bg-purple-500/10 border-purple-500/30 shadow-lg" : ""}
          ${isMobile ? "cursor-grab active:cursor-grabbing" : ""}
        `}
        style={{
          transform: isMobile && swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
        }}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1 min-w-0">
            {/* Nombre del gasto y subcategoría separados */}
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

            {/* Date and payment method - más compacto */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs text-gray-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {new Date(expense.date).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })}
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

          {/* Amount - más pequeño en móvil */}
          <div className="flex flex-col items-end flex-shrink-0">
            <p className={`text-sm sm:text-base font-bold whitespace-nowrap ${
              darkMode ? "text-white" : "text-gray-900"
            }`}>
              €{expense.amount.toFixed(2)}
            </p>
            
            {/* Botones solo en desktop, en móvil se usa swipe */}
            {!isMobile && (
              <div className="flex gap-1 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit(expense);
                  }}
                  className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-300" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete && onDelete(expense);
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
