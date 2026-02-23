
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-lg w-full text-center border border-red-200 dark:border-red-900/50">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Algo correu mal
                        </h1>

                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Ocorreu um erro inesperado na aplicação. A nossa equipa foi notificada.
                        </p>

                        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-left overflow-auto max-h-40 text-xs font-mono mb-6 text-gray-700 dark:text-gray-400">
                            {this.state.error?.toString()}
                        </div>

                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={() => window.location.href = '/dashboard'}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                Recarregar Página
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = '/login'}
                            >
                                Voltar ao Login
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
