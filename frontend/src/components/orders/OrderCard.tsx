/**
 * OrderCard component for displaying an order in a list.
 *
 * Shows order summary with key information, status badge, and expandable details.
 * Used in the order history page and dashboard views.
 *
 * Features:
 * - Order summary with total, status, date
 * - Customer name and delivery method
 * - Expandable item details
 * - Quick actions (view details, reorder)
 * - Multiple display variants
 */

import { useState } from "react";
import { cn } from "../../lib/utils";
import { formatCurrency } from "../../lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { Order, AllOrderStatus } from "../../types/order";
import type { CartItem } from "../../types/menu";

/**
 * Props for the OrderCard component.
 */
export interface OrderCardProps {
  /** The order to display */
  order: Order;
  /** Display variant */
  variant?: "default" | "compact" | "detailed";
  /** Whether the card is initially expanded */
  defaultExpanded?: boolean;
  /** Callback when reorder is clicked */
  onReorder?: (order: Order) => void;
  /** Callback when view details is clicked */
  onViewDetails?: (order: Order) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format a date string to a readable format.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format a relative time string (e.g., "2 hours ago").
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Delivery method icons and labels.
 */
const DELIVERY_METHODS = {
  pickup: { icon: "🏪", label: "Pickup" },
  delivery: { icon: "🚗", label: "Delivery" },
};

/**
 * OrderCard component.
 *
 * Displays an order in a card format with expandable details.
 * Supports multiple variants for different display contexts.
 *
 * @param props - Component props
 * @returns Order card component
 *
 * @example
 * <OrderCard order={order} variant="default" onReorder={handleReorder} />
 */
export function OrderCard({
  order,
  variant = "default",
  defaultExpanded = false,
  onReorder,
  onViewDetails,
  className,
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const deliveryInfo = DELIVERY_METHODS[order.deliveryMethod];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  // Compact variant - simplified display
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors",
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Order info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                #{order.id.slice(0, 8)}
              </h3>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">{order.customer.name}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
              <span>{formatRelativeTime(order.createdAt)}</span>
              <span>•</span>
              <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
            </div>
          </div>

          {/* Status and total */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(order.total)}
            </span>
            <StatusBadge status={order.status} variant="sm" />
          </div>
        </div>
      </div>
    );
  }

  // Default and detailed variants
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      {/* Summary section */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Status icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
            {deliveryInfo.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Order ID */}
                  <h3 className="font-bold text-gray-900">
                    #{order.id.slice(0, 8)}
                  </h3>

                  {/* Delivery method badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md",
                      "bg-gray-100 text-gray-700"
                    )}
                  >
                    <span aria-hidden="true">{deliveryInfo.icon}</span>
                    <span>{deliveryInfo.label}</span>
                  </span>

                  {/* Status badge */}
                  <StatusBadge status={order.status} variant="sm" />
                </div>

                {/* Customer name and time */}
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span className="font-medium">{order.customer.name}</span>
                  <span className="text-gray-400">•</span>
                  <time dateTime={order.createdAt}>
                    {formatRelativeTime(order.createdAt)}
                  </time>
                </div>
              </div>

              {/* Total and actions */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(order.total)}
                </span>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {onViewDetails && (
                    <button
                      type="button"
                      onClick={() => onViewDetails(order)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200",
                        "bg-gray-100 text-gray-700 hover:bg-gray-200",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      )}
                    >
                      View Details
                    </button>
                  )}

                  {/* Reorder button - only for delivered/cancelled orders */}
                  {onReorder && (order.status === "delivered" || order.status === "cancelled") && (
                    <button
                      type="button"
                      onClick={() => onReorder(order)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200",
                        "bg-blue-600 text-white hover:bg-blue-700",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      )}
                    >
                      Reorder
                    </button>
                  )}

                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors duration-200",
                      "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500"
                    )}
                    aria-label={isExpanded ? "Collapse details" : "Expand details"}
                    aria-expanded={isExpanded}
                  >
                    <svg
                      className={cn(
                        "w-5 h-5 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Item preview */}
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium text-gray-700">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="line-clamp-1">
                {order.items.map((item) => (
                  <span key={item.menuItem.id} className="inline mr-2">
                    {item.quantity}× {item.menuItem.name}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-gray-100 mt-2">
          <div className="pt-4 space-y-4">
            {/* Items list */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Order Items</h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <OrderItemRow key={item.menuItem.id} item={item} />
                ))}
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              {order.discount && order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Order metadata */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
              <span>Order ID: <span className="font-mono">{order.id}</span></span>
              <span>Placed: {formatDate(order.createdAt)}</span>
              {order.completedAt && (
                <span>Completed: {formatDate(order.completedAt)}</span>
              )}
              {order.estimatedCompletionAt && (
                <span>Est. Completion: {formatDate(order.estimatedCompletionAt)}</span>
              )}
            </div>

            {/* Special instructions */}
            {order.specialInstructions && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Special Instructions</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {order.specialInstructions}
                </p>
              </div>
            )}

            {/* Cancellation reason */}
            {order.cancellationReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900">Cancellation Reason</p>
                <p className="text-sm text-red-700 mt-1">{order.cancellationReason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * OrderItemRow component for displaying a single item in the order.
 */
function OrderItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
      {/* Item image thumbnail */}
      <img
        src={item.menuItem.image}
        alt={item.menuItem.name}
        className="w-12 h-12 rounded-md object-cover flex-shrink-0"
        loading="lazy"
      />

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{item.menuItem.name}</span>
          <span className="text-gray-400">×{item.quantity}</span>
        </div>
        {item.specialInstructions && (
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
            Note: {item.specialInstructions}
          </p>
        )}
      </div>

      {/* Item total */}
      <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
        {formatCurrency(item.menuItem.price * item.quantity)}
      </span>
    </div>
  );
}

/**
 * OrderCardSkeleton component.
 *
 * Loading skeleton for the order card.
 *
 * @example
 * <OrderCardSkeleton />
 */
export function OrderCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="flex gap-3">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 bg-white rounded-xl border border-gray-200 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Icon skeleton */}
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 bg-gray-200 rounded w-20" />
            <div className="h-5 bg-gray-200 rounded w-16" />
            <div className="h-5 bg-gray-200 rounded w-20" />
          </div>
          <div className="flex gap-3">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>

        {/* Actions skeleton */}
        <div className="flex flex-col items-end gap-2">
          <div className="h-6 bg-gray-200 rounded w-16" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20" />
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
