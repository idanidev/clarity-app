import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export const useNetworkStatus = () => {
    const [status, setStatus] = useState<{ connected: boolean; connectionType: string }>({
        connected: true,
        connectionType: 'wifi'
    });

    useEffect(() => {
        const initNetworkInfo = async () => {
            try {
                const currentStatus = await Network.getStatus();
                setStatus(currentStatus);
            } catch (e) {
                console.warn('Error getting network status', e);
            }
        };

        initNetworkInfo();

        if (Capacitor.isNativePlatform()) {
            Network.addListener('networkStatusChange', (status) => {
                console.log('Network status changed', status);
                setStatus(status);
            });
        } else {
            // Fallback para web
            const updateOnlineStatus = () => {
                setStatus({
                    connected: navigator.onLine,
                    connectionType: 'wifi' // Desconocido en web estándar
                });
            };

            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);
        }
    }, []);

    return status;
};
