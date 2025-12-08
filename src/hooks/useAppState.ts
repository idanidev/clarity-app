import { useEffect, useState } from 'react';
import { App, AppState } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export type AppStateType = 'active' | 'background' | 'inactive';

/**
 * Hook para detectar cuando la app va a background/foreground
 * Útil para refrescar datos cuando la app vuelve al foreground
 */
export const useAppState = (onForeground?: () => void, onBackground?: () => void) => {
  const [appState, setAppState] = useState<AppStateType>('active');

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // En web, usar la API de visibility
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          setAppState('active');
          onForeground?.();
        } else {
          setAppState('background');
          onBackground?.();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    // En nativo, usar el plugin de App
    const listener = App.addListener('appStateChange', (state: AppState) => {
      if (state.isActive) {
        setAppState('active');
        onForeground?.();
      } else {
        setAppState('background');
        onBackground?.();
      }
    });

    // También escuchar cuando la app vuelve al foreground
    const resumeListener = App.addListener('appStateChange', (state: AppState) => {
      if (state.isActive) {
        onForeground?.();
      }
    });

    return () => {
      listener.remove();
      resumeListener.remove();
    };
  }, [onForeground, onBackground]);

  return appState;
};

