/**
 * Toast notification store using Zustand.
 *
 * Manages toast state including adding, removing, and dismissing toasts.
 * Provides actions for showing different types of notifications.
 *
 * @example
 * const toast = useToastStore();
 * toast.success("Item added to cart");
 * toast.error("Failed to load data");
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// ... (existing code skipped, assuming I can just replace the whole file content or use multiple replace chunks? NO, I should be precise)

// I will just add import and replace useToast implementation.
// But wait, the file has existing content at top.
// I will use multi_replace for this.

/**
 * Simple ID generator for toast notifications.
 */
let toastIdCounter = 0;
const generateToastId = () => `toast-${++toastIdCounter}-${Date.now()}`;

/**
 * Toast severity levels.
 */
export type ToastSeverity = "success" | "error" | "warning" | "info";

/**
 * Toast variant types.
 */
export type ToastVariant = "solid" | "outline" | "soft";

/**
 * Toast position on screen.
 */
export type ToastPosition =
  | "top-left"
  | "top-right"
  | "top-center"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

/**
 * Toast notification data structure.
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Toast severity level */
  severity: ToastSeverity;
  /** Main message to display */
  message: string;
  /** Optional detailed description */
  description?: string;
  /** Display variant */
  variant?: ToastVariant;
  /** Auto-dismiss duration in milliseconds (0 = no auto-dismiss) */
  duration?: number;
  /** Whether to show a close button */
  closable?: boolean;
  /** Custom action button */
  action?: {
    /** Button label */
    label: string;
    /** Click handler */
    onClick: () => void;
  };
  /** Custom icon (React node) */
  icon?: React.ReactNode;
  /** Timestamp when toast was created */
  timestamp: number;
}

/**
 * Toast store state and actions.
 */
interface ToastStore {
  /** Array of active toasts */
  toasts: Toast[];
  /** Global toast position */
  position: ToastPosition;
  /** Maximum number of toasts to show */
  maxToasts: number;
  /** Add a new toast */
  addToast: (toast: Omit<Toast, "id" | "timestamp">) => string;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
  /** Dismiss a toast with animation */
  dismissToast: (id: string) => void;
  /** Clear all toasts */
  clearAll: () => void;
  /** Set toast position */
  setPosition: (position: ToastPosition) => void;
  /** Show success toast */
  success: (message: string, options?: Partial<Omit<Toast, "id" | "severity" | "timestamp">>) => string;
  /** Show error toast */
  error: (message: string, options?: Partial<Omit<Toast, "id" | "severity" | "timestamp">>) => string;
  /** Show warning toast */
  warning: (message: string, options?: Partial<Omit<Toast, "id" | "severity" | "timestamp">>) => string;
  /** Show info toast */
  info: (message: string, options?: Partial<Omit<Toast, "id" | "severity" | "timestamp">>) => string;
}

/**
 * Toast icons configuration.
 */
export const TOAST_ICONS: Record<ToastSeverity, React.ReactNode> = {
  success: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

/**
 * Default durations for each severity.
 */
const DEFAULT_DURATIONS: Record<ToastSeverity, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

/**
 * Create the toast store with state and actions.
 */
export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  position: "top-right",
  maxToasts: 5,

  /**
   * Add a new toast notification.
   */
  addToast: (toast) => {
    const id = generateToastId();
    const newToast: Toast = {
      id,
      timestamp: Date.now(),
      closable: true,
      duration: DEFAULT_DURATIONS[toast.severity],
      variant: "solid",
      ...toast,
    };

    set((state) => {
      const toasts = [...state.toasts, newToast];

      // Limit toasts to maxToasts
      if (toasts.length > state.maxToasts) {
        toasts.shift();
      }

      return { toasts };
    });

    // Auto-dismiss if duration is set
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().dismissToast(id);
      }, newToast.duration);
    }

    return id;
  },

  /**
   * Remove a toast immediately.
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  /**
   * Dismiss a toast (with animation).
   */
  dismissToast: (id) => {
    // In a real implementation, you might add a "dismissing" state
    // for animation before actually removing
    setTimeout(() => {
      get().removeToast(id);
    }, 300); // Animation duration
  },

  /**
   * Clear all toasts.
   */
  clearAll: () => {
    set({ toasts: [] });
  },

  /**
   * Set toast position.
   */
  setPosition: (position) => {
    set({ position });
  },

  /**
   * Show success toast.
   */
  success: (message, options = {}) => {
    return get().addToast({ severity: "success", message, ...options });
  },

  /**
   * Show error toast.
   */
  error: (message, options = {}) => {
    return get().addToast({ severity: "error", message, ...options });
  },

  /**
   * Show warning toast.
   */
  warning: (message, options = {}) => {
    return get().addToast({ severity: "warning", message, ...options });
  },

  /**
   * Show info toast.
   */
  info: (message, options = {}) => {
    return get().addToast({ severity: "info", message, ...options });
  },
}));

/**
 * Hook for accessing toast actions.
 *
 * Convenience hook that extracts just the action functions from the store.
 *
 * @example
 * const toast = useToast();
 * toast.success("Operation completed!");
 */
export const useToast = () => {
  return useToastStore(
    useShallow((state) => ({
      addToast: state.addToast,
      removeToast: state.removeToast,
      dismissToast: state.dismissToast,
      clearAll: state.clearAll,
      success: state.success,
      error: state.error,
      warning: state.warning,
      info: state.info,
    }))
  );
};
