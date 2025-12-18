import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export const checkBiometricAvailable = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
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
    await NativeBiometric.verifyIdentity({
      reason: reason,
      title: 'Autenticación Requerida',
      subtitle: 'Ingresa para ver tus finanzas',
      description: reason,
    });
    return true;
  } catch (error) {
    console.log('Biometric auth error:', error);
    return false;
  }
};
