import { AlertTriangle } from "lucide-react";

const DeleteConfirmationDialog = ({
  context,
  darkMode,
  cardClass,
  textClass,
  textSecondaryClass,
  onCancel,
  onConfirm,
}) => {
  if (!context) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className={`${cardClass} rounded-2xl p-6 max-w-sm w-full border shadow-2xl`}>
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className={`text-xl font-bold ${textClass} mb-2`}>
            ¿Estás seguro?
          </h3>
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
