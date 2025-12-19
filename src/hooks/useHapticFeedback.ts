import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Hook mejorado para Haptic Feedback
 * Proporciona vibraciones táctiles nativas en iOS/Android
 */
export const useHapticFeedback = () => {
    const isNative = Capacitor.isNativePlatform();

    // Impacto ligero - Para interacciones sutiles
    const light = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            // Silenciar errores
        }
    }, [isNative]);

    // Impacto medio - Para acciones estándar
    const medium = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            // Silenciar errores
        }
    }, [isNative]);

    // Impacto fuerte - Para acciones importantes
    const heavy = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {
            // Silenciar errores
        }
    }, [isNative]);

    // Notificación de éxito
    const success = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {
            // Silenciar errores
        }
    }, [isNative]);

    // Notificación de advertencia
    const warning = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Warning });
        } catch (e) {
            // Silenciar errores
        }
    }, [isNative]);

    // Notificación de error
    const error = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch (e) {
            // Silenciar errores
        }
    }, [isNative]);

    // Vibración de selección - Para pickers/sliders
    const selection = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.selectionStart();
            setTimeout(() => Haptics.selectionEnd(), 100);
        } catch (e) {
            // Silenciar errores
        }
    }, [isNative]);

    return {
        light,
        medium,
        heavy,
        success,
        warning,
        error,
        selection,
        isNative,
    };
};
