// src/components/PermissionsCheck.tsx
import { ReactNode, useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { AlertCircle, Mic, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PermissionsCheckProps {
  permission: 'microphone' | 'notifications';
  fallback?: ReactNode;
  onDenied?: () => void;
  onGranted?: () => void;
  showExplanation?: boolean;
  userId?: string;
  children: ReactNode;
}

const PERMISSION_INFO = {
  microphone: {
    icon: Mic,
    title: 'Permiso de micrófono requerido',
    description: 'Necesitamos acceso al micrófono para que puedas agregar gastos por voz.',
    benefit: 'Agrega gastos rápidamente diciendo "20 euros en supermercado"',
    settingsPath: 'Configuración > Privacidad > Micrófono',
  },
  notifications: {
    icon: Bell,
    title: 'Permiso de notificaciones requerido',
    description: 'Recibe alertas cuando superes tus presupuestos o tengas recordatorios.',
    benefit: 'Mantente al día con tus finanzas sin abrir la app',
    settingsPath: 'Configuración > Notificaciones',
  },
};

export const PermissionsCheck = ({
  permission,
  fallback,
  onDenied,
  onGranted,
  showExplanation = true,
  userId,
  children,
}: PermissionsCheckProps) => {
  const { microphone, notifications } = usePermissions(userId);
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const permissionState = permission === 'microphone' ? microphone : notifications;
  const info = PERMISSION_INFO[permission];
  const Icon = info.icon;

  useEffect(() => {
    if (permissionState.status === 'granted' && onGranted) {
      onGranted();
    } else if (permissionState.status === 'denied' && onDenied) {
      onDenied();
    }
  }, [permissionState.status, onGranted, onDenied]);

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      if (permission === 'microphone') {
        await microphone.request();
      } else {
        await notifications.request(userId);
      }
    } catch (error) {
      console.error(`Error requesting ${permission} permission:`, error);
    } finally {
      setIsRequesting(false);
    }
  };

  // Si tiene permiso, mostrar children
  if (permissionState.status === 'granted') {
    return <>{children}</>;
  }

  // Si está no soportado, mostrar fallback o children
  if (permissionState.status === 'unsupported') {
    return <>{fallback || children}</>;
  }

  // Si está denegado permanentemente, mostrar banner explicativo
  if (permissionState.permanentlyDenied && showExplanation) {
    return (
      <>
        <AnimatePresence>
          {showBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
            >
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      {info.title}
                    </h4>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-3">
                      El permiso fue denegado. Puedes habilitarlo manualmente en la configuración de tu dispositivo.
                    </p>
                    <button
                      onClick={() => setShowBanner(false)}
                      className="text-xs text-yellow-700 dark:text-yellow-300 hover:underline"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {fallback || (
          <div
            className="relative"
            onMouseEnter={() => setShowBanner(true)}
            onMouseLeave={() => setShowBanner(false)}
          >
            {children}
          </div>
        )}
      </>
    );
  }

  // Si está en prompt o denegado (pero no permanentemente), mostrar opción de solicitar
  return (
    <>
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4"
        >
          <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                {info.title}
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                {info.description}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3 font-medium">
                💡 {info.benefit}
              </p>
              <button
                onClick={handleRequest}
                disabled={isRequesting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? 'Solicitando...' : 'Permitir'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
      {fallback || children}
    </>
  );
};

