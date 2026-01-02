/**
 * Shopping Cart page for reviewing and managing order items.
 *
 * Displays all items in the cart with quantity controls, special instructions,
 * and order summary. Users can modify quantities, remove items, add discount codes,
 * and proceed to checkout.
 *
 * Route: /cart
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CartItem, CartItemSkeleton } from "../components/cart/CartItem";
import { CartSummary, CartSummarySkeleton } from "../components/cart/CartSummary";
import { useCart, useCartItems, useCartActions, useCartSummary } from "../store/cart";
import { cn } from "../lib/utils";

/**
 * Number of skeleton items to show while loading.
 */
const SKELETON_COUNT = 3;

/**
 * Shopping cart page component.
 *
 * Main cart page with:
 * - List of all cart items with controls
 * - Order summary with tax and total
 * - Discount code input
 * - Checkout button
 * - Continue shopping link
 * - Empty state with call to action
 *
 * Features:
 * - Responsive layout (stacked on mobile, side-by-side on desktop)
 * - Loading skeleton for initial load
 * - Empty state with menu link
 * - Real-time total calculation
 * - Item count in header
 * - Accessibility support
 *
 * @returns Cart page component
 */
export function CartPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const cartItems = useCartItems();
  const { clearCart } = useCartActions();
  const cartSummary = useCartSummary();

  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle clear cart click.
   */
  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  /**
   * Handle checkout button click.
   */
  const handleCheckout = () => {
    // Navigate to checkout page
    navigate("/checkout");
  };

  /**
   * Handle continue shopping click.
   */
  const handleContinueShopping = () => {
    navigate("/menu");
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items skeleton */}
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <CartItemSkeleton key={i} />
              ))}
            </div>

            {/* Summary skeleton */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-8">
                <CartSummarySkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-2">
              Review your items before checkout
            </p>
          </div>

          {/* Empty state */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            {/* Empty cart icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>

            {/* Empty state message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Browse our
              menu to find delicious dishes!
            </p>

            {/* Browse menu button */}
            <Link
              to="/menu"
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white",
                "rounded-lg font-medium hover:bg-blue-700 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              )}
            >
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              Browse Menu
            </Link>

            {/* Quick category links */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-4">
                Quick links:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/menu?category=appetizers"
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Appetizers
                </Link>
                <Link
                  to="/menu?category=entrees"
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Entrees
                </Link>
                <Link
                  to="/menu?category=drinks"
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Drinks
                </Link>
                <Link
                  to="/menu?category=desserts"
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Desserts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cart with items
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-2">
              {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          {/* Clear cart button */}
          {!showClearConfirm ? (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium",
                "text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear Cart
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearCart}
                className={cn(
                  "px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg",
                  "hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                )}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                )}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Cart content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items list */}
          <div className="lg:col-span-2 space-y-4">
            {/* Items list header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Cart Items ({cartItems.length})
              </h2>
              <Link
                to="/menu"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                + Add more items
              </Link>
            </div>

            {/* Cart items */}
            <div role="list" aria-label="Items in your cart">
              {cartItems.map((item) => (
                <CartItem
                  key={item.menuItem.id}
                  item={item}
                  showRemoveConfirmation
                />
              ))}
            </div>
          </div>

          {/* Cart summary sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <CartSummary
                summary={cartSummary}
                onCheckout={handleCheckout}
                onContinueShopping={handleContinueShopping}
                showDiscountCode
              />
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Secure checkout */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Secure Checkout
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Your payment information is safe and secure
                </p>
              </div>
            </div>

            {/* Easy returns */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Satisfaction Guaranteed
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Not happy? We'll make it right
                </p>
              </div>
            </div>

            {/* Fast delivery */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Fast Preparation
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Orders ready in 15-20 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cart page with sidebar layout variant.
 *
 * Alternative layout with persistent sidebar for summary.
 *
 * @example
 * <CartPageWithSidebar />
 */
export function CartPageWithSidebar() {
  const navigate = useNavigate();
  const cartItems = useCartItems();
  const cartSummary = useCartSummary();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const handleContinueShopping = () => {
    navigate("/menu");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">Review your order before checkout</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <main className="flex-1">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <p className="text-gray-600">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItem key={item.menuItem.id} item={item} />
                ))}
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:w-96 flex-shrink-0">
            <div className="sticky top-8">
              <CartSummary
                summary={cartSummary}
                onCheckout={handleCheckout}
                onContinueShopping={handleContinueShopping}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
