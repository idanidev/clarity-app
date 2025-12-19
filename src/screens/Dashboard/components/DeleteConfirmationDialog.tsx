import { AlertTriangle, X } from "lucide-react";
import { useDisableBodyScroll } from "../../../hooks/useDisableBodyScroll";

const DeleteConfirmationDialog = ({
  context,
  darkMode,
  cardClass,
  textClass,
  textSecondaryClass,
  onCancel,
  onConfirm,
}) => {
  // Deshabilitar scroll del body cuando el diálogo está abierto
  useDisableBodyScroll(!!context);

  if (!context) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onMouseDown={onCancel}
    >
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-sm w-full border shadow-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 z-10 px-6 py-4 flex justify-between items-center ${
            darkMode
              ? "bg-gray-800/95 border-b border-gray-700"
              : "bg-white/80 border-b border-purple-100"
          } backdrop-blur`}
        >
          <h3 className={`text-xl font-bold ${textClass}`}>
            ¿Estás seguro?
          </h3>
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-5 h-5 ${textClass}`} />
          </button>
        </div>
        
        <div className="px-6 py-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className={`${textSecondaryClass} mb-6`}>
            Esta acción no se puede deshacer
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={`flex-1 py-3 rounded-xl ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              } font-semibold transition-all`}
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(context)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;
