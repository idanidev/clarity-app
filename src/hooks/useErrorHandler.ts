import { useState, useCallback } from 'react';

/**
 * Hook para manejar errores asíncronos fuera del ciclo de render
 * Lanza el error para que sea capturado por el Error Boundary más cercano
 * 
 * @example
 * const { handleError } = useErrorHandler();
 * 
 * try {
 *   await fetchData();
 * } catch (error) {
 *   handleError(error); // Trigger error boundary
 * }
 */
export const useErrorHandler = () => {
    const [error, setError] = useState<Error | null>(null);

    const handleError = useCallback((error: Error | unknown) => {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
    }, []);

    const resetError = useCallback(() => {
        setError(null);
    }, []);

    // Throw error to trigger error boundary
    if (error) {
        throw error;
    }

    return { handleError, resetError };
};
