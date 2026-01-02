/**
 * LoadingSpinner component for displaying loading states.
 *
 * Provides a variety of loading spinner styles and sizes for different
 * loading scenarios throughout the application.
 *
 * @example
 * <LoadingSpinner size="md" variant="default" />
 * <LoadingSpinner size="lg" variant="pulse" />
 * <LoadingSpinner size="sm" variant="dots" />
 */

import { cn } from "../../lib/utils";

/**
 * Props for the LoadingSpinner component.
 */
export interface LoadingSpinnerProps {
  /** Size of the spinner: "xs", "sm", "md", "lg", or "xl" */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Visual variant: "default", "pulse", "dots", or "bar" */
  variant?: "default" | "pulse" | "dots" | "bar";
  /** CSS color for the spinner (any valid Tailwind color class) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
  /** Whether to center the spinner in its container */
  centered?: boolean;
  /** Optional full-screen overlay mode */
  fullScreen?: boolean;
}

/**
 * Size configurations for spinner elements.
 */
const SIZE_CONFIGS = {
  xs: { default: "h-3 w-3", pulse: "h-6 w-6", dots: "h-1 w-1", bar: "h-0.5 w-full" },
  sm: { default: "h-4 w-4", pulse: "h-8 w-8", dots: "h-1.5 w-1.5", bar: "h-1 w-full" },
  md: { default: "h-6 w-6", pulse: "h-12 w-12", dots: "h-2 w-2", bar: "h-1.5 w-full" },
  lg: { default: "h-8 w-8", pulse: "h-16 w-16", dots: "h-2.5 w-2.5", bar: "h-2 w-full" },
  xl: { default: "h-12 w-12", pulse: "h-24 w-24", dots: "h-3 w-3", bar: "h-2.5 w-full" },
};

/**
 * LoadingSpinner component.
 *
 * Displays a loading indicator with various styles and sizes.
 * Fully accessible with screen reader support.
 *
 * Features:
 * - Four visual variants (default spinning circle, pulse animation, dots, bar)
 * - Five size options (xs, sm, md, lg, xl)
 * - Customizable colors
 * - Centered and full-screen options
 * - Accessibility support with ARIA labels
 *
 * @param props - Component props
 * @returns Loading spinner component
 */
export function LoadingSpinner({
  size = "md",
  variant = "default",
  color = "text-blue-600",
  className,
  label = "Loading...",
  centered = false,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = SIZE_CONFIGS[size][variant];

  /**
   * Renders the default spinning circle variant.
   */
  const renderDefault = () => (
    <svg
      className={cn("animate-spin", sizeClasses, color, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  /**
   * Renders the pulse animation variant.
   */
  const renderPulse = () => (
    <div
      className={cn(
        "animate-pulse rounded-full bg-current",
        sizeClasses,
        color,
        className
      )}
      role="img"
      aria-label={label}
    />
  );

  /**
   * Renders the bouncing dots variant.
   */
  const renderDots = () => (
    <div
      className={cn("flex items-center gap-1", className)}
      role="img"
      aria-label={label}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-current animate-bounce",
            sizeClasses,
            color
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  );

  /**
   * Renders the progress bar variant.
   */
  const renderBar = () => (
    <div
      className={cn("overflow-hidden rounded-full bg-gray-200", className)}
      role="progressbar"
      aria-label={label}
      aria-valuetext="Loading..."
    >
      <div
        className={cn(
          "h-full animate-progress rounded-full",
          sizeClasses,
          color.replace("text-", "bg-")
        )}
      />
    </div>
  );

  const content = (() => {
    switch (variant) {
      case "pulse":
        return renderPulse();
      case "dots":
        return renderDots();
      case "bar":
        return renderBar();
      default:
        return renderDefault();
    }
  })();

  if (fullScreen) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm",
          "animate-in fade-in-0 duration-200"
        )}
        role="status"
        aria-live="polite"
      >
        {content}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (centered) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        role="status"
        aria-live="polite"
      >
        {content}
      </div>
    );
  }

  return (
    <>
      {content}
      <span className="sr-only">{label}</span>
    </>
  );
}

/**
 * LoadingSpinnerPage component.
 *
 * Full-page loading state with centered spinner.
 * Useful for full-page transitions and initial page loads.
 *
 * @example
 * <LoadingSpinnerPage message="Loading your orders..." />
 */
export interface LoadingSpinnerPageProps {
  /** Message to display below the spinner */
  message?: string;
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Additional CSS classes */
  className?: string;
}

export function LoadingSpinnerPage({
  message = "Loading...",
  size = "lg",
  className,
}: LoadingSpinnerPageProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center gap-4",
        "animate-in fade-in-0 duration-300",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size={size} />
      {message && (
        <p className="text-sm font-medium text-gray-600">{message}</p>
      )}
    </div>
  );
}

/**
 * LoadingSpinnerInline component.
 *
 * Inline loading state for buttons and other interactive elements.
 * Displays spinner alongside text.
 *
 * @example
 * <LoadingSpinnerInline text="Saving..." />
 */
export interface LoadingSpinnerInlineProps {
  /** Text to display next to the spinner */
  text: string;
  /** Size of the spinner */
  size?: "xs" | "sm";
  /** Additional CSS classes */
  className?: string;
}

export function LoadingSpinnerInline({
  text,
  size = "sm",
  className,
}: LoadingSpinnerInlineProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size={size} />
      <span className="text-sm font-medium">{text}</span>
    </span>
  );
}

/**
 * LoadingSkeleton component.
 *
 * Generic skeleton loader for content placeholders.
 * Creates animated placeholders while content is loading.
 *
 * @example
 * <LoadingSkeleton className="h-32 w-full" />
 * <LoadingSkeleton variant="text" lines={3} />
 */
export interface LoadingSkeletonProps {
  /** Width of the skeleton (any valid Tailwind width class) */
  width?: string;
  /** Height of the skeleton (any valid Tailwind height class) */
  height?: string;
  /** Variant: "default" (rect), "circle", "text" (multiple lines) */
  variant?: "default" | "circle" | "text";
  /** Number of lines for "text" variant */
  lines?: number;
  /** Additional CSS classes */
  className?: string;
}

export function LoadingSkeleton({
  width = "w-full",
  height = "h-4",
  variant = "default",
  lines = 3,
  className,
}: LoadingSkeletonProps) {
  const borderRadius = {
    default: "rounded-md",
    circle: "rounded-full",
    text: "rounded",
  }[variant];

  if (variant === "text") {
    return (
      <div className={cn("space-y-2", className)} role="status" aria-label="Loading content">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 animate-pulse bg-gray-200 rounded",
              i === lines - 1 && "w-2/3"
            )}
            style={{
              width: i === lines - 1 ? "66%" : "100%",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200",
        borderRadius,
        width,
        height,
        className
      )}
      role="status"
      aria-label="Loading content"
    />
  );
}

/**
 * LoadingCard component.
 *
 * Card-shaped skeleton loader for card-style content.
 *
 * @example
 * <LoadingCard />
 */
export interface LoadingCardProps {
  /** Whether to show an image placeholder at the top */
  hasImage?: boolean;
  /** Height of the image placeholder */
  imageHeight?: string;
  /** Number of text lines to show */
  lines?: number;
  /** Whether to show a button placeholder at the bottom */
  hasButton?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function LoadingCard({
  hasImage = true,
  imageHeight = "h-48",
  lines = 3,
  hasButton = true,
  className,
}: LoadingCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden",
        className
      )}
      role="status"
      aria-label="Loading card"
    >
      {hasImage && <div className={cn("animate-pulse bg-gray-200", imageHeight)} />}

      <div className="p-4 space-y-3">
        <div className="h-6 w-3/4 animate-pulse bg-gray-200 rounded" />
        <div className="h-4 w-1/2 animate-pulse bg-gray-200 rounded" />

        <div className="space-y-2 pt-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 animate-pulse bg-gray-200 rounded",
                i === lines - 1 && "w-2/3"
              )}
            />
          ))}
        </div>

        {hasButton && (
          <div className="h-10 w-full animate-pulse bg-gray-200 rounded-lg" />
        )}
      </div>
    </div>
  );
}
