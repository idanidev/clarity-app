import { memo } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

const Notification = memo(({ notification, onClose }) => {
  if (!notification) {
    return null;
  }

  const intentClasses =
    notification.type === "success"
      ? "bg-green-500/90 border-green-400"
      : notification.type === "error"
      ? "bg-red-500/90 border-red-400"
      : "bg-orange-500/90 border-orange-400";

  return (
    <div
      className={`fixed top-6 right-6 z-[120] px-5 py-3 rounded-xl backdrop-blur-xl border ${intentClasses} text-white font-medium shadow-lg`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {notification.type === "success" ? (
          <Check className="w-5 h-5" />
        ) : (
          <AlertTriangle className="w-5 h-5" />
        )}
        <span>{notification.message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

Notification.displayName = "Notification";

export default Notification;
