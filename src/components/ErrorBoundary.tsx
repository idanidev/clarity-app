import { Component, ReactNode, ErrorInfo } from 'react';
import { logError } from '../services/errorLogging';
import ErrorFallback from './ErrorFallback';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: any[];
    level?: 'global' | 'feature' | 'component';
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to Firebase Analytics
        logError(error, {
            componentStack: errorInfo.componentStack,
            level: this.props.level || 'component',
        });

        // Call custom error handler
        this.props.onError?.(error, errorInfo);

        this.setState({ errorInfo });
    }

    componentDidUpdate(prevProps: Props) {
        // Auto-reset on resetKeys change
        if (this.state.hasError && this.props.resetKeys) {
            const hasChanged = this.props.resetKeys.some(
                (key, i) => key !== prevProps.resetKeys?.[i]
            );
            if (hasChanged) {
                this.reset();
            }
        }
    }

    reset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <ErrorFallback
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    onReset={this.reset}
                    level={this.props.level}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
