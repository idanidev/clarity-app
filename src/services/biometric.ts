import { Capacitor } from '@capacitor/core';

export const checkBiometricAvailable = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  
  try {
    // TODO: Instalar @capacitor-community/biometric-auth
    // Por ahora retorna false (no bloquea)
    return false;
  } catch (error) {
    console.log('Biometric check error (non-blocking):', error);
    return false;
  }
};

export const authenticate = async (reason: string = 'Accede a Clarity'): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  
  try {
    // TODO: Implementar con @capacitor-community/biometric-auth
    console.log('Biometric auth not implemented yet');
    return false;
  } catch (error) {
    console.log('Biometric auth error:', error);
    return false;
  }
};
