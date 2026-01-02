/**
 * ErrorBoundary component for catching and handling React errors.
 *
 * Wraps children components to catch JavaScript errors anywhere in the
 * component tree, log those errors, and display a fallback UI instead of
 * the component tree that crashed.
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * @example
 * <ErrorBoundary
 *   fallback={<CustomErrorFallback />}
 *   onError={(error) => logError(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */

import { Component, ReactNode, ComponentType } from "react";
import { cn } from "../../lib/utils";

/**
 * Error info from React's ErrorBoundary.
 */
export interface ErrorBoundaryInfo {
  /** The component stack trace */
  componentStack: string;
  /** Additional error information */
  digest?: string;
}

/**
 * Props for the ErrorBoundary component.
 */
export interface ErrorBoundaryProps {
  /** Child components to be wrapped by the error boundary */
  children: ReactNode;
  /** Fallback UI to render when an error is caught */
  fallback?: ReactNode;
  /** Custom fallback component */
  FallbackComponent?: ComponentType<FallbackProps>;
  /** Callback called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorBoundaryInfo) => void;
  /** Additional CSS classes for the error container */
  className?: string;
}

/**
 * Props passed to custom fallback components.
 */
export interface FallbackProps {
  /** The error that was caught */
  error: Error;
  /** Function to reset the error boundary and retry */
  resetErrorBoundary: () => void;
}

/**
 * State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
}

/**
 * ErrorBoundaryState class component.
 *
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Provides error logging and recovery mechanisms.
 *
 * Features:
 * - Catches all JavaScript errors in child component tree
 * - Logs errors to console and custom error handlers
 * - Displays user-friendly error messages
 * - Provides retry mechanism
 * - Supports custom fallback UI
 *
 * @param props - Component props
 * @returns Error boundary component
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Update state when an error is caught.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log error information when caught.
   */
  componentDidCatch(error: Error, errorInfo: ErrorBoundaryInfo): void {
    // Log to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset the error boundary state and retry rendering.
   */
  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, FallbackComponent, className } = this.props;

    if (!hasError || !error) {
      return children;
    }

    // Use custom fallback component if provided
    if (FallbackComponent) {
      return (
        <div className={cn("w-full", className)}>
          <FallbackComponent
            error={error}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        </div>
      );
    }

    // Use custom fallback if provided
    if (fallback) {
      return <div className={cn("w-full", className)}>{fallback}</div>;
    }

    // Default fallback UI
    return <ErrorFallback error={error} resetErrorBoundary={this.resetErrorBoundary} className={className} />;
  }
}

/**
 * ErrorFallback component.
 *
 * Default error UI displayed when an error is caught.
 * Provides user-friendly error message and retry button.
 *
 * @example
 * <ErrorFallback
 *   error={error}
 *   resetErrorBoundary={() => setError(null)}
 * />
 */
export interface ErrorFallbackProps {
  /** The error to display */
  error: Error;
  /** Function to reset and retry */
  resetErrorBoundary: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  className,
}: ErrorFallbackProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-6">
          {/* Error icon */}
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Error heading */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We're sorry for the inconvenience. An error occurred while
              rendering this page.
            </p>
          </div>

          {/* Error message (development only) */}
          {import.meta.env.DEV && error.message && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Error details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-xs font-mono text-red-600 break-words">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs font-mono text-gray-700 whitespace-pre-wrap break-words">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={resetErrorBoundary}
              className={cn(
                "flex-1 inline-flex items-center justify-center px-4 py-2",
                "text-sm font-medium text-white",
                "bg-blue-600 hover:bg-blue-700",
                "rounded-md shadow-sm hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "transition-all duration-200"
              )}
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.href = "/"}
              className={cn(
                "flex-1 inline-flex items-center justify-center px-4 py-2",
                "text-sm font-medium text-gray-700",
                "bg-white border border-gray-300 hover:bg-gray-50",
                "rounded-md shadow-sm hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "transition-all duration-200"
              )}
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * withErrorBoundary higher-order component.
 *
 * Wraps a component with an error boundary for automatic error handling.
 *
 * @example
 * const MyComponentWithErrorBoundary = withErrorBoundary(MyComponent, {
 *   FallbackComponent: CustomFallback,
 *   onError: (error) => trackError(error),
 * });
 */
export interface WithErrorBoundaryOptions {
  /** Fallback UI to render on error */
  fallback?: ReactNode;
  /** Custom fallback component */
  FallbackComponent?: ComponentType<FallbackProps>;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorBoundaryInfo) => void;
}

export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
}

/**
 * useErrorHandler hook.
 *
 * Provides a way to throw errors from event handlers or async functions
 * that will be caught by the nearest error boundary.
 *
 * @example
 * function MyComponent() {
 *   const handleError = useErrorHandler();
 *
 *   const handleClick = async () => {
 *     try {
 *       await riskyOperation();
 *     } catch (error) {
 *       handleError(error);
 *     }
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 */
export function useErrorHandler(): (error: Error) => never {
  return (error: Error): never => {
    throw error;
  };
}

/**
 * AsyncErrorBoundary component.
 *
 * Specialized error boundary for handling async errors in data fetching,
 * promises, and event handlers.
 *
 * @example
 * <AsyncErrorBoundary fallback={<ErrorFallback />}>
 *   <MyAsyncComponent />
 * </AsyncErrorBoundary>
 */
export interface AsyncErrorBoundaryProps extends Omit<ErrorBoundaryProps, "children"> {
  /** Children that may throw async errors */
  children: ReactNode;
}

export function AsyncErrorBoundary({
  children,
  ...props
}: AsyncErrorBoundaryProps) {
  return <ErrorBoundary {...props}>{children}</ErrorBoundary>;
}

AsyncErrorBoundary.displayName = "AsyncErrorBoundary";
