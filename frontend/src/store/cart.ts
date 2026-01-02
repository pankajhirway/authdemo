/**
 * Zustand store for shopping cart state and operations.
 * Manages cart items, quantities, and totals with persistence.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../types/menu";
import type {
  CartState,
  AddToCartOptions,
  UpdateQuantityOptions,
  CartSummary,
  CartStats,
} from "../types/cart";

/**
 * Cart store state interface.
 * Extends base CartState with computed properties.
 */
interface CartStoreState {
  /** Current cart state */
  cart: CartState;
}

/**
 * Cart store actions.
 * Provides methods to manipulate cart state.
 */
interface CartActions {
  /** Add an item to the cart */
  addItem: (item: CartItem, options?: AddToCartOptions) => void;
  /** Remove an item from the cart by menu item ID */
  removeItem: (menuItemId: string) => void;
  /** Update the quantity of an item in the cart */
  updateQuantity: (menuItemId: string, quantity: number, options?: UpdateQuantityOptions) => void;
  /** Increment item quantity by 1 */
  incrementItem: (menuItemId: string) => void;
  /** Decrement item quantity by 1 */
  decrementItem: (menuItemId: string) => void;
  /** Clear all items from the cart */
  clearCart: () => void;
  /** Update special instructions for an item */
  updateInstructions: (menuItemId: string, instructions: string) => void;
  /** Check if an item is in the cart */
  hasItem: (menuItemId: string) => boolean;
  /** Get quantity of a specific item in the cart */
  getItemQuantity: (menuItemId: string) => number;
  /** Get cart summary with tax calculations */
  getCartSummary: (taxRate?: number) => CartSummary;
  /** Get cart statistics */
  getCartStats: () => CartStats;
  /** Restore cart from saved state */
  restoreCart: (savedCart: CartState) => void;
}

/**
 * Combined cart store interface.
 */
type CartStore = CartStoreState & CartActions;

/**
 * Calculate total price of all items in the cart.
 */
function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
}

/**
 * Calculate total number of items (sum of quantities).
 */
function calculateCartItemCount(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Find existing cart item by menu item ID.
 */
function findItemByMenuId(items: CartItem[], menuItemId: string): number {
  return items.findIndex((item) => item.menuItem.id === menuItemId);
}

/**
 * Create the Zustand cart store with localStorage persistence.
 * Uses zustand persist middleware to save cart across sessions.
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: {
        items: [],
        total: 0,
        itemCount: 0,
      },

      /**
       * Add an item to the cart.
       * If the item already exists and merge is true, increment quantity.
       * Otherwise, add as a new item.
       *
       * @param item - The cart item to add
       * @param options - Add options (quantity, specialInstructions, merge)
       */
      addItem: (item, options = {}) => {
        const { quantity = 1, specialInstructions, merge = true } = options;
        const { cart } = get();

        const existingIndex = findItemByMenuId(cart.items, item.menuItem.id);

        let newItems: CartItem[];

        if (existingIndex >= 0 && merge) {
          // Update existing item quantity
          newItems = cart.items.map((cartItem, index) =>
            index === existingIndex
              ? {
                  ...cartItem,
                  quantity: cartItem.quantity + quantity,
                  specialInstructions: specialInstructions ?? cartItem.specialInstructions,
                }
              : cartItem
          );
        } else {
          // Add new item
          newItems = [
            ...cart.items,
            {
              ...item,
              quantity,
              specialInstructions,
            },
          ];
        }

        set({
          cart: {
            items: newItems,
            total: calculateCartTotal(newItems),
            itemCount: calculateCartItemCount(newItems),
          },
        });
      },

      /**
       * Remove an item from the cart by menu item ID.
       *
       * @param menuItemId - The ID of the menu item to remove
       */
      removeItem: (menuItemId) => {
        const { cart } = get();
        const newItems = cart.items.filter((item) => item.menuItem.id !== menuItemId);

        set({
          cart: {
            items: newItems,
            total: calculateCartTotal(newItems),
            itemCount: calculateCartItemCount(newItems),
          },
        });
      },

      /**
       * Update the quantity of an item in the cart.
       * If quantity reaches 0 and removeIfZero is true, removes the item.
       *
       * @param menuItemId - The ID of the menu item to update
       * @param quantity - The new quantity
       * @param options - Update options (min, max, removeIfZero)
       */
      updateQuantity: (menuItemId, quantity, options = {}) => {
        const { min = 0, max = 99, removeIfZero = true } = options;
        const { cart } = get();
        const existingIndex = findItemByMenuId(cart.items, menuItemId);

        if (existingIndex === -1) {
          return; // Item not in cart
        }

        // Clamp quantity between min and max
        const clampedQuantity = Math.max(min, Math.min(max, quantity));

        let newItems: CartItem[];

        if (clampedQuantity === 0 && removeIfZero) {
          // Remove item if quantity is 0
          newItems = cart.items.filter((item) => item.menuItem.id !== menuItemId);
        } else {
          // Update quantity
          newItems = cart.items.map((item, index) =>
            index === existingIndex ? { ...item, quantity: clampedQuantity } : item
          );
        }

        set({
          cart: {
            items: newItems,
            total: calculateCartTotal(newItems),
            itemCount: calculateCartItemCount(newItems),
          },
        });
      },

      /**
       * Increment item quantity by 1.
       *
       * @param menuItemId - The ID of the menu item to increment
       */
      incrementItem: (menuItemId) => {
        const { cart } = get();
        const existingIndex = findItemByMenuId(cart.items, menuItemId);

        if (existingIndex === -1) {
          return; // Item not in cart
        }

        const item = cart.items[existingIndex];
        get().updateQuantity(menuItemId, item.quantity + 1);
      },

      /**
       * Decrement item quantity by 1.
       * Removes item if quantity reaches 0.
       *
       * @param menuItemId - The ID of the menu item to decrement
       */
      decrementItem: (menuItemId) => {
        const { cart } = get();
        const existingIndex = findItemByMenuId(cart.items, menuItemId);

        if (existingIndex === -1) {
          return; // Item not in cart
        }

        const item = cart.items[existingIndex];
        get().updateQuantity(menuItemId, item.quantity - 1);
      },

      /**
       * Clear all items from the cart.
       */
      clearCart: () => {
        set({
          cart: {
            items: [],
            total: 0,
            itemCount: 0,
          },
        });
      },

      /**
       * Update special instructions for an item.
       *
       * @param menuItemId - The ID of the menu item to update
       * @param instructions - New special instructions
       */
      updateInstructions: (menuItemId, instructions) => {
        const { cart } = get();
        const existingIndex = findItemByMenuId(cart.items, menuItemId);

        if (existingIndex === -1) {
          return; // Item not in cart
        }

        const newItems = cart.items.map((item, index) =>
          index === existingIndex ? { ...item, specialInstructions: instructions } : item
        );

        set({
          cart: {
            items: newItems,
            total: calculateCartTotal(newItems),
            itemCount: calculateCartItemCount(newItems),
          },
        });
      },

      /**
       * Check if an item is in the cart.
       *
       * @param menuItemId - The ID of the menu item to check
       * @returns true if item is in cart, false otherwise
       */
      hasItem: (menuItemId) => {
        const { cart } = get();
        return findItemByMenuId(cart.items, menuItemId) !== -1;
      },

      /**
       * Get quantity of a specific item in the cart.
       *
       * @param menuItemId - The ID of the menu item
       * @returns Quantity of item, or 0 if not in cart
       */
      getItemQuantity: (menuItemId) => {
        const { cart } = get();
        const existingIndex = findItemByMenuId(cart.items, menuItemId);
        return existingIndex >= 0 ? cart.items[existingIndex].quantity : 0;
      },

      /**
       * Get cart summary with tax calculations.
       *
       * @param taxRate - Tax rate as decimal (default: 0.08 for 8%)
       * @returns Cart summary with subtotal, tax, and total
       */
      getCartSummary: (taxRate = 0.08) => {
        const { cart } = get();
        const subtotal = cart.total;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;
        const uniqueItems = cart.items.length;
        const totalQuantity = cart.itemCount;

        return {
          subtotal,
          tax,
          total,
          itemCount: uniqueItems,
          totalQuantity,
        };
      },

      /**
       * Get cart statistics.
       *
       * @returns Cart statistics including most/least expensive items
       */
      getCartStats: () => {
        const { cart } = get();
        const { items } = cart;

        if (items.length === 0) {
          return {
            uniqueItems: 0,
            totalQuantity: 0,
            mostExpensive: null,
            leastExpensive: null,
          };
        }

        // Sort items by price to find most/least expensive
        const sortedByPrice = [...items].sort(
          (a, b) => b.menuItem.price - a.menuItem.price
        );

        return {
          uniqueItems: items.length,
          totalQuantity: cart.itemCount,
          mostExpensive: sortedByPrice[0],
          leastExpensive: sortedByPrice[sortedByPrice.length - 1],
        };
      },

      /**
       * Restore cart from saved state.
       * Used for recovering cart after session expiry or migration.
       *
       * @param savedCart - Previously saved cart state
       */
      restoreCart: (savedCart) => {
        set({
          cart: {
            items: savedCart.items,
            total: calculateCartTotal(savedCart.items),
            itemCount: calculateCartItemCount(savedCart.items),
          },
        });
      },
    }),
    {
      name: "cart-storage", // localStorage key
      partialize: (state) => ({ cart: state.cart }), // Only persist cart state
    }
  )
);

/**
 * Selector hooks for optimized re-renders.
 * Use these in components to subscribe only to specific state slices.
 */

/**
 * Get the entire cart state.
 */
export const useCart = () => useCartStore((state) => state.cart);

/**
 * Get cart items array.
 */
export const useCartItems = () => useCartStore((state) => state.cart.items);

/**
 * Get cart total price.
 */
export const useCartTotal = () => useCartStore((state) => state.cart.total);

/**
 * Get cart item count (total quantity).
 */
export const useCartItemCount = () => useCartStore((state) => state.cart.itemCount);

/**
 * Get whether cart is empty.
 */
export const useIsCartEmpty = () => useCartStore((state) => state.cart.items.length === 0);

/**
 * Get cart actions (addItem, removeItem, etc.).
 */
export const useCartActions = () =>
  useCartStore((state) => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    incrementItem: state.incrementItem,
    decrementItem: state.decrementItem,
    clearCart: state.clearCart,
    updateInstructions: state.updateInstructions,
    hasItem: state.hasItem,
    getItemQuantity: state.getItemQuantity,
    getCartSummary: state.getCartSummary,
    getCartStats: state.getCartStats,
    restoreCart: state.restoreCart,
  }));

/**
 * Get cart summary with tax calculations.
 * Memoized to prevent recalculation on every render.
 *
 * @param taxRate - Tax rate as decimal (default: 0.08)
 */
export const useCartSummary = (taxRate = 0.08) =>
  useCartStore((state) => state.getCartSummary(taxRate));

/**
 * Get cart statistics.
 */
export const useCartStats = () => useCartStore((state) => state.getCartStats());
