import { ErrorInfo, useState } from 'react';
import { AlertTriangle, RefreshCw, Home } from '@/components/icons';
import { motion } from 'framer-motion';

interface Props {
    error: Error | null;
    errorInfo: ErrorInfo | null;
    onReset: () => void;
    level?: 'global' | 'feature' | 'component';
}

const ErrorFallback = ({ error, errorInfo, onReset, level = 'component' }: Props) => {
    const [showDetails, setShowDetails] = useState(false);
    const isDev = import.meta.env.DEV;

    const handleGoHome = () => {
        window.location.href = '/';
    };

    // Full screen for global errors
    if (level === 'global') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full"
                >
                    {/* Glassmorphism card */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                        {/* Animated icon */}
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5 }}
                            className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center"
                        >
                            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </motion.div>

                        {/* Message */}
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                            Oops! Algo salió mal
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                            No te preocupes, tus datos están seguros. Intenta recargar la página.
                        </p>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={onReset}
                                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Intentar de nuevo
                            </button>

                            <button
                                onClick={handleGoHome}
                                className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Home className="w-5 h-5" />
                                Ir al inicio
                            </button>
                        </div>

                        {/* Dev details */}
                        {isDev && error && (
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    {showDetails ? 'Ocultar' : 'Mostrar'} detalles técnicos
                                </button>

                                {showDetails && (
                                    <div className="mt-3 p-4 bg-gray-900 rounded-lg overflow-auto max-h-60">
                                        <pre className="text-xs text-red-400 font-mono">
                                            {error.toString()}
                                            {'\n\n'}
                                            {errorInfo?.componentStack}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    // Card for feature errors
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-red-200 dark:border-red-800"
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Error al cargar este componente
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {error?.message || 'Ha ocurrido un error inesperado'}
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={onReset}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reintentar
                        </button>

                        {isDev && (
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Detalles
                            </button>
                        )}
                    </div>

                    {isDev && showDetails && error && (
                        <div className="mt-4 p-3 bg-gray-900 rounded-lg overflow-auto max-h-40">
                            <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                                {error.toString()}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ErrorFallback;
