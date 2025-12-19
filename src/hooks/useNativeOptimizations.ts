import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

/**
 * Hook para configurar la Status Bar según el modo oscuro
 * Automáticamente adapta el color y estilo de la status bar
 */
export const useStatusBar = (darkMode: boolean) => {
    useEffect(() => {
        const setupStatusBar = async () => {
            // Solo en plataformas nativas (iOS/Android)
            if (!Capacitor.isNativePlatform()) return;

            try {
                // Configurar estilo según modo
                await StatusBar.setStyle({
                    style: darkMode ? Style.Dark : Style.Light,
                });

                // Color de fondo de la status bar
                await StatusBar.setBackgroundColor({
                    color: darkMode ? '#0f172a' : '#ffffff',
                });

                // Overlay para que el contenido pase por debajo (iOS)
                if (Capacitor.getPlatform() === 'ios') {
                    await StatusBar.setOverlaysWebView({ overlay: true });
                }
            } catch (error) {
                console.error('Error configurando Status Bar:', error);
            }
        };

        setupStatusBar();
    }, [darkMode]);
};

/**
 * Hook para manejar Safe Area Insets (notch, isla dinámica, etc.)
 */
export const useSafeArea = () => {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // Añadir variables CSS para safe areas
        const updateSafeAreas = () => {
            const safeAreaTop = getComputedStyle(document.documentElement)
                .getPropertyValue('--safe-area-inset-top') || '0px';
            const safeAreaBottom = getComputedStyle(document.documentElement)
                .getPropertyValue('--safe-area-inset-bottom') || '0px';

            document.documentElement.style.setProperty('--status-bar-height', safeAreaTop);
            document.documentElement.style.setProperty('--bottom-safe-area', safeAreaBottom);
        };

        updateSafeAreas();
        window.addEventListener('resize', updateSafeAreas);

        return () => window.removeEventListener('resize', updateSafeAreas);
    }, []);
};
