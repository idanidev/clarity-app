import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useCallback } from 'react';
import { isNative } from '../utils/platform';

export const useHaptics = () => {

    const lightImpact = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            // Ignore
        }
    }, []);

    const mediumImpact = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            // Ignore
        }
    }, []);

    const heavyImpact = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {
            // Ignore
        }
    }, []);

    const successNotification = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {
            // Ignore
        }
    }, []);

    const errorNotification = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch (e) {
            // Ignore
        }
    }, []);

    const warningNotification = useCallback(async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Warning });
        } catch (e) {
            // Ignore
        }
    }, []);

    return {
        lightImpact,
        mediumImpact,
        heavyImpact,
        successNotification,
        errorNotification,
        warningNotification
    };
};
