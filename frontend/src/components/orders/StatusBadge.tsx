/**
 * StatusBadge component for displaying order status badges.
 *
 * Shows a color-coded badge with icon for different order statuses.
 * Supports all order statuses including workflow and restaurant statuses.
 *
 * Features:
 * - Color-coded badges for each status
 * - Icon indicators
 * - Multiple size variants
 * - Accessible ARIA labels
 */

import { cn } from "../../lib/utils";
import type { AllOrderStatus } from "../../types/order";

/**
 * Props for the StatusBadge component.
 */
export interface StatusBadgeProps {
  /** The status to display */
  status: AllOrderStatus;
  /** Badge size variant */
  variant?: "default" | "sm" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Whether to show the label text */
  showLabel?: boolean;
}

/**
 * Status badge configuration.
 * Maps status values to display colors, labels, and icons.
 */
const STATUS_CONFIG: Record<
  AllOrderStatus,
  { label: string; bgColor: string; textColor: string; borderColor: string; icon: string }
> = {
  // Workflow statuses
  draft: {
    label: "Draft",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    borderColor: "border-gray-200",
    icon: "📝",
  },
  submitted: {
    label: "Submitted",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-200",
    icon: "📤",
  },
  confirmed: {
    label: "Confirmed",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
    icon: "✅",
  },
  rejected: {
    label: "Rejected",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-200",
    icon: "❌",
  },
  cancelled: {
    label: "Cancelled",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
    icon: "🚫",
  },

  // Restaurant order statuses
  pending: {
    label: "Pending",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-200",
    icon: "⏳",
  },
  preparing: {
    label: "Preparing",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    borderColor: "border-orange-200",
    icon: "👨‍🍳",
  },
  ready: {
    label: "Ready",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
    icon: "🔔",
  },
  delivered: {
    label: "Delivered",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-800",
    borderColor: "border-emerald-200",
    icon: "📦",
  },
};

/**
 * Size variant classes.
 */
const SIZE_VARIANTS = {
  default: "px-2.5 py-1 text-xs font-medium rounded-md",
  sm: "px-2 py-0.5 text-xs font-medium rounded-sm",
  lg: "px-3 py-1.5 text-sm font-medium rounded-lg",
};

/**
 * StatusBadge component.
 *
 * Displays a color-coded badge with icon for the given status.
 * Includes proper ARIA labels for accessibility.
 *
 * @param props - Component props
 * @returns Status badge component
 *
 * @example
 * <StatusBadge status="preparing" />
 * <StatusBadge status="delivered" variant="lg" showIcon={false} />
 */
export function StatusBadge({
  status,
  variant = "default",
  className,
  showIcon = true,
  showLabel = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const sizeClasses = SIZE_VARIANTS[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border transition-colors duration-200",
        sizeClasses,
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
      role="status"
      aria-label={`Order status: ${config.label}`}
    >
      {showIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {config.icon}
        </span>
      )}
      {showLabel && <span className="truncate">{config.label}</span>}
    </span>
  );
}

/**
 * Get status configuration for a status value.
 *
 * @param status - The order status
 * @returns Status configuration object
 *
 * @example
 * const config = getStatusConfig("preparing");
 * // Returns: { label: "Preparing", bgColor: "bg-orange-100", ... }
 */
export function getStatusConfig(status: AllOrderStatus) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

/**
 * StatusBadgeGroup component for displaying multiple status badges.
 *
 * @example
 * <StatusBadgeGroup statuses={["pending", "preparing"]} />
 */
export interface StatusBadgeGroupProps {
  /** Array of statuses to display */
  statuses: AllOrderStatus[];
  /** Badge size variant */
  variant?: "default" | "sm" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Whether to show icons */
  showIcon?: boolean;
  /** Whether to show labels */
  showLabel?: boolean;
}

export function StatusBadgeGroup({
  statuses,
  variant = "sm",
  className,
  showIcon = true,
  showLabel = true,
}: StatusBadgeGroupProps) {
  if (statuses.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)} role="group" aria-label="Order statuses">
      {statuses.map((status) => (
        <StatusBadge
          key={status}
          status={status}
          variant={variant}
          showIcon={showIcon}
          showLabel={showLabel}
        />
      ))}
    </div>
  );
}

/**
 * StatusBadgeWithCount component for showing status with count.
 *
 * @example
 * <StatusBadgeWithCount status="preparing" count={3} />
 */
export interface StatusBadgeWithCountProps extends Omit<StatusBadgeProps, "showLabel"> {
  /** Count to display */
  count: number;
}

export function StatusBadgeWithCount({
  status,
  count,
  variant = "default",
  className,
  showIcon = true,
}: StatusBadgeWithCountProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const sizeClasses = SIZE_VARIANTS[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border transition-colors duration-200",
        sizeClasses,
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
      role="status"
      aria-label={`${config.label}: ${count} orders`}
    >
      {showIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {config.icon}
        </span>
      )}
      <span className="truncate">{config.label}</span>
      <span
        className={cn(
          "px-1.5 py-0.5 rounded-md text-xs font-semibold",
          "bg-white/30"
        )}
        aria-hidden="true"
      >
        {count}
      </span>
    </span>
  );
}
