import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Hook para obtener los insets de safe area (notch, home indicator, etc.)
 * En web, retorna valores por defecto basados en CSS env()
 */
export const useSafeArea = (): SafeAreaInsets => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // En web, usar CSS env() variables si están disponibles
      // Por defecto, usar valores comunes de iPhone
      const top = typeof window !== 'undefined' 
        ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0', 10) || 44
        : 44;
      const bottom = typeof window !== 'undefined'
        ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0', 10) || 34
        : 34;

      setInsets({
        top,
        bottom,
        left: 0,
        right: 0,
      });
      return;
    }

    // En iOS nativo, los insets se manejan automáticamente con contentInset: 'automatic'
    // Pero podemos obtener valores aproximados
    if (Capacitor.getPlatform() === 'ios') {
      // Valores típicos de iPhone con notch
      setInsets({
        top: 44, // Status bar + notch
        bottom: 34, // Home indicator
        left: 0,
        right: 0,
      });
    }
  }, []);

  return insets;
};

/**
 * Configura el StatusBar según el modo oscuro/claro
 */
export const useStatusBar = (darkMode: boolean) => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const configureStatusBar = async () => {
      try {
        await StatusBar.setStyle({
          style: darkMode ? Style.Dark : Style.Light,
        });
        await StatusBar.setBackgroundColor({
          color: darkMode ? '#1F2937' : '#FFFFFF',
        });
      } catch (error) {
        console.error('Error configuring status bar:', error);
      }
    };

    configureStatusBar();
  }, [darkMode]);
};

