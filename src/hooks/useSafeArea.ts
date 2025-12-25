import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Hook para obtener los safe area insets
 * Especialmente útil para iOS con notch/Dynamic Island
 * También funciona en Android con cutouts
 */
export const useSafeAreaInsets = (): SafeAreaInsets => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);

      // Obtener valores de env() CSS
      const top = parseInt(style.getPropertyValue('--sat') || '0', 10) ||
        parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10);
      const bottom = parseInt(style.getPropertyValue('--sab') || '0', 10) ||
        parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10);
      const left = parseInt(style.getPropertyValue('--sal') || '0', 10) ||
        parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10);
      const right = parseInt(style.getPropertyValue('--sar') || '0', 10) ||
        parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10);

      // Valores por defecto para iOS si no se detectan
      if (Capacitor.getPlatform() === 'ios') {
        setInsets({
          top: top || 47, // iPhone notch default
          bottom: bottom || 34, // Home indicator default
          left: left || 0,
          right: right || 0,
        });
      } else {
        setInsets({ top, bottom, left, right });
      }
    };

    // Actualizar inmediatamente
    updateInsets();

    // Actualizar en resize (rotación de dispositivo)
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
    };
  }, []);

  return insets;
};

/**
 * Hook para aplicar CSS custom properties de safe area
 * Útil para componentes que necesitan padding dinámico
 */
export const useApplySafeAreaCSS = () => {
  useEffect(() => {
    // Aplicar variables CSS para safe areas
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --sat: env(safe-area-inset-top);
        --sab: env(safe-area-inset-bottom);
        --sal: env(safe-area-inset-left);
        --sar: env(safe-area-inset-right);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
};

/**
 * Estilos inline helper para safe areas
 */
export const safeAreaStyles = {
  paddingTop: 'env(safe-area-inset-top)',
  paddingBottom: 'env(safe-area-inset-bottom)',
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)',
};

// Re-export useStatusBar from useNativeOptimizations for backwards compatibility
export { useStatusBar } from './useNativeOptimizations';
