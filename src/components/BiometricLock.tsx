import React, { useEffect, useState, useCallback } from 'react';
import { Fingerprint, Shield, RefreshCw } from 'lucide-react';
import { useBiometric } from '../../hooks/useBiometric';
import { useHaptics } from '../../hooks/useHaptics';

interface BiometricLockProps {
  onUnlock: () => void;
  darkMode?: boolean;
}

/**
 * Pantalla de bloqueo biométrico
 * Se muestra al abrir la app si la biometría está habilitada
 */
export const BiometricLock: React.FC<BiometricLockProps> = ({
  onUnlock,
  darkMode = false,
}) => {
  const { authenticate, getBiometryName, isAvailable, error } = useBiometric();
  const { successNotification, errorNotification } = useHaptics();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleAuthenticate = useCallback(async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    
    try {
      const success = await authenticate();
      
      if (success) {
        successNotification();
        onUnlock();
      } else {
        errorNotification();
        setAttempts(prev => prev + 1);
      }
    } catch (e) {
      errorNotification();
      setAttempts(prev => prev + 1);
    } finally {
      setIsAuthenticating(false);
    }
  }, [authenticate, onUnlock, successNotification, errorNotification, isAuthenticating]);

  // Intentar autenticar automáticamente al montar
  useEffect(() => {
    if (isAvailable) {
      // Pequeño delay para que la UI se renderice primero
      const timer = setTimeout(() => {
        handleAuthenticate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  const biometryName = getBiometryName();

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center p-6 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' 
          : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Logo/Icon */}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${
        darkMode 
          ? 'bg-purple-600/20 border-2 border-purple-500/30' 
          : 'bg-purple-100 border-2 border-purple-200'
      }`}>
        <Shield className={`w-12 h-12 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
      </div>

      {/* Title */}
      <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Clarity está bloqueada
      </h1>
      
      <p className={`text-center mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Usa {biometryName} para acceder a tus datos
      </p>

      {/* Error message */}
      {error && attempts > 0 && (
        <div className={`mb-6 px-4 py-3 rounded-xl ${
          darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'
        }`}>
          <p className="text-sm text-center">
            {attempts >= 3 
              ? 'Demasiados intentos fallidos. Inténtalo de nuevo.'
              : 'Autenticación fallida. Inténtalo de nuevo.'}
          </p>
        </div>
      )}

      {/* Authenticate button */}
      <button
        onClick={handleAuthenticate}
        disabled={isAuthenticating}
        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all ${
          isAuthenticating
            ? 'opacity-50 cursor-not-allowed'
            : 'active:scale-95'
        } ${
          darkMode
            ? 'bg-purple-600 hover:bg-purple-500 text-white'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {isAuthenticating ? (
          <>
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Verificando...</span>
          </>
        ) : (
          <>
            <Fingerprint className="w-6 h-6" />
            <span>Desbloquear con {biometryName}</span>
          </>
        )}
      </button>

      {/* Skip option after multiple failures */}
      {attempts >= 3 && (
        <button
          onClick={onUnlock}
          className={`mt-6 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
        >
          Continuar sin biometría
        </button>
      )}
    </div>
  );
};

export default BiometricLock;
