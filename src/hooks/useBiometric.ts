import { useState, useCallback, useEffect } from 'react';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

interface BiometricState {
    isAvailable: boolean;
    biometryType: BiometryType | null;
    isAuthenticated: boolean;
    isEnabled: boolean;
    error: string | null;
}

const BIOMETRIC_ENABLED_KEY = 'clarity_biometric_enabled';

/**
 * Hook para autenticación biométrica (Face ID / Fingerprint)
 * 
 * @example
 * const { authenticate, isAvailable, biometryType } = useBiometric();
 * 
 * if (isAvailable) {
 *   const success = await authenticate();
 *   if (success) {
 *     // Usuario autenticado
 *   }
 * }
 */
export const useBiometric = () => {
    const [state, setState] = useState<BiometricState>({
        isAvailable: false,
        biometryType: null,
        isAuthenticated: false,
        isEnabled: false,
        error: null,
    });

    // Verificar disponibilidad al montar
    useEffect(() => {
        checkAvailability();
        loadEnabledState();
    }, []);

    const loadEnabledState = useCallback(() => {
        try {
            const enabled = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
            setState(prev => ({ ...prev, isEnabled: enabled }));
        } catch (e) {
            // Ignore
        }
    }, []);

    const checkAvailability = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) {
            setState(prev => ({ ...prev, isAvailable: false }));
            return false;
        }

        try {
            const result = await NativeBiometric.isAvailable();
            setState(prev => ({
                ...prev,
                isAvailable: result.isAvailable,
                biometryType: result.biometryType,
            }));
            return result.isAvailable;
        } catch (error) {
            setState(prev => ({
                ...prev,
                isAvailable: false,
                error: 'Error checking biometric availability',
            }));
            return false;
        }
    }, []);

    /**
     * Autenticar con biometría
     */
    const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
        if (!Capacitor.isNativePlatform()) {
            return true; // En web, permitir acceso
        }

        try {
            await NativeBiometric.verifyIdentity({
                reason: reason || 'Desbloquea Clarity',
                title: 'Autenticación requerida',
                subtitle: 'Usa tu biometría para continuar',
                description: 'Verifica tu identidad para acceder a tus datos financieros',
            });

            setState(prev => ({ ...prev, isAuthenticated: true, error: null }));
            return true;
        } catch (error: any) {
            const errorMessage = error?.message || 'Authentication failed';
            setState(prev => ({
                ...prev,
                isAuthenticated: false,
                error: errorMessage
            }));
            return false;
        }
    }, []);

    /**
     * Habilitar/deshabilitar biometría para la app
     */
    const setEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
        if (enabled) {
            // Verificar que funciona antes de habilitar
            const success = await authenticate('Confirma tu biometría para activar');
            if (!success) return false;
        }

        try {
            localStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
            setState(prev => ({ ...prev, isEnabled: enabled }));
            return true;
        } catch (e) {
            return false;
        }
    }, [authenticate]);

    /**
     * Obtener nombre legible del tipo de biometría
     */
    const getBiometryName = useCallback((): string => {
        switch (state.biometryType) {
            case BiometryType.FACE_ID:
                return 'Face ID';
            case BiometryType.TOUCH_ID:
                return 'Touch ID';
            case BiometryType.FINGERPRINT:
                return 'Huella digital';
            case BiometryType.FACE_AUTHENTICATION:
                return 'Reconocimiento facial';
            case BiometryType.IRIS_AUTHENTICATION:
                return 'Escaneo de iris';
            default:
                return 'Biometría';
        }
    }, [state.biometryType]);

    return {
        ...state,
        authenticate,
        checkAvailability,
        setEnabled,
        getBiometryName,
    };
};

export default useBiometric;
