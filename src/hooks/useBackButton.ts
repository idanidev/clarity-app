import { useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

interface UseBackButtonOptions {
    /** Callback when back button is pressed */
    onBackPress?: () => boolean | void;
    /** Priority of this handler (higher = called first) */
    priority?: number;
}

/**
 * Hook para manejar el botón back de Android
 * 
 * @example
 * // En un modal:
 * useBackButton({
 *   onBackPress: () => {
 *     if (isOpen) {
 *       closeModal();
 *       return true; // Prevenir comportamiento por defecto
 *     }
 *     return false; // Permitir comportamiento por defecto
 *   }
 * });
 */
export const useBackButton = (options: UseBackButtonOptions = {}) => {
    const { onBackPress, priority = 0 } = options;

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        if (Capacitor.getPlatform() !== 'android') return;

        const handler = App.addListener('backButton', ({ canGoBack }) => {
            // Si hay handler personalizado, llamarlo primero
            if (onBackPress) {
                const handled = onBackPress();
                if (handled) return; // Si el handler manejó el evento, no hacer nada más
            }

            // Comportamiento por defecto: navegar atrás o cerrar app
            if (canGoBack) {
                window.history.back();
            } else {
                // Minimizar la app en lugar de cerrarla
                App.minimizeApp();
            }
        });

        return () => {
            handler.then(h => h.remove());
        };
    }, [onBackPress, priority]);
};

/**
 * Hook para manejar el back button en modales
 * Cierra el modal cuando se presiona back
 */
export const useModalBackButton = (
    isOpen: boolean,
    onClose: () => void
) => {
    const handleBackPress = useCallback(() => {
        if (isOpen) {
            onClose();
            return true; // Evento manejado
        }
        return false;
    }, [isOpen, onClose]);

    useBackButton({ onBackPress: handleBackPress });
};

/**
 * Función helper para minimizar la app
 */
export const minimizeApp = async () => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        await App.minimizeApp();
    }
};

/**
 * Función helper para cerrar la app
 */
export const exitApp = async () => {
    if (Capacitor.isNativePlatform()) {
        await App.exitApp();
    }
};
