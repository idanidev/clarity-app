import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, X } from "lucide-react";

const Notification = memo(({ notification, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!notification || !mounted) {
    return null;
  }

  const intentClasses =
    notification.type === "success"
      ? "bg-green-500/95 border-green-400"
      : notification.type === "error"
      ? "bg-red-500/95 border-red-400"
      : "bg-orange-500/95 border-orange-400";

  const notificationElement = (
    <div
      className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] px-4 py-3 sm:px-5 sm:py-3 rounded-xl backdrop-blur-xl border ${intentClasses} text-white font-medium shadow-2xl max-w-sm animate-in`}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        // Forzar aceleración de hardware en iOS
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        // Asegurar que esté en la capa superior
        willChange: 'transform',
        // Prevenir que se mueva con el scroll en iOS
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        // Asegurar que esté siempre visible
        pointerEvents: 'auto',
      }}
    >
      <div className="flex items-center gap-3">
        {notification.type === "success" ? (
          <Check className="w-5 h-5 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        )}
        <span className="flex-1 text-sm sm:text-base break-words">{notification.message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded hover:bg-white/20 active:bg-white/30 transition-colors flex-shrink-0 touch-manipulation"
          aria-label="Cerrar notificación"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Renderizar usando portal directamente en el body para evitar problemas de z-index en iOS
  return createPortal(notificationElement, document.body);
});

Notification.displayName = "Notification";

export default Notification;
