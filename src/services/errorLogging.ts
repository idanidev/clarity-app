import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';

interface ErrorContext {
    componentStack?: string;
    level?: 'global' | 'feature' | 'component';
    userId?: string;
    route?: string;
    [key: string]: any;
}

// Rate limiting: max 10 errors per minute
const errorLog: number[] = [];
const MAX_ERRORS_PER_MINUTE = 10;

export const logError = (error: Error, context: ErrorContext = {}) => {
    // Rate limiting
    const now = Date.now();
    errorLog.push(now);

    // Remove errors older than 1 minute
    while (errorLog.length > 0 && errorLog[0] < now - 60000) {
        errorLog.shift();
    }

    if (errorLog.length > MAX_ERRORS_PER_MINUTE) {
        console.warn('Error logging rate limit exceeded');
        return;
    }

    // Log to console in development
    if (import.meta.env.DEV) {
        console.error('Error caught by boundary:', error);
        console.error('Context:', context);
    }

    // Log to Firebase Analytics in production
    if (import.meta.env.PROD && analytics) {
        try {
            logEvent(analytics, 'error', {
                error_message: error.message,
                error_name: error.name,
                error_stack: error.stack?.substring(0, 500), // Limit stack trace
                level: context.level || 'unknown',
                route: window.location.pathname,
                timestamp: new Date().toISOString(),
                ...context,
            });
        } catch (loggingError) {
            console.error('Failed to log error to Analytics:', loggingError);
        }
    }
};

export const logWarning = (message: string, context: Record<string, any> = {}) => {
    if (import.meta.env.DEV) {
        console.warn(message, context);
    }

    if (import.meta.env.PROD && analytics) {
        try {
            logEvent(analytics, 'warning', {
                message,
                route: window.location.pathname,
                timestamp: new Date().toISOString(),
                ...context,
            });
        } catch (error) {
            console.error('Failed to log warning:', error);
        }
    }
};
