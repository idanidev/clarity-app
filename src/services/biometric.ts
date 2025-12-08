import { Capacitor } from '@capacitor/core';

// Nota: El plugin oficial de Capacitor para biométrico es @capacitor-community/native-biometric
// Si no está disponible, podemos usar una implementación alternativa o crear una wrapper
// Por ahora, creamos una implementación que verifica disponibilidad y usa la API nativa cuando esté disponible

/**
 * Verifica si la autenticación biométrica está disponible
 * Nota: Requiere instalar @capacitor-community/native-biometric
 */
export const checkBiometricAvailable = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  // Intentar usar el plugin si está disponible
  try {
    // Intentar importar dinámicamente - puede no estar instalado
    const biometricModule = await import('@capacitor-community/native-biometric').catch(() => null);
    if (!biometricModule) {
      return false;
    }
    const { NativeBiometric } = biometricModule;
    const result = await NativeBiometric.checkBiometry();
    return result.isAvailable;
  } catch (error) {
    // Plugin no disponible, retornar false
    console.log('Biometric plugin not available:', error);
    return false;
  }
};

/**
 * Autentica usando Face ID / Touch ID
 * @param reason Razón para la autenticación
 */
export const authenticate = async (reason: string = 'Accede a Clarity'): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    // Intentar importar dinámicamente - puede no estar instalado
    const biometricModule = await import('@capacitor-community/native-biometric').catch(() => null);
    if (!biometricModule) {
      return false;
    }
    const { NativeBiometric } = biometricModule;
    
    await NativeBiometric.verifyIdentity({
      reason,
      title: 'Autenticación biométrica',
      subtitle: 'Usa tu Face ID o Touch ID',
      description: reason,
      negativeButtonText: 'Cancelar',
    });

    return true;
  } catch (error: any) {
    // Error de autenticación (usuario canceló, falló, etc.)
    if (error.message?.includes('cancel') || error.message?.includes('Cancel')) {
      console.log('Biometric authentication cancelled by user');
    } else {
      console.error('Biometric authentication failed:', error);
    }
    return false;
  }
};

/**
 * Obtiene el tipo de biométrico disponible
 */
export const getBiometricType = async (): Promise<'face' | 'fingerprint' | 'none'> => {
  if (!Capacitor.isNativePlatform()) {
    return 'none';
  }

  try {
    // Intentar importar dinámicamente - puede no estar instalado
    const biometricModule = await import('@capacitor-community/native-biometric').catch(() => null);
    if (!biometricModule) {
      return 'none';
    }
    const { NativeBiometric } = biometricModule;
    const result = await NativeBiometric.checkBiometry();
    
    if (result.biometryType === 'faceId') {
      return 'face';
    } else if (result.biometryType === 'touchId' || result.biometryType === 'fingerprint') {
      return 'fingerprint';
    }
    
    return 'none';
  } catch (error) {
    console.log('Biometric plugin not available:', error);
    return 'none';
  }
};

