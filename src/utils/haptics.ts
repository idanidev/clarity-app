import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const runHaptic = async (fn: () => Promise<void>) => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  try {
    await fn();
  } catch (error) {
    console.log('Haptic feedback not available:', error);
  }
};

export const hapticLight = () => 
  runHaptic(() => Haptics.impact({ style: ImpactStyle.Light }));

export const hapticMedium = () => 
  runHaptic(() => Haptics.impact({ style: ImpactStyle.Medium }));

export const hapticHeavy = () => 
  runHaptic(() => Haptics.impact({ style: ImpactStyle.Heavy }));

export const hapticSuccess = () => 
  runHaptic(() => Haptics.notification({ type: NotificationType.Success }));

export const hapticError = () => 
  runHaptic(() => Haptics.notification({ type: NotificationType.Error }));

export const hapticWarning = () => 
  runHaptic(() => Haptics.notification({ type: NotificationType.Warning }));

export const hapticVibrate = (duration: number = 100) => 
  runHaptic(() => Haptics.vibrate({ duration }));
