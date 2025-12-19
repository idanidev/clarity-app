import { AnimatePresence, motion } from "framer-motion";
import { Check, Fingerprint, Smartphone, X } from "@/components/icons";
import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";

interface BiometricSetupProps {
  onClose: () => void;
  userEmail: string;
  userId: string;
}

const BiometricSetup = ({
  onClose,
  userEmail,
  userId,
}: BiometricSetupProps) => {
  const { registerBiometric, biometricAvailable } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!biometricAvailable) return null;

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      await registerBiometric(userId, userEmail);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error configurando biometría:", err);
      setError(
        "No se pudo configurar la autenticación biométrica. Asegúrate de tener configurado Face ID, Touch ID o huella dactilar en tu dispositivo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              {success ? (
                <Check className="w-6 h-6 text-white" />
              ) : (
                <Fingerprint className="w-6 h-6 text-white" />
              )}
            </div>
            {!success && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {!success ? (
            <>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Habilitar acceso rápido
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Activa Face ID, Touch ID o huella dactilar para iniciar sesión
                más rápido y de forma segura.
              </p>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-purple-900 dark:text-purple-200">
                    <p className="font-medium mb-1">¿Cómo funciona?</p>
                    <p className="text-purple-700 dark:text-purple-300">
                      Tu dispositivo guardará tu biometría de forma segura.
                      Nunca se envía a nuestros servidores.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
                  <p className="text-xs text-red-700 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors font-medium"
                >
                  Ahora no
                </button>
                <button
                  onClick={handleSetup}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? "Configurando..." : "Activar"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Configurado!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ya puedes usar tu biometría para iniciar sesión
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BiometricSetup;
