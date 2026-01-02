/**
 * Toast notification components for displaying alerts and messages.
 *
 * Provides toast UI components that work with the toast store to display
 * temporary notifications to users.
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * @example
 * const toast = useToast();
 * toast.success("Item added to cart");
 * toast.error("Failed to save");
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";
import {
  useToastStore,
  TOAST_ICONS,
  type Toast as ToastType,
  type ToastSeverity,
  type ToastPosition,
} from "../../store/toast";

/**
 * Props for individual Toast component.
 */
interface ToastProps {
  /** The toast data to display */
  toast: ToastType;
  /** Callback when toast is dismissed */
  onDismiss: (id: string) => void;
  /** Animation direction (for positioning) */
  direction?: "horizontal" | "vertical";
}

/**
 * Toast severity color configurations.
 */
const SEVERITY_COLORS: Record<
  ToastSeverity,
  { bg: string; border: string; text: string; icon: string }
> = {
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-900",
    icon: "text-green-600",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-900",
    icon: "text-red-600",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
    icon: "text-amber-600",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-900",
    icon: "text-blue-600",
  },
};

/**
 * SEVERITY_COLORS for outline variant.
 */
const SEVERITY_OUTLINE_COLORS: Record<
  ToastSeverity,
  { bg: string; border: string; text: string; icon: string }
> = {
  success: {
    bg: "bg-white",
    border: "border-green-300",
    text: "text-green-900",
    icon: "text-green-600",
  },
  error: {
    bg: "bg-white",
    border: "border-red-300",
    text: "text-red-900",
    icon: "text-red-600",
  },
  warning: {
    bg: "bg-white",
    border: "border-amber-300",
    text: "text-amber-900",
    icon: "text-amber-600",
  },
  info: {
    bg: "bg-white",
    border: "border-blue-300",
    text: "text-blue-900",
    icon: "text-blue-600",
  },
};

/**
 * Toast component.
 *
 * Displays a single toast notification with icon, message, and optional
 * description and action button.
 *
 * Features:
 * - Configurable severity colors
 * - Solid and outline variants
 * - Dismissible with close button
 * - Optional action button
 * - Smooth enter/exit animations
 * - Accessible ARIA attributes
 *
 * @param props - Component props
 * @returns Toast notification component
 */
export function Toast({ toast, onDismiss, direction = "vertical" }: ToastProps) {
  const { severity, message, description, variant = "solid", closable = true, action, icon } = toast;

  const colors = variant === "outline" ? SEVERITY_OUTLINE_COLORS : SEVERITY_COLORS;
  const severityColors = colors[severity];

  /**
   * Handle toast dismissal.
   */
  const handleDismiss = () => {
    onDismiss(toast.id);
  };

  /**
   * Handle action button click.
   */
  const handleAction = () => {
    action?.onClick();
    handleDismiss();
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-sm items-start gap-3 rounded-lg border shadow-lg",
        "transition-all duration-300 ease-in-out",
        "animate-in slide-in-from-top-2 fade-in-0",
        "hover:shadow-xl",
        severityColors.bg,
        severityColors.border,
        severityColors.text
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 mt-0.5", severityColors.icon)}>
        {icon || TOAST_ICONS[severity]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{message}</p>
        {description && (
          <p className="mt-1 text-sm opacity-90">{description}</p>
        )}

        {/* Action button */}
        {action && (
          <button
            type="button"
            onClick={handleAction}
            className={cn(
              "mt-2 text-sm font-medium underline underline-offset-2",
              "focus:outline-none focus:rounded focus:ring-2 focus:ring-current",
              "hover:opacity-80"
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      {closable && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            "flex-shrink-0 rounded p-1",
            "opacity-70 hover:opacity-100",
            "focus:outline-none focus:ring-2 focus:ring-current",
            "transition-opacity duration-200"
          )}
          aria-label="Close notification"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * ToastContainer component.
 *
 * Container for rendering toast notifications.
 * Handles positioning and manages the list of active toasts.
 *
 * @example
 * <ToastContainer />
 */
export interface ToastContainerProps {
  /** Custom position for toasts */
  position?: ToastPosition;
  /** Additional CSS classes */
  className?: string;
}

export function ToastContainer({ position, className }: ToastContainerProps) {
  const { toasts, dismissToast, position: storePosition } = useToastStore();
  const toastPosition = position || storePosition;

  /**
   * Get container classes based on position.
   */
  const getPositionClasses = (): string => {
    const baseClasses = "fixed z-50 flex flex-col gap-2 p-4 pointer-events-none";

    const positionClasses: Record<ToastPosition, string> = {
      "top-left": "top-0 left-0 items-start",
      "top-right": "top-0 right-0 items-end",
      "top-center": "top-0 left-1/2 -translate-x-1/2 items-center",
      "bottom-left": "bottom-0 left-0 items-start",
      "bottom-right": "bottom-0 right-0 items-end",
      "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 items-center",
    };

    return cn(baseClasses, positionClasses[toastPosition]);
  };

  if (toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div className={cn(getPositionClasses(), className)} role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
        >
          <Toast toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>,
    document.body
  );
}

/**
 * ToastProvider component.
 *
 * Wraps the application and provides toast functionality.
 * Renders the ToastContainer to display notifications.
 *
 * @example
 * <ToastProvider position="top-right">
 *   <App />
 * </ToastProvider>
 */
export interface ToastProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Toast position */
  position?: ToastPosition;
  /** Maximum number of toasts */
  maxToasts?: number;
}

export function ToastProvider({
  children,
  position,
  maxToasts,
}: ToastProviderProps) {
  useEffect(() => {
    // Set toast position and max toasts on mount
    if (position) {
      useToastStore.getState().setPosition(position);
    }
    if (maxToasts) {
      useToastStore.setState({ maxToasts });
    }
  }, [position, maxToasts]);

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}

/**
 * ToastProgress component.
 *
 * Displays a progress bar showing remaining time for auto-dismiss.
 *
 * @example
 * <ToastProgress duration={4000} onComplete={handleDismiss} />
 */
export interface ToastProgressProps {
  /** Duration in milliseconds */
  duration: number;
  /** Callback when progress completes */
  onComplete: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function ToastProgress({ duration, onComplete, className }: ToastProgressProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className={cn("h-0.5 bg-current opacity-30 rounded-full overflow-hidden", className)}
      role="progressbar"
      aria-valuenow={100}
    >
      <div
        className="h-full animate-shrink"
        style={{
          animationDuration: `${duration}ms`,
        }}
      />
    </div>
  );
}

/**
 * Convenience hook for showing toasts.
 *
 * Combines the toast store actions with commonly used patterns.
 *
 * @example
 * const toast = useToast();
 *
 * toast.success("Saved successfully");
 * toast.error("Failed to save", { description: error.message });
 * toast.warning("Are you sure?", {
 *   action: { label: "Undo", onClick: handleUndo }
 * });
 */
export const useToast = () => {
  const {
    addToast,
    removeToast,
    dismissToast,
    clearAll,
    success,
    error,
    warning,
    info,
  } = useToastStore();

  return {
    show: addToast,
    close: removeToast,
    dismiss: dismissToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };
};
