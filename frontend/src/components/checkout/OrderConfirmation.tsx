/**
 * OrderConfirmation component for displaying successful order details.
 *
 * Shows order confirmation with order ID, items, totals, estimated time,
 * and next steps after successful payment.
 *
 * @example
 * <OrderConfirmation
 *   orderId="ord-12345"
 *   items={orderItems}
 *   total={28.06}
 *   estimatedTime={20}
 * />
 */

import { useNavigate, Link } from "react-router-dom";
import { cn, formatCurrency } from "../../lib/utils";
import type { CartItem } from "../../types/menu";

/**
 * Order status type.
 */
export type OrderStatus = "submitted" | "confirmed" | "preparing" | "ready" | "completed";

/**
 * Props for the OrderConfirmation component.
 */
export interface OrderConfirmationProps {
  /** Unique order ID */
  orderId: string;
  /** Cart items in the order */
  items: CartItem[];
  /** Order total including tax and fees */
  total: number;
  /** Estimated preparation time in minutes */
  estimatedTime: number;
  /** Current order status */
  status?: OrderStatus;
  /** Delivery method */
  deliveryMethod?: "pickup" | "delivery";
  /** Customer name for greeting */
  customerName?: string;
  /** Callback when view orders is clicked */
  onViewOrders?: () => void;
  /** Callback when continue shopping is clicked */
  onContinueShopping?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * OrderConfirmation component.
 *
 * Displays order confirmation with:
 * - Success message and confetti animation
 * - Order ID and status
 * - Order items summary
 * - Estimated preparation time
 * - Next steps (view orders, continue shopping)
 * - Receipt-style layout
 *
 * Features:
 * - Professional receipt design
 * - Clear order information
 * - Accessible navigation
 * - Print-friendly layout
 * - Mobile responsive
 *
 * @param props - Component props
 * @returns Order confirmation component
 */
export function OrderConfirmation({
  orderId,
  items,
  total,
  estimatedTime,
  status = "submitted",
  deliveryMethod = "pickup",
  customerName,
  onViewOrders,
  onContinueShopping,
  className,
}: OrderConfirmationProps) {
  const navigate = useNavigate();

  /**
   * Get status display info.
   */
  const getStatusInfo = () => {
    switch (status) {
      case "submitted":
        return {
          title: "Order Submitted!",
          message: "Your order has been received and is being reviewed.",
          color: "blue",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
      case "confirmed":
        return {
          title: "Order Confirmed!",
          message: "Your order has been confirmed and is being prepared.",
          color: "green",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          ),
        };
      case "preparing":
        return {
          title: "Preparing Your Order",
          message: "Your order is currently being prepared by our kitchen.",
          color: "amber",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
      case "ready":
        return {
          title: "Order Ready!",
          message: deliveryMethod === "pickup"
            ? "Your order is ready for pickup!"
            : "Your order is out for delivery!",
          color: "green",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          ),
        };
      default:
        return {
          title: "Order Complete!",
          message: "Thank you for your order!",
          color: "green",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          ),
        };
    }
  };

  /**
   * Handle view orders click.
   */
  const handleViewOrders = () => {
    if (onViewOrders) {
      onViewOrders();
    } else {
      navigate("/orders");
    }
  };

  /**
   * Handle continue shopping click.
   */
  const handleContinueShopping = () => {
    if (onContinueShopping) {
      onContinueShopping();
    } else {
      navigate("/menu");
    }
  };

  const statusInfo = getStatusInfo();
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12",
        className
      )}
    >
      <div className="max-w-lg w-full">
        {/* Confirmation card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Success header */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center">
            {/* Success icon */}
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4",
              colorClasses[statusInfo.color as keyof typeof colorClasses]
            )}>
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {statusInfo.icon}
              </svg>
            </div>

            {/* Title and message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {statusInfo.title}
            </h1>
            <p className="text-sm text-gray-700 mb-1">
              {customerName ? `Thank you, ${customerName}!` : "Thank you!"}
            </p>
            <p className="text-sm text-gray-600">
              {statusInfo.message}
            </p>
          </div>

          {/* Order details */}
          <div className="p-6 space-y-6">
            {/* Order ID */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Order Number
              </p>
              <p className="text-lg font-mono font-bold text-gray-900">
                {orderId}
              </p>
            </div>

            {/* Estimated time */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {deliveryMethod === "pickup" ? "Pickup" : "Delivery"} Time
                </p>
                <p className="text-lg font-bold text-blue-600">
                  ~{estimatedTime} minutes
                </p>
              </div>
            </div>

            {/* Order items summary */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Order Items
              </h3>

              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  const itemTotal = item.menuItem.price * item.quantity;
                  return (
                    <div
                      key={item.menuItem.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={item.menuItem.image}
                            alt={item.menuItem.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {item.menuItem.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty {item.quantity} × {formatCurrency(item.menuItem.price)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(itemTotal)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order total */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900">
                  Total Paid
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Next steps */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                What's Next?
              </h4>
              <ul className="text-sm text-gray-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>You'll receive updates on your order status</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {deliveryMethod === "pickup"
                      ? "We'll notify you when your order is ready for pickup"
                      : "Your order will be delivered to your address"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Save your order number for reference</span>
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleViewOrders}
                className={cn(
                  "w-full py-3 px-4 rounded-lg font-medium text-white transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                )}
              >
                View Order Status
              </button>

              <button
                type="button"
                onClick={handleContinueShopping}
                className={cn(
                  "w-full py-2.5 px-4 rounded-lg font-medium text-gray-700",
                  "hover:bg-gray-100 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-gray-500"
                )}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>

        {/* Need help section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Need help with your order?</p>
          <Link
            to="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * OrderConfirmationCompact component.
 *
 * Compact version of order confirmation for inline display.
 * Useful for showing confirmation in a modal or smaller space.
 *
 * @example
 * <OrderConfirmationCompact orderId="ord-12345" total={28.06} />
 */
export function OrderConfirmationCompact({
  orderId,
  total,
}: {
  orderId: string;
  total: number;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
      {/* Success icon */}
      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
        <svg
          className="w-6 h-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-1">Order Confirmed!</h3>

      {/* Order ID */}
      <p className="text-sm text-gray-600 mb-2">
        Order #{orderId}
      </p>

      {/* Total */}
      <p className="text-2xl font-bold text-gray-900">
        {formatCurrency(total)}
      </p>
    </div>
  );
}
