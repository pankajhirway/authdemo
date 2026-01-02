/**
 * Checkout page for completing the ordering process.
 *
 * Multi-step checkout flow:
 * 1. Review - Review order items and details
 * 2. Payment - Enter payment information (mock)
 * 3. Confirmation - Display order confirmation
 *
 * Route: /checkout
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { OrderReview, OrderReviewSkeleton, type DeliveryMethod } from "../components/checkout/OrderReview";
import { PaymentForm, PaymentFormSkeleton, type PaymentData } from "../components/checkout/PaymentForm";
import { OrderConfirmation } from "../components/checkout/OrderConfirmation";
import { useCart, useCartItems, useCartActions, useCartSummary } from "../store/cart";
import { operatorApi } from "../lib/api";
import type { CreateDataEntryRequest } from "../types/api";
import { cn, formatCurrency } from "../lib/utils";

/**
 * Checkout step type.
 */
type CheckoutStep = "review" | "payment" | "confirmation";

/**
 * Delivery fee for delivery option.
 */
const DELIVERY_FEE = 4.99;

/**
 * Mock customer info for demo purposes.
 * In production, this would come from user profile or be entered during checkout.
 */
const DEMO_CUSTOMER_INFO = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "(555) 123-4567",
};

/**
 * Checkout page component.
 *
 * Multi-step checkout flow with:
 * - Step 1: Review order items, delivery selection
 * - Step 2: Enter payment information (mock)
 * - Step 3: Display confirmation with order details
 *
 * Features:
 * - Step-by-step progression
 * - Order summary at each step
 * - Delivery method selection
 * - Mock payment processing
 * - Cart cleared after successful order
 * - Redirects if cart is empty
 * - Loading states for each step
 * - Back navigation support
 * - Accessibility support
 *
 * @returns Checkout page component
 */
export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const cartItems = useCartItems();
  const { clearCart } = useCartActions();
  const cartSummary = useCartSummary();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("review");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [orderInstructions, setOrderInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Redirect to cart if empty.
   */
  useEffect(() => {
    if (cartItems.length === 0 && currentStep !== "confirmation") {
      navigate("/cart");
    }
  }, [cartItems.length, currentStep, navigate]);

  /**
   * Calculate final total with delivery fee.
   */
  const finalTotal = useMemo(() => {
    const deliveryFee = deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
    return cartSummary.total + deliveryFee;
  }, [cartSummary.total, deliveryMethod]);

  /**
   * Calculate estimated preparation time.
   */
  const estimatedTime = useMemo(() => {
    const maxPrepTime = cartItems.reduce((max, item) => {
      return Math.max(max, item.menuItem.prepTimeMinutes);
    }, 15);
    return deliveryMethod === "delivery" ? maxPrepTime + 10 : maxPrepTime;
  }, [cartItems, deliveryMethod]);

  /**
   * Handle delivery method change.
   */
  const handleDeliveryChange = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
  };

  /**
   * Handle proceed to payment.
   */
  const handleProceedToPayment = () => {
    setCurrentStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Handle back to review.
   */
  const handleBackToReview = () => {
    setCurrentStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Handle payment submission.
   * Creates order in backend and submits for approval.
   */
  const handlePaymentSubmit = async (paymentData: PaymentData) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Prepare order data for backend
      const orderData: CreateDataEntryRequest = {
        data: {
          items: cartItems.map((item) => ({
            menuItemId: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions || null,
          })),
          deliveryMethod,
          deliveryFee: deliveryMethod === "delivery" ? DELIVERY_FEE : 0,
          subtotal: cartSummary.subtotal,
          tax: cartSummary.tax,
          total: finalTotal,
          customerName: DEMO_CUSTOMER_INFO.name,
          customerEmail: DEMO_CUSTOMER_INFO.email,
          customerPhone: DEMO_CUSTOMER_INFO.phone,
          orderInstructions: orderInstructions || null,
        },
        entry_type: "order",
      };

      // Create order in backend
      const createResponse = await operatorApi.createDataEntry(orderData);
      const entryId = createResponse.entry_id;

      // Submit order for approval
      await operatorApi.submitDataEntry(entryId);

      // Use the backend entry_id as order ID
      setOrderId(entryId);

      // Move to confirmation step
      setCurrentStep("confirmation");

      // Clear cart after successful order
      clearCart();

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // Handle API error
      const errorMessage = err instanceof Error ? err.message : "Failed to process order. Please try again.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle payment cancel.
   */
  const handlePaymentCancel = () => {
    handleBackToReview();
  };

  // Show loading state
  if (!cart && currentStep !== "confirmation") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto">
            <OrderReviewSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Confirmation step - show full page confirmation
  if (currentStep === "confirmation" && orderId) {
    return (
      <OrderConfirmation
        orderId={orderId}
        items={cartItems}
        total={finalTotal}
        estimatedTime={estimatedTime}
        status="submitted"
        deliveryMethod={deliveryMethod}
        customerName={DEMO_CUSTOMER_INFO.name}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-medium",
              "text-gray-600 hover:text-gray-900 transition-colors mb-4"
            )}
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">
            Complete your order in just a few steps
          </p>
        </div>

        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center max-w-md mx-auto">
            {/* Step 1: Review */}
            <div className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors",
                  currentStep === "review" || currentStep === "payment"
                    ? "bg-blue-600 text-white"
                    : "bg-green-600 text-white"
                )}
                aria-label="Review step"
              >
                {currentStep === "confirmation" ? (
                  <svg
                    className="w-5 h-5"
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
                ) : (
                  "1"
                )}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:inline">
                Review
              </span>
            </div>

            {/* Connector */}
            <div
              className={cn(
                "w-12 sm:w-24 h-1 mx-2",
                (currentStep === "payment" || currentStep === "confirmation")
                  ? "bg-blue-600"
                  : "bg-gray-300"
              )}
              aria-hidden="true"
            />

            {/* Step 2: Payment */}
            <div className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors",
                  currentStep === "review"
                    ? "bg-gray-300 text-gray-600"
                    : currentStep === "payment"
                    ? "bg-blue-600 text-white"
                    : "bg-green-600 text-white"
                )}
                aria-label="Payment step"
              >
                {currentStep === "confirmation" ? (
                  <svg
                    className="w-5 h-5"
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
                ) : (
                  "2"
                )}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:inline">
                Payment
              </span>
            </div>

            {/* Connector */}
            <div
              className={cn(
                "w-12 sm:w-24 h-1 mx-2",
                currentStep === "confirmation" ? "bg-blue-600" : "bg-gray-300"
              )}
              aria-hidden="true"
            />

            {/* Step 3: Confirmation */}
            <div className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors",
                  currentStep === "confirmation"
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-600"
                )}
                aria-label="Confirmation step"
              >
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:inline">
                Confirm
              </span>
            </div>
          </div>
        </div>

        {/* Checkout content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Main content area */}
          <div className="lg:col-span-2">
            {currentStep === "review" && (
              <OrderReview
                items={cartItems}
                summary={cartSummary}
                deliveryMethod={deliveryMethod}
                customerName={DEMO_CUSTOMER_INFO.name}
                customerEmail={DEMO_CUSTOMER_INFO.email}
                customerPhone={DEMO_CUSTOMER_INFO.phone}
                orderInstructions={orderInstructions}
                onEditDelivery={() => {
                  // In production, this would open a delivery options modal
                  // For demo, we just toggle between pickup/delivery
                  handleDeliveryChange(deliveryMethod === "pickup" ? "delivery" : "pickup");
                }}
                onEditItems={() => navigate("/cart")}
              />
            )}

            {currentStep === "payment" && (
              <>
                {/* Error display */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-900 mb-1">
                          Order Processing Error
                        </h3>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Dismiss error"
                      >
                        <svg
                          className="w-5 h-5"
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
                    </div>
                  </div>
                )}
                <PaymentForm
                  total={finalTotal}
                  isProcessing={isProcessing}
                  onSubmit={handlePaymentSubmit}
                  onCancel={handlePaymentCancel}
                />
              </>
            )}
          </div>

          {/* Sidebar - actions and additional info */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Order summary sidebar */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

                {/* Item count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Items</span>
                  <span className="font-medium text-gray-900">
                    {cart.itemCount}
                  </span>
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(cartSummary.subtotal)}
                  </span>
                </div>

                {/* Tax */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(cartSummary.tax)}
                  </span>
                </div>

                {/* Delivery fee */}
                {deliveryMethod === "delivery" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(DELIVERY_FEE)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action button */}
              {currentStep === "review" && (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className={cn(
                    "w-full py-3 px-4 rounded-lg font-medium text-white transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                  )}
                >
                  Proceed to Payment • {formatCurrency(finalTotal)}
                </button>
              )}

              {/* Security notice */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
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
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900 mb-1">
                      Secure checkout
                    </p>
                    <p className="text-xs">
                      Your payment information is encrypted and secure. We do not store your card details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Checkout page with sidebar layout variant.
 *
 * Alternative layout with persistent sidebar for summary.
 *
 * @example
 * <CheckoutPageWithSidebar />
 */
export function CheckoutPageWithSidebar() {
  const navigate = useNavigate();
  const cartItems = useCartItems();
  const cartSummary = useCartSummary();

  const handleProceedToPayment = () => {
    // Navigate to payment step
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <main className="flex-1">
            <OrderReview
              items={cartItems}
              summary={cartSummary}
              deliveryMethod="pickup"
              onEditItems={() => navigate("/cart")}
            />
          </main>

          {/* Sidebar */}
          <aside className="lg:w-96 flex-shrink-0">
            <div className="sticky top-8 space-y-4">
              <div className="bg-white rounded-lg border p-6 space-y-4">
                <h2 className="font-semibold">Order Summary</h2>
                {/* Summary details */}
              </div>

              <button
                onClick={handleProceedToPayment}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Proceed to Payment
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
