import { useCallback, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface QueuedOperation {
    id: string;
    type: 'add' | 'update' | 'delete';
    collection: string;
    data: any;
    timestamp: number;
    retryCount: number;
}

interface UseOfflineQueueOptions {
    maxRetries?: number;
    onSync?: (operation: QueuedOperation) => Promise<void>;
    onError?: (error: Error, operation: QueuedOperation) => void;
}

const STORAGE_KEY = 'clarity_offline_queue';

/**
 * Hook para manejar operaciones offline con Firestore
 * Almacena operaciones cuando no hay conexión y las sincroniza cuando vuelve
 * 
 * @example
 * const { queueOperation, syncQueue, pendingCount, isSyncing } = useOfflineQueue({
 *   onSync: async (op) => {
 *     if (op.type === 'add') await addDoc(collection, op.data);
 *   }
 * });
 */
export const useOfflineQueue = (options: UseOfflineQueueOptions = {}) => {
    const { maxRetries = 3, onSync, onError } = options;

    const [queue, setQueue] = useState<QueuedOperation[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [isSyncing, setIsSyncing] = useState(false);
    const syncingRef = useRef(false);

    // Persistir cola en localStorage
    const persistQueue = useCallback((newQueue: QueuedOperation[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newQueue));
        } catch (e) {
            console.error('Error persisting queue:', e);
        }
    }, []);

    // Añadir operación a la cola
    const queueOperation = useCallback((
        type: QueuedOperation['type'],
        collection: string,
        data: any
    ) => {
        const operation: QueuedOperation = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            collection,
            data,
            timestamp: Date.now(),
            retryCount: 0,
        };

        setQueue(prev => {
            const newQueue = [...prev, operation];
            persistQueue(newQueue);
            return newQueue;
        });

        return operation.id;
    }, [persistQueue]);

    // Sincronizar cola con servidor
    const syncQueue = useCallback(async () => {
        if (syncingRef.current || queue.length === 0 || !onSync) return;

        syncingRef.current = true;
        setIsSyncing(true);

        const failedOperations: QueuedOperation[] = [];

        for (const operation of queue) {
            try {
                await onSync(operation);
            } catch (error) {
                const newRetryCount = operation.retryCount + 1;

                if (newRetryCount < maxRetries) {
                    failedOperations.push({
                        ...operation,
                        retryCount: newRetryCount,
                    });
                } else {
                    onError?.(error as Error, operation);
                }
            }
        }

        setQueue(failedOperations);
        persistQueue(failedOperations);

        syncingRef.current = false;
        setIsSyncing(false);
    }, [queue, onSync, onError, maxRetries, persistQueue]);

    // Limpiar cola
    const clearQueue = useCallback(() => {
        setQueue([]);
        persistQueue([]);
    }, [persistQueue]);

    // Remover operación específica
    const removeOperation = useCallback((operationId: string) => {
        setQueue(prev => {
            const newQueue = prev.filter(op => op.id !== operationId);
            persistQueue(newQueue);
            return newQueue;
        });
    }, [persistQueue]);

    return {
        queue,
        queueOperation,
        syncQueue,
        clearQueue,
        removeOperation,
        pendingCount: queue.length,
        isSyncing,
    };
};

/**
 * Hook para detectar estado de conexión y sincronizar automáticamente
 */
export const useAutoSync = (
    syncFunction: () => Promise<void>,
    enabled = true
) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useCallback(() => {
        if (!enabled) return;

        const handleOnline = async () => {
            setIsOnline(true);
            // Esperar un momento para asegurar conexión estable
            await new Promise(resolve => setTimeout(resolve, 1000));
            await syncFunction();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Intentar sync inicial si estamos online
        if (navigator.onLine) {
            syncFunction();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncFunction, enabled]);

    return { isOnline };
};
