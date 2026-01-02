/**
 * MenuItemCard component for displaying individual menu items.
 *
 * Shows menu item details including image, name, description, price,
 * dietary information, and add to cart functionality.
 *
 * @example
 * <MenuItemCard
 *   item={menuItem}
 *   onAddToCart={(item) => addItemToCart(item)}
 *   isInCart={isItemInCart(item.id)}
 *   quantityInCart={getItemQuantity(item.id)}
 * />
 */

import { useState } from "react";
import { cn, formatCurrency } from "../../lib/utils";
import type { MenuItem } from "../../types/menu";
import { useCartActions, useCartItemCount } from "../../store/cart";

/**
 * Props for the MenuItemCard component.
 */
interface MenuItemCardProps {
  /** The menu item to display */
  item: MenuItem;
  /** Callback when add to cart is clicked */
  onAddToCart?: (item: MenuItem) => void;
  /** Additional CSS classes for the card container */
  className?: string;
  /** Whether to show the add to cart button */
  showAddButton?: boolean;
  /** Whether to show dietary badges */
  showDietary?: boolean;
  /** Display variant: "default", "compact", or "horizontal" */
  variant?: "default" | "compact" | "horizontal";
}

/**
 * Dietary badge configuration.
 * Maps dietary flags to display colors and labels.
 */
const DIETARY_BADGES = {
  vegetarian: {
    label: "Vegetarian",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
    icon: "🌱",
  },
  vegan: {
    label: "Vegan",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
    icon: "🌿",
  },
  glutenFree: {
    label: "Gluten-Free",
    bgColor: "bg-amber-100",
    textColor: "text-amber-800",
    borderColor: "border-amber-200",
    icon: "🌾",
  },
  spicy: {
    label: "Spicy",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-200",
    icon: "🌶️",
  },
};

/**
 * MenuItemCard component.
 *
 * Displays a menu item with all relevant information in an attractive card format.
 * Includes image, name, description, price, dietary badges, and add to cart button.
 *
 * Features:
 * - Three display variants for different layouts
 * - Dietary badges for vegetarian, vegan, gluten-free, and spicy items
 * - Add to cart integration with cart store
 * - Quantity indicator if item is already in cart
 * - Hover effects and smooth transitions
 * - Accessibility support
 *
 * @param props - Component props
 * @returns Menu item card component
 */
export function MenuItemCard({
  item,
  onAddToCart,
  className,
  showAddButton = true,
  showDietary = true,
  variant = "default",
}: MenuItemCardProps) {
  const { addItem } = useCartActions();
  const [isAdding, setIsAdding] = useState(false);
  const quantityInCart = useCartItemCount();

  /**
   * Handle add to cart click.
   */
  const handleAddToCart = async () => {
    if (isAdding) return;

    setIsAdding(true);
    try {
      // Add item to cart with quantity 1
      addItem(
        { menuItem: item, quantity: 1 },
        { quantity: 1, merge: true }
      );

      // Call custom callback if provided
      if (onAddToCart) {
        onAddToCart(item);
      }

      // Brief loading state for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Get dietary badges for the item.
   */
  const dietaryBadges = Object.entries(DIETARY_BADGES).filter(
    ([key]) => item.dietary[key as keyof typeof item.dietary]
  );

  const itemQuantity = quantityInCart(item.id);
  const hasItemInCart = itemQuantity > 0;

  // Horizontal variant - side-by-side layout
  if (variant === "horizontal") {
    return (
      <div
        className={cn(
          "flex gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200",
          !item.available && "opacity-60 grayscale",
          className
        )}
        data-item-id={item.id}
      >
        {/* Image */}
        <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">
              {item.name}
            </h3>

            {/* Dietary badges */}
            {showDietary && dietaryBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {dietaryBadges.map(([key, badge]) => (
                  <span
                    key={key}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border",
                      badge.bgColor,
                      badge.textColor,
                      badge.borderColor
                    )}
                    title={badge.label}
                  >
                    <span aria-hidden="true">{badge.icon}</span>
                    <span className="hidden sm:inline">{badge.label}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {item.description}
            </p>
          </div>

          {/* Price and action */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(item.price)}
            </span>

            {showAddButton && item.available && (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  hasItemInCart
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700",
                  isAdding && "cursor-wait opacity-75"
                )}
                aria-label={`Add ${item.name} to cart`}
              >
                {isAdding ? (
                  "Adding..."
                ) : hasItemInCart ? (
                  <>
                    <span className="hidden sm:inline">Add More</span>
                    <span className="sm:hidden">+{itemQuantity}</span>
                  </>
                ) : (
                  "Add to Cart"
                )}
              </button>
            )}

            {!item.available && (
              <span className="text-sm font-medium text-gray-500">
                Sold Out
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact variant - smaller card for grid layouts
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "group flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden",
          !item.available && "opacity-60 grayscale",
          className
        )}
        data-item-id={item.id}
      >
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Price overlay */}
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm">
            <span className="font-bold text-gray-900">
              {formatCurrency(item.price)}
            </span>
          </div>

          {/* Quantity badge if in cart */}
          {hasItemInCart && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-sm font-medium shadow-sm">
              {itemQuantity} in cart
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
            {item.name}
          </h3>

          {showDietary && dietaryBadges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {dietaryBadges.slice(0, 2).map(([key, badge]) => (
                <span
                  key={key}
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    badge.bgColor,
                    badge.textColor
                  )}
                  title={badge.label}
                  aria-label={badge.label}
                >
                  {badge.icon}
                </span>
              ))}
              {dietaryBadges.length > 2 && (
                <span className="text-xs text-gray-500 px-1.5 py-0.5">
                  +{dietaryBadges.length - 2}
                </span>
              )}
            </div>
          )}

          {showAddButton && item.available && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={cn(
                "mt-auto pt-3 text-sm font-medium transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 rounded",
                hasItemInCart
                  ? "text-green-600 hover:text-green-700"
                  : "text-blue-600 hover:text-blue-700",
                isAdding && "cursor-wait opacity-75"
              )}
              aria-label={`Add ${item.name} to cart`}
            >
              {isAdding ? "Adding..." : hasItemInCart ? "Add More" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default variant - full card layout
  return (
    <div
      className={cn(
        "group flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden",
        !item.available && "opacity-60 grayscale",
        className
      )}
      data-item-id={item.id}
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Price overlay */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(item.price)}
          </span>
        </div>

        {/* Quantity badge if in cart */}
        {hasItemInCart && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-sm font-medium shadow-md flex items-center gap-1">
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>{itemQuantity}</span>
          </div>
        )}

        {/* Available badge */}
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg px-4 py-2 bg-gray-900 rounded-lg">
              Sold Out
            </span>
          </div>
        )}

        {/* Prep time indicator */}
        {item.prepTimeMinutes && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 flex items-center gap-1 shadow-sm">
            <svg
              className="w-3.5 h-3.5"
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
            <span>{item.prepTimeMinutes} min</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title and badges */}
        <div className="space-y-2">
          <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
            {item.name}
          </h3>

          {/* Dietary badges */}
          {showDietary && dietaryBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dietaryBadges.map(([key, badge]) => (
                <span
                  key={key}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border",
                    badge.bgColor,
                    badge.textColor,
                    badge.borderColor
                  )}
                  title={badge.label}
                >
                  <span aria-hidden="true">{badge.icon}</span>
                  <span className="hidden sm:inline">{badge.label}</span>
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2">
            {item.description}
          </p>
        </div>

        {/* Action button */}
        {showAddButton && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || !item.available}
              className={cn(
                "w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "flex items-center justify-center gap-2",
                hasItemInCart
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
                (isAdding || !item.available) && "cursor-wait opacity-75"
              )}
              aria-label={`Add ${item.name} to cart`}
            >
              {isAdding ? (
                <>
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
                  Adding...
                </>
              ) : hasItemInCart ? (
                <>
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
                  Add More ({itemQuantity})
                </>
              ) : (
                <>
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * MenuItemCardSkeleton component.
 *
 * Loading skeleton for the menu item card.
 * Shows while menu data is being loaded.
 *
 * @example
 * <MenuItemCardSkeleton />
 */
export function MenuItemCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4" />

        {/* Badges skeleton */}
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-16" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>

        {/* Button skeleton */}
        <div className="h-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
