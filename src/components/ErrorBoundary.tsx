'use client'

import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    eventId?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const eventId = Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });

        this.setState({ eventId });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
                        </div>

                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            Something went wrong
                        </h2>

                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            We've been notified about this error and are working to fix it.
                        </p>

                        <div className="space-y-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                Reload Page
                            </Button>

                            {this.state.eventId && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Error ID: {this.state.eventId}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}