/**
 * OrderDetails component for displaying full order details.
 *
 * Shows comprehensive order information including items, pricing,
 * timeline, and customer details. Used for detailed order view.
 *
 * Features:
 * - Full order information display
 * - Item list with images and quantities
 * - Pricing breakdown
 * - Order timeline/history
 * - Customer information
 * - Print and export options
 */

import { useState } from "react";
import { cn } from "../../lib/utils";
import { formatCurrency } from "../../lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { Order, OrderTimelineEvent } from "../../types/order";
import type { CartItem } from "../../types/menu";

/**
 * Props for the OrderDetails component.
 */
export interface OrderDetailsProps {
  /** The order to display */
  order: Order;
  /** Timeline events for the order */
  timeline?: OrderTimelineEvent[];
  /** Callback when print is clicked */
  onPrint?: () => void;
  /** Callback when share/export is clicked */
  onShare?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format a date string to a readable format.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
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
  pickup: { icon: "🏪", label: "Pickup", description: "Order will be ready for pickup" },
  delivery: { icon: "🚗", label: "Delivery", description: "Order will be delivered to your address" },
};

/**
 * OrderDetails component.
 *
 * Displays comprehensive details for a single order including
 * items, pricing, timeline, and customer information.
 *
 * @param props - Component props
 * @returns Order details component
 *
 * @example
 * <OrderDetails order={order} timeline={timelineEvents} onPrint={handlePrint} />
 */
export function OrderDetails({
  order,
  timeline,
  onPrint,
  onShare,
  className,
}: OrderDetailsProps) {
  const [activeTab, setActiveTab] = useState<"items" | "timeline">("items");
  const deliveryInfo = DELIVERY_METHODS[order.deliveryMethod];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm", className)}>
      {/* Header section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          {/* Order info */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.id.slice(0, 8)}
              </h1>
              <StatusBadge status={order.status} variant="lg" />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Placed {formatRelativeTime(order.createdAt)}</span>
              <span className="text-gray-400">•</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className={cn(
                  "p-2 rounded-lg transition-colors duration-200",
                  "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                )}
                aria-label="Print order"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              </button>
            )}
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                className={cn(
                  "p-2 rounded-lg transition-colors duration-200",
                  "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                )}
                aria-label="Share order"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick info cards */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-gray-200">
        {/* Delivery method */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl" aria-hidden="true">
              {deliveryInfo.icon}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {deliveryInfo.label}
            </span>
          </div>
          <p className="text-xs text-gray-600">{deliveryInfo.description}</p>
        </div>

        {/* Item count */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📦</span>
            <span className="text-sm font-medium text-gray-700">
              {itemCount} {itemCount === 1 ? "Item" : "Items"}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {order.items.length} {order.items.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Order total */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💰</span>
            <span className="text-sm font-medium text-gray-700">Total</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</p>
        </div>

        {/* Estimated time */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏱️</span>
            <span className="text-sm font-medium text-gray-700">
              {order.completedAt ? "Completed" : "Est. Time"}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {order.completedAt
              ? formatRelativeTime(order.completedAt)
              : order.estimatedCompletionAt
              ? formatRelativeTime(order.estimatedCompletionAt)
              : "Calculating..."}
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="px-6 border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Order details tabs">
          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200",
              activeTab === "items"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            Order Items
          </button>
          {timeline && timeline.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200",
                activeTab === "timeline"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Timeline
            </button>
          )}
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {/* Items tab */}
        {activeTab === "items" && (
          <div className="space-y-6">
            {/* Items list */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <OrderItemDetail key={item.menuItem.id} item={item} />
                ))}
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Details</h2>
              <div className="max-w-sm space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
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
                <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200 text-base">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Customer information */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-600">Name</dt>
                  <dd className="font-medium text-gray-900">{order.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Email</dt>
                  <dd className="font-medium text-gray-900">{order.customer.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Phone</dt>
                  <dd className="font-medium text-gray-900">{order.customer.phone}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Order ID</dt>
                  <dd className="font-mono text-gray-900">{order.id}</dd>
                </div>
              </dl>
            </div>

            {/* Special instructions */}
            {order.specialInstructions && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Special Instructions</h2>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
                  {order.specialInstructions}
                </p>
              </div>
            )}

            {/* Cancellation reason */}
            {order.cancellationReason && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Reason</h2>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-900">{order.cancellationReason}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline tab */}
        {activeTab === "timeline" && timeline && timeline.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
            <Timeline events={timeline} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * OrderItemDetail component for displaying a single item with full details.
 */
function OrderItemDetail({ item }: { item: CartItem }) {
  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
      {/* Item image */}
      <img
        src={item.menuItem.image}
        alt={item.menuItem.name}
        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
      />

      {/* Item details */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">{item.menuItem.name}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {item.menuItem.description}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">
              {formatCurrency(item.menuItem.price * item.quantity)}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(item.menuItem.price)} each
            </p>
          </div>
        </div>

        {/* Quantity and special instructions */}
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="px-2 py-1 bg-white rounded-md text-gray-700 font-medium">
            Qty: {item.quantity}
          </span>
          {item.specialInstructions && (
            <span className="text-gray-600">
              Note: <span className="italic">{item.specialInstructions}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline component for displaying order events.
 */
function Timeline({ events }: { events: OrderTimelineEvent[] }) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          {/* Timeline line */}
          {index < events.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
          )}

          {/* Event icon */}
          <div className="relative flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Event details */}
          <div className="flex-1 pb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{event.description}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    by {event.actorUsername}
                  </p>
                </div>
                <time className="text-sm text-gray-600 flex-shrink-0">
                  {formatRelativeTime(event.timestamp)}
                </time>
              </div>

              {/* Event data */}
              {event.data && Object.keys(event.data).length > 0 && (
                <dl className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(event.data).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-gray-600 capitalize">{key}</dt>
                      <dd className="text-gray-900">
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * OrderDetailsSkeleton component.
 *
 * Loading skeleton for the order details view.
 *
 * @example
 * <OrderDetailsSkeleton />
 */
export function OrderDetailsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
      {/* Header skeleton */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="flex gap-3">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Info cards skeleton */}
      <div className="p-6 grid grid-cols-4 gap-4 border-b border-gray-200">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-gray-100 rounded-lg h-24" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="p-6 space-y-6">
        <div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
