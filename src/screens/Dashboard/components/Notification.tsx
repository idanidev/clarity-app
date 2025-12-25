import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import { getTransition } from "../../../config/framerMotion";
import type { Notification as NotificationType } from "../../../types/dashboard";

interface NotificationProps {
  notification: NotificationType | null;
  onClose: () => void;
}

const Notification = memo(({ notification, onClose }: NotificationProps) => {
  const intentClasses =
    notification?.type === "success"
      ? "bg-green-500/95 border-green-400"
      : notification?.type === "error"
      ? "bg-red-500/95 border-red-400"
      : "bg-orange-500/95 border-orange-400";

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={getTransition('bounce')}
          className={`fixed top-20 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto z-[9999] px-3 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl backdrop-blur-xl border ${intentClasses} text-white font-medium shadow-2xl max-w-sm sm:max-w-sm mx-auto sm:mx-0`}
          role="status"
          aria-live="polite"
        >
      <div className="flex items-center gap-2 sm:gap-3">
        {notification.type === "success" ? (
          <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
        )}
        <span className="flex-1 text-xs sm:text-sm break-words leading-tight">{notification.message}</span>
        <button
          onClick={onClose}
          className="ml-1 sm:ml-2 p-1 rounded hover:bg-white/20 active:bg-white/30 transition-colors flex-shrink-0 touch-manipulation"
          aria-label="Cerrar notificación"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
});

Notification.displayName = "Notification";

export default Notification;
