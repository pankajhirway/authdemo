/**
 * OrderReview component for reviewing order details before payment.
 *
 * Displays all cart items, order summary, delivery options, and customer
 * information for final review before proceeding to payment.
 *
 * @example
 * <OrderReview
 *   items={cartItems}
 *   summary={cartSummary}
 *   deliveryMethod="pickup"
 *   onEditDelivery={() => setStep('delivery')}
 * />
 */

import { formatCurrency, cn } from "../../lib/utils";
import type { CartItem } from "../../types/menu";
import type { CartSummary as CartSummaryType } from "../../types/cart";

/**
 * Delivery method type.
 */
export type DeliveryMethod = "pickup" | "delivery";

/**
 * Props for the OrderReview component.
 */
export interface OrderReviewProps {
  /** Cart items to display */
  items: CartItem[];
  /** Cart summary with totals */
  summary: CartSummaryType;
  /** Selected delivery method */
  deliveryMethod: DeliveryMethod;
  /** Customer name (optional) */
  customerName?: string;
  /** Customer email (optional) */
  customerEmail?: string;
  /** Customer phone (optional) */
  customerPhone?: string;
  /** Special instructions for the order */
  orderInstructions?: string;
  /** Callback when edit delivery is clicked */
  onEditDelivery?: () => void;
  /** Callback when edit items is clicked */
  onEditItems?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Delivery fee for delivery option.
 */
const DELIVERY_FEE = 4.99;

/**
 * OrderReview component.
 *
 * Displays order review with:
 * - All cart items with quantities and prices
 * - Order summary with subtotal, tax, delivery, and total
 * - Delivery method display
 * - Customer information
 * - Order special instructions
 *
 * Features:
 * - Responsive layout
 * - Clear item organization
 * - Edit buttons for modifying order
 * - Accessibility support
 *
 * @param props - Component props
 * @returns Order review component
 */
export function OrderReview({
  items,
  summary,
  deliveryMethod,
  customerName,
  customerEmail,
  customerPhone,
  orderInstructions,
  onEditDelivery,
  onEditItems,
  className,
}: OrderReviewProps) {
  const { subtotal, tax, total: baseTotal } = summary;
  const deliveryFee = deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
  const finalTotal = baseTotal + deliveryFee;

  /**
   * Calculate estimated preparation time.
   */
  const estimatedPrepTime = items.reduce((max, item) => {
    return Math.max(max, item.menuItem.prepTimeMinutes);
  }, 15);

  const estimatedDeliveryTime = deliveryMethod === "delivery" ? 30 : estimatedPrepTime;

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Order Review</h2>
          <p className="text-sm text-gray-600 mt-1">
            Please review your order before payment
          </p>
        </div>
        {onEditItems && (
          <button
            type="button"
            onClick={onEditItems}
            className={cn(
              "text-sm font-medium text-blue-600 hover:text-blue-700",
              "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            )}
          >
            Edit Items
          </button>
        )}
      </div>

      {/* Order items */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Items ({items.length})
        </h3>

        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const itemTotal = item.menuItem.price * item.quantity;
            return (
              <div
                key={item.menuItem.id}
                className="flex items-start gap-3 py-3"
              >
                {/* Item image */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Item details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                        {item.menuItem.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(item.menuItem.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(itemTotal)}
                    </p>
                  </div>

                  {/* Special instructions */}
                  {item.specialInstructions && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      "{item.specialInstructions}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order summary */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Order Summary
        </h3>

        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Tax */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tax (8%)</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(tax)}
          </span>
        </div>

        {/* Delivery fee */}
        {deliveryMethod === "delivery" && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Delivery</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(deliveryFee)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(finalTotal)}
          </span>
        </div>
      </div>

      {/* Delivery method */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Delivery Method
          </h3>
          {onEditDelivery && (
            <button
              type="button"
              onClick={onEditDelivery}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Edit
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            {deliveryMethod === "pickup" ? (
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                />
              </svg>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm capitalize">
              {deliveryMethod === "pickup" ? "Pickup" : "Delivery"}
            </p>
            <p className="text-xs text-gray-600">
              Ready in {estimatedDeliveryTime} minutes
            </p>
          </div>
        </div>
      </div>

      {/* Customer information */}
      {(customerName || customerEmail || customerPhone) && (
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Contact Information
          </h3>

          <div className="space-y-1.5 text-sm">
            {customerName && (
              <div className="flex items-center gap-2 text-gray-700">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{customerName}</span>
              </div>
            )}
            {customerEmail && (
              <div className="flex items-center gap-2 text-gray-700">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>{customerEmail}</span>
              </div>
            )}
            {customerPhone && (
              <div className="flex items-center gap-2 text-gray-700">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>{customerPhone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order instructions */}
      {orderInstructions && (
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Order Instructions
          </h3>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            {orderInstructions}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * OrderReviewSkeleton component.
 *
 * Loading skeleton for the order review.
 * Shows while order data is being loaded.
 *
 * @example
 * <OrderReviewSkeleton />
 */
export function OrderReviewSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-56" />
        </div>
        <div className="h-5 bg-gray-200 rounded w-16" />
      </div>

      {/* Items skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary skeleton */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="h-4 bg-gray-200 rounded w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
