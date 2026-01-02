/**
 * Cart type definitions for the ordering interface.
 * Defines the structure of shopping cart data and related operations.
 */

import type { CartItem } from "./menu";

/**
 * Cart state interface representing the shopping cart.
 */
export interface CartState {
  /** All items in the cart */
  items: CartItem[];
  /** Total price of all items in the cart */
  total: number;
  /** Total number of items (sum of quantities) */
  itemCount: number;
}

/**
 * Cart summary for display purposes.
 */
export interface CartSummary {
  /** Subtotal before tax */
  subtotal: number;
  /** Tax amount (percentage of subtotal) */
  tax: number;
  /** Total including tax */
  total: number;
  /** Number of unique items */
  itemCount: number;
  /** Total quantity of all items */
  totalQuantity: number;
}

/**
 * Cart statistics for analytics.
 */
export interface CartStats {
  /** Number of unique items */
  uniqueItems: number;
  /** Total quantity of all items */
  totalQuantity: number;
  /** Most expensive item */
  mostExpensive: CartItem | null;
  /** Least expensive item */
  leastExpensive: CartItem | null;
}

/**
 * Cart operation result.
 */
export interface CartOperationResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** Updated cart state */
  cart?: CartState;
}

/**
 * Options for adding items to cart.
 */
export interface AddToCartOptions {
  /** Quantity to add (default: 1) */
  quantity?: number;
  /** Special instructions for this item */
  specialInstructions?: string;
  /** Whether to merge with existing item (default: true) */
  merge?: boolean;
}

/**
 * Options for updating cart item quantity.
 */
export interface UpdateQuantityOptions {
  /** Minimum quantity allowed (default: 0) */
  min?: number;
  /** Maximum quantity allowed (default: 99) */
  max?: number;
  /** Whether to remove item if quantity reaches 0 (default: true) */
  removeIfZero?: boolean;
}

/**
 * Cart storage configuration.
 */
export interface CartStorageConfig {
  /** Storage key (default: "cart") */
  storageKey?: string;
  /** Whether to persist cart (default: true) */
  persist?: boolean;
  /** Storage type (default: "localStorage") */
  storageType?: "localStorage" | "sessionStorage";
}

/**
 * Tax configuration for cart calculations.
 */
export interface TaxConfig {
  /** Tax rate as decimal (e.g., 0.08 for 8%) */
  rate: number;
  /** Whether tax is included in item prices */
  included: boolean;
}
