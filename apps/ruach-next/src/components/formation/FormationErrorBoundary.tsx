"use client";

import React, { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for formation components
 * Gracefully handles errors and provides recovery options
 */
export class FormationErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(
    error: Error,
    errorInfo: { componentStack: string }
  ) {
    console.error("[Formation Error Boundary]", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return <DefaultErrorFallback error={this.state.error} onReset={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/20">
      <div className="flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
            Something went wrong
          </h3>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">
            {error.message || "An unexpected error occurred"}
          </p>
          <details className="mt-3 text-xs text-red-700 dark:text-red-300">
            <summary className="cursor-pointer font-medium hover:underline">
              Error details
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-red-900/20 p-2 font-mono text-red-900 dark:text-red-100">
              {error.stack}
            </pre>
          </details>
          <button
            onClick={onReset}
            className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Async error handling wrapper for promise-based operations
 */
export function useFormationErrorHandler() {
  const handleError = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "An unknown error occurred";
  };

  const withErrorHandling = async <T,>(
    operation: () => Promise<T>,
    options = { showAlert: false }
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      const message = handleError(error);
      console.error("[Formation Operation Error]", error);

      if (options.showAlert) {
        alert(message);
      }

      return null;
    }
  };

  return { handleError, withErrorHandling };
}

/**
 * Notification component for validation and network errors
 */
interface ErrorNotificationProps {
  error: string | null;
  onDismiss: () => void;
  type?: "error" | "warning" | "info";
  duration?: number;
}

export function ErrorNotification({
  error,
  onDismiss,
  type = "error",
  duration = 5000,
}: ErrorNotificationProps) {
  React.useEffect(() => {
    if (!error || duration <= 0) return;

    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [error, duration, onDismiss]);

  if (!error) return null;

  const bgColor =
    type === "error"
      ? "bg-red-50 dark:bg-red-950/20"
      : type === "warning"
        ? "bg-yellow-50 dark:bg-yellow-950/20"
        : "bg-blue-50 dark:bg-blue-950/20";

  const borderColor =
    type === "error"
      ? "border-red-200 dark:border-red-900/30"
      : type === "warning"
        ? "border-yellow-200 dark:border-yellow-900/30"
        : "border-blue-200 dark:border-blue-900/30";

  const textColor =
    type === "error"
      ? "text-red-800 dark:text-red-200"
      : type === "warning"
        ? "text-yellow-800 dark:text-yellow-200"
        : "text-blue-800 dark:text-blue-200";

  return (
    <div
      className={`rounded-lg border ${borderColor} ${bgColor} p-4`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {type === "error" && (
          <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${textColor}`} />
        )}
        <p className={`flex-1 text-sm ${textColor}`}>{error}</p>
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 font-semibold ${textColor} hover:opacity-75`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
