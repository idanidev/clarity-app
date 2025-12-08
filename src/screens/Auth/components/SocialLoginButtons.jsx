// src/screens/Auth/components/SocialLoginButtons.jsx
import { motion } from "framer-motion";
import { Fingerprint } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";

const SocialLoginButtons = ({ onBiometricSuccess }) => {
  const {
    signInWithGoogle,
    signInWithBiometric,
    biometricAvailable,
    hasBiometricCredentials,
    loading,
  } = useAuth();

  const [socialLoading, setSocialLoading] = useState(null);
  const showBiometric = biometricAvailable && hasBiometricCredentials();

  const handleGoogleLogin = async () => {
    setSocialLoading("google");
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error con Google login:", error);
      alert("No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
    } finally {
      setSocialLoading(null);
    }
  };

  const handleBiometricLogin = async () => {
    setSocialLoading("biometric");
    try {
      const result = await signInWithBiometric();
      if (result.success && onBiometricSuccess) {
        onBiometricSuccess(result.email);
      }
    } catch (error) {
      console.error("Error con biometric login:", error);
      alert(
        "No se pudo autenticar con biometría. Por favor, inicia sesión normalmente."
      );
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Botón de biometría (solo si está disponible y configurado) */}
      {showBiometric && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleBiometricLogin}
          disabled={loading || socialLoading !== null}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {socialLoading === "biometric" ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              Autenticando...
            </>
          ) : (
            <>
              <Fingerprint className="w-5 h-5" />
              <span className="font-medium">Usar Face ID / Huella</span>
            </>
          )}
        </motion.button>
      )}

      {/* Google */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading || socialLoading !== null}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {socialLoading === "google" ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-gray-300 border-t-purple-600 rounded-full"
            />
            Conectando...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Continuar con Google
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default SocialLoginButtons;










