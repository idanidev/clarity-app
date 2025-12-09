// src/components/PermissionsOnboarding.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Bell, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { markPermissionsOnboardingCompleted, markAskLater } from '../services/permissionsService';
import { getTransition } from '../config/framerMotion';

interface PermissionsOnboardingProps {
  userId?: string;
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const PermissionsOnboarding = ({
  userId,
  visible,
  onComplete,
  onSkip,
}: PermissionsOnboardingProps) => {
  const { microphone, notifications, requestAllPermissions } = usePermissions(userId);
  const [currentStep, setCurrentStep] = useState<'intro' | 'microphone' | 'notifications' | 'complete'>('intro');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestedPermissions, setRequestedPermissions] = useState<{
    microphone: boolean;
    notifications: boolean;
  }>({ microphone: false, notifications: false });
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSkip = async () => {
    if (userId) {
      await markAskLater(userId);
    }
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    onSkip();
  };

  const handleComplete = async () => {
    if (userId) {
      await markPermissionsOnboardingCompleted(userId);
    }
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    onComplete();
  };

  // Reset step cuando se muestra
  useEffect(() => {
    if (visible) {
      setCurrentStep('intro');
      setRequestedPermissions({ microphone: false, notifications: false });
      
      // Auto-close después de 30 segundos si no interactúa
      const timer = setTimeout(() => {
        handleSkip();
      }, 30000);
      setAutoCloseTimer(timer);
    } else {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        setAutoCloseTimer(null);
      }
    }
    
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [visible, userId]);

  const handleRequestAll = async () => {
    setIsRequesting(true);
    try {
      const results = await requestAllPermissions(userId);
      setRequestedPermissions(results);
      
      // Avanzar a la pantalla de resumen
      setCurrentStep('complete');
    } catch (error) {
      console.error('Error requesting permissions:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRequestMicrophone = async () => {
    setIsRequesting(true);
    try {
      const granted = await microphone.request();
      setRequestedPermissions(prev => ({ ...prev, microphone: granted }));
      setCurrentStep('notifications');
    } catch (error) {
      console.error('Error requesting microphone:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRequestNotifications = async () => {
    setIsRequesting(true);
    try {
      const granted = await notifications.request(userId);
      setRequestedPermissions(prev => ({ ...prev, notifications: granted }));
      setCurrentStep('complete');
    } catch (error) {
      console.error('Error requesting notifications:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={getTransition('fast')}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleSkip}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={getTransition('smooth')}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Permisos de la App
          </h2>
          <button
            onClick={handleSkip}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {currentStep === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Mejora tu experiencia
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Clarity puede funcionar mejor con algunos permisos. Te explicamos para qué sirve cada uno.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Micrófono
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Agrega gastos por voz de forma rápida y natural
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <Bell className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Notificaciones
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Recibe alertas de presupuestos y recordatorios importantes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-xl transition-colors"
                  >
                    Más tarde
                  </button>
                  <button
                    onClick={handleRequestAll}
                    disabled={isRequesting}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRequesting ? 'Solicitando...' : 'Permitir todo'}
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'microphone' && (
              <motion.div
                key="microphone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Permiso de Micrófono
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Con este permiso puedes agregar gastos hablando. Di cosas como:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      💡 "20 euros en supermercado"
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      💡 "50 en gasolina y 15 en café"
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep('notifications')}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-xl transition-colors"
                  >
                    Omitir
                  </button>
                  <button
                    onClick={handleRequestMicrophone}
                    disabled={isRequesting}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRequesting ? 'Solicitando...' : 'Permitir'}
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Permiso de Notificaciones
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Recibe alertas cuando:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      📊 Superes el 80% de tu presupuesto
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      🔔 Tengas recordatorios de gastos recurrentes
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      🎯 Alcances tus metas financieras
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleComplete}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-xl transition-colors"
                  >
                    Omitir
                  </button>
                  <button
                    onClick={handleRequestNotifications}
                    disabled={isRequesting}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRequesting ? 'Solicitando...' : 'Permitir'}
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    ¡Listo!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Permisos configurados:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">Micrófono</span>
                      </div>
                      {requestedPermissions.microphone ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">Notificaciones</span>
                      </div>
                      {requestedPermissions.notifications ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
                >
                  Continuar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PermissionsOnboarding;

