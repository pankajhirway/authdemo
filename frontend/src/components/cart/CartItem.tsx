/**
 * CartItem component for displaying items in the shopping cart.
 *
 * Shows a single cart item with image, name, price, quantity controls,
 * and remove button. Integrates with the cart store for state management.
 *
 * @example
 * <CartItem
 *   item={cartItem}
 *   onRemove={() => removeItem(item.menuItem.id)}
 * />
 */

import { useState } from "react";
import { cn, formatCurrency } from "../../lib/utils";
import type { CartItem as CartItemType } from "../../types/menu";
import { useCartActions } from "../../store/cart";

/**
 * Props for the CartItem component.
 */
interface CartItemProps {
  /** The cart item to display */
  item: CartItemType;
  /** Whether to show remove confirmation dialog */
  showRemoveConfirmation?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Quantity control step size.
 */
const QUANTITY_STEP = 1;

/**
 * Minimum and maximum quantity limits.
 */
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

/**
 * CartItem component.
 *
 * Displays a single item in the shopping cart with:
 * - Item image and details
 * - Price and quantity display
 * - Quantity increment/decrement controls
 * - Remove button with confirmation
 * - Special instructions input (optional)
 * - Item total calculation
 *
 * Features:
 * - Responsive layout (horizontal on mobile, stacked on desktop)
 * - Keyboard-accessible quantity controls
 * - Loading state for updates
 * - Accessibility support with ARIA labels
 * - Smooth transitions for interactions
 *
 * @param props - Component props
 * @returns Cart item component
 */
export function CartItem({
  item,
  showRemoveConfirmation = true,
  className,
}: CartItemProps) {
  const { menuItem, quantity, specialInstructions = "" } = item;
  const { updateQuantity, incrementItem, decrementItem, removeItem, updateInstructions } =
    useCartActions();

  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [instructions, setInstructions] = useState(specialInstructions);

  /**
   * Calculate line item total.
   */
  const itemTotal = menuItem.price * quantity;

  /**
   * Handle quantity increment.
   */
  const handleIncrement = async () => {
    if (isUpdating || quantity >= MAX_QUANTITY) return;

    setIsUpdating(true);
    try {
      incrementItem(menuItem.id);
      await new Promise((resolve) => setTimeout(resolve, 200));
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handle quantity decrement.
   */
  const handleDecrement = async () => {
    if (isUpdating || quantity <= MIN_QUANTITY) return;

    setIsUpdating(true);
    try {
      decrementItem(menuItem.id);
      await new Promise((resolve) => setTimeout(resolve, 200));
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handle direct quantity change.
   */
  const handleQuantityChange = async (newQuantity: number) => {
    if (isUpdating) return;

    const clampedQuantity = Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, newQuantity));

    if (clampedQuantity !== quantity) {
      setIsUpdating(true);
      try {
        updateQuantity(menuItem.id, clampedQuantity);
        await new Promise((resolve) => setTimeout(resolve, 200));
      } finally {
        setIsUpdating(false);
      }
    }
  };

  /**
   * Handle remove item click.
   */
  const handleRemoveClick = () => {
    if (showRemoveConfirmation) {
      setShowConfirm(true);
    } else {
      removeItem(menuItem.id);
    }
  };

  /**
   * Confirm remove item.
   */
  const handleConfirmRemove = () => {
    removeItem(menuItem.id);
    setShowConfirm(false);
  };

  /**
   * Cancel remove item.
   */
  const handleCancelRemove = () => {
    setShowConfirm(false);
  };

  /**
   * Handle instructions save.
   */
  const handleSaveInstructions = () => {
    updateInstructions(menuItem.id, instructions);
    setIsEditingInstructions(false);
  };

  /**
   * Handle instructions cancel.
   */
  const handleCancelInstructions = () => {
    setInstructions(specialInstructions);
    setIsEditingInstructions(false);
  };

  return (
    <div
      className={cn(
        "group flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}
      data-cart-item-id={menuItem.id}
    >
      {/* Item image */}
      <div className="flex-shrink-0 w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={menuItem.image}
          alt={menuItem.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Item details */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title and price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base line-clamp-1">
              {menuItem.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatCurrency(menuItem.price)} each
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900 text-lg">
              {formatCurrency(itemTotal)}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {menuItem.description}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Quantity selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Qty:</span>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              {/* Decrement button */}
              <button
                type="button"
                onClick={handleDecrement}
                disabled={isUpdating || quantity <= MIN_QUANTITY}
                className={cn(
                  "px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:inset-ring-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "aria-label:Decrement quantity"
                )}
                aria-label="Decrement quantity"
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
                    d="M20 12H4"
                  />
                </svg>
              </button>

              {/* Quantity display */}
              <input
                type="number"
                min={MIN_QUANTITY}
                max={MAX_QUANTITY}
                step={QUANTITY_STEP}
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    handleQuantityChange(value);
                  }
                }}
                disabled={isUpdating}
                className={cn(
                  "w-12 text-center text-sm font-medium text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:inset-0",
                  "disabled:bg-gray-50 disabled:cursor-wait",
                  "appearance-none m-0"
                )}
                aria-label={`Quantity, currently ${quantity}`}
              />

              {/* Increment button */}
              <button
                type="button"
                onClick={handleIncrement}
                disabled={isUpdating || quantity >= MAX_QUANTITY}
                className={cn(
                  "px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:inset-ring-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label="Increment quantity"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Remove button */}
          {!showConfirm ? (
            <button
              type="button"
              onClick={handleRemoveClick}
              disabled={isUpdating}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium",
                "text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label={`Remove ${menuItem.name} from cart`}
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
              <span className="hidden sm:inline">Remove</span>
            </button>
          ) : (
            // Remove confirmation buttons
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmRemove}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg",
                  "hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                )}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={handleCancelRemove}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                )}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Special instructions section */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {!isEditingInstructions ? (
            <button
              type="button"
              onClick={() => setIsEditingInstructions(true)}
              className={cn(
                "text-sm text-gray-600 hover:text-blue-600 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              )}
            >
              {specialInstructions ? (
                <>
                  <span className="font-medium">Special instructions:</span>{" "}
                  <span>"{specialInstructions}"</span>
                </>
              ) : (
                <span className="text-blue-600">+ Add special instructions</span>
              )}
            </button>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor={`instructions-${menuItem.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                Special instructions
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id={`instructions-${menuItem.id}`}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., No onions, on the side..."
                  className={cn(
                    "flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "placeholder:text-gray-400"
                  )}
                  maxLength={200}
                />
                <button
                  type="button"
                  onClick={handleSaveInstructions}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg",
                    "hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  )}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelInstructions}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  )}
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {instructions.length}/200 characters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <svg
              className="animate-spin h-4 w-4"
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
            Updating...
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CartItemSkeleton component.
 *
 * Loading skeleton for the cart item.
 * Shows while cart data is being loaded.
 *
 * @example
 * <CartItemSkeleton />
 */
export function CartItemSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-gray-200 animate-pulse">
      {/* Image skeleton */}
      <div className="flex-shrink-0 w-full sm:w-24 h-24 bg-gray-200 rounded-lg" />

      {/* Content skeleton */}
      <div className="flex-1 space-y-3">
        {/* Title skeleton */}
        <div className="h-5 bg-gray-200 rounded w-1/2" />

        {/* Price skeleton */}
        <div className="h-4 bg-gray-200 rounded w-24" />

        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Controls skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
