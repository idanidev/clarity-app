import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook para Pull-to-Refresh nativo
 * Funciona con el scroll container de la app
 */
export const usePullToRefresh = (
    onRefresh: () => Promise<void>,
    enabled: boolean = true
) => {
    const isNative = Capacitor.isNativePlatform();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isPulling = useRef(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled || !isNative) return;

        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        // Solo activar si estamos en el top del scroll
        if (scrollContainer.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, [enabled, isNative]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isPulling.current || !enabled || !isNative) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        // Si pull down > 80px, activar refresh
        if (diff > 80) {
            isPulling.current = false;
            onRefresh();
        }
    }, [enabled, isNative, onRefresh]);

    const handleTouchEnd = useCallback(() => {
        isPulling.current = false;
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !isNative || !enabled) return;

        container.addEventListener('touchstart', handleTouchStart);
        container.addEventListener('touchmove', handleTouchMove);
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, isNative, handleTouchStart, handleTouchMove, handleTouchEnd]);

    return scrollContainerRef;
};
