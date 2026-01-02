/**
 * CartSummary component for displaying cart totals and checkout actions.
 *
 * Shows order summary including subtotal, tax, and total with proceed to
 * checkout button. Displays discount codes and delivery options when available.
 *
 * @example
 * <CartSummary
 *   subtotal={25.98}
 *   tax={2.08}
 *   total={28.06}
 *   itemCount={3}
 *   onCheckout={() => navigate('/checkout')}
 * />
 */

import { useState } from "react";
import { cn, formatCurrency } from "../../lib/utils";
import type { CartSummary as CartSummaryType } from "../../types/cart";

/**
 * Props for the CartSummary component.
 */
export interface CartSummaryProps {
  /** Cart summary data */
  summary: CartSummaryType;
  /** Callback when checkout button is clicked */
  onCheckout?: () => void;
  /** Callback when continue shopping is clicked */
  onContinueShopping?: () => void;
  /** Whether checkout is in progress */
  isCheckingOut?: boolean;
  /** Whether to show discount code input */
  showDiscountCode?: boolean;
  /** Whether to show delivery options */
  showDeliveryOptions?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Tax rate as percentage for display.
 */
const TAX_RATE_PERCENT = 8;

/**
 * Minimum order amount for checkout.
 */
const MIN_ORDER_AMOUNT = 5;

/**
 * CartSummary component.
 *
 * Displays order summary with:
 * - Item count and subtotal
 * - Tax calculation
 * - Total with tax included
 * - Discount code input (optional)
 * - Delivery options (optional)
 * - Checkout and continue shopping buttons
 *
 * Features:
 * - Responsive layout
 * - Loading state for checkout
 * - Discount code validation UI
 * - Delivery option selection
 * - Minimum order warning
 * - Accessibility support
 *
 * @param props - Component props
 * @returns Cart summary component
 */
export function CartSummary({
  summary,
  onCheckout,
  onContinueShopping,
  isCheckingOut = false,
  showDiscountCode = true,
  showDeliveryOptions = false,
  className,
}: CartSummaryProps) {
  const { subtotal, tax, total, itemCount, totalQuantity } = summary;

  const [discountCode, setDiscountCode] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [selectedDelivery, setSelectedDelivery] = useState<"pickup" | "delivery">("pickup");

  /**
   * Handle discount code apply.
   */
  const handleApplyDiscount = async () => {
    if (!discountCode.trim() || isApplyingDiscount) return;

    setIsApplyingDiscount(true);
    try {
      // Simulate discount code validation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock discount logic (in real app, this would be an API call)
      if (discountCode.toLowerCase() === "demo10") {
        const discount = subtotal * 0.1;
        setDiscountAmount(discount);
        setDiscountApplied(true);
      } else {
        setDiscountAmount(0);
        setDiscountApplied(false);
      }
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  /**
   * Handle discount code remove.
   */
  const handleRemoveDiscount = () => {
    setDiscountCode("");
    setDiscountAmount(0);
    setDiscountApplied(false);
  };

  /**
   * Calculate final total after discount.
   */
  const finalSubtotal = subtotal - discountAmount;
  const finalTax = finalSubtotal * (TAX_RATE_PERCENT / 100);
  const finalTotal = finalSubtotal + finalTax;

  /**
   * Check if order meets minimum amount.
   */
  const meetsMinimumOrder = finalSubtotal >= MIN_ORDER_AMOUNT;

  /**
   * Calculate delivery fee.
   */
  const deliveryFee = selectedDelivery === "delivery" ? 4.99 : 0;

  /**
   * Handle checkout button click.
   */
  const handleCheckoutClick = () => {
    if (meetsMinimumOrder && onCheckout) {
      onCheckout();
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6",
        className
      )}
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
        <p className="text-sm text-gray-600 mt-1">
          {totalQuantity} {totalQuantity === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      {/* Line items */}
      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Discount */}
        {discountApplied && discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">Discount (10%)</span>
              <button
                type="button"
                onClick={handleRemoveDiscount}
                className="text-red-600 hover:text-red-700 text-xs underline"
              >
                Remove
              </button>
            </div>
            <span className="font-medium text-green-600">
              -{formatCurrency(discountAmount)}
            </span>
          </div>
        )}

        {/* Tax */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Tax ({TAX_RATE_PERCENT}%)
          </span>
          <span className="font-medium text-gray-900">
            {formatCurrency(finalTax)}
          </span>
        </div>

        {/* Delivery fee */}
        {showDeliveryOptions && selectedDelivery === "delivery" && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Delivery</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(deliveryFee)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 pt-3">
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(finalTotal + deliveryFee)}
            </span>
          </div>
        </div>
      </div>

      {/* Discount code input */}
      {showDiscountCode && !discountApplied && (
        <div className="space-y-2">
          <label
            htmlFor="discount-code"
            className="block text-sm font-medium text-gray-700"
          >
            Discount Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="discount-code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Enter code (try: demo10)"
              className={cn(
                "flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "placeholder:text-gray-400"
              )}
              disabled={isApplyingDiscount}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApplyDiscount();
                }
              }}
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              disabled={isApplyingDiscount || !discountCode.trim()}
              className={cn(
                "px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg",
                "hover:bg-blue-700 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isApplyingDiscount ? "Applying..." : "Apply"}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Use code <span className="font-mono font-medium">demo10</span> for 10% off
          </p>
        </div>
      )}

      {/* Delivery options */}
      {showDeliveryOptions && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Delivery Method
          </label>
          <div className="space-y-2">
            {/* Pickup option */}
            <button
              type="button"
              onClick={() => setSelectedDelivery("pickup")}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                selectedDelivery === "pickup"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    selectedDelivery === "pickup"
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  )}
                >
                  {selectedDelivery === "pickup" && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <circle cx="10" cy="10" r="5" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">Pickup</p>
                  <p className="text-xs text-gray-500">Ready in 15-20 min</p>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-900">Free</span>
            </button>

            {/* Delivery option */}
            <button
              type="button"
              onClick={() => setSelectedDelivery("delivery")}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                selectedDelivery === "delivery"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    selectedDelivery === "delivery"
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  )}
                >
                  {selectedDelivery === "delivery" && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <circle cx="10" cy="10" r="5" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">Delivery</p>
                  <p className="text-xs text-gray-500">30-45 min</p>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                +{formatCurrency(deliveryFee)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Checkout button */}
        <button
          type="button"
          onClick={handleCheckoutClick}
          disabled={isCheckingOut || itemCount === 0 || !meetsMinimumOrder}
          className={cn(
            "w-full py-3 px-4 rounded-lg font-medium text-white transition-all",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            meetsMinimumOrder && itemCount > 0
              ? "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
              : "bg-gray-400 cursor-not-allowed",
            (isCheckingOut || itemCount === 0) && "opacity-75 cursor-wait"
          )}
        >
          {isCheckingOut ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
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
              Processing...
            </span>
          ) : !meetsMinimumOrder ? (
            `Minimum order ${formatCurrency(MIN_ORDER_AMOUNT)}`
          ) : itemCount === 0 ? (
            "Your cart is empty"
          ) : (
            `Proceed to Checkout • ${formatCurrency(finalTotal + deliveryFee)}`
          )}
        </button>

        {/* Continue shopping button */}
        {onContinueShopping && (
          <button
            type="button"
            onClick={onContinueShopping}
            disabled={isCheckingOut}
            className={cn(
              "w-full py-2.5 px-4 rounded-lg font-medium text-gray-700",
              "hover:bg-gray-100 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-gray-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Continue Shopping
          </button>
        )}
      </div>

      {/* Security notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Secure checkout powered by Keycloak</span>
      </div>
    </div>
  );
}

/**
 * CartSummarySkeleton component.
 *
 * Loading skeleton for the cart summary.
 * Shows while cart data is being loaded.
 *
 * @example
 * <CartSummarySkeleton />
 */
export function CartSummarySkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>

      {/* Line items skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Buttons skeleton */}
      <div className="space-y-3">
        <div className="h-12 bg-gray-200 rounded-lg" />
        <div className="h-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
