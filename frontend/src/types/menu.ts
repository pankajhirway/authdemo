/**
 * Menu type definitions for the ordering interface.
 * Defines the structure of menu items, categories, and related data.
 */

/**
 * Menu categories available in the restaurant.
 * Categories are used to organize and filter menu items.
 */
export type MenuCategory =
  | "appetizers"
  | "entrees"
  | "drinks"
  | "desserts";

/**
 * Dietary information for menu items.
 * Helps users identify suitable options based on their preferences.
 */
export interface DietaryInfo {
  /** Whether the item is vegetarian */
  vegetarian: boolean;
  /** Whether the item is vegan */
  vegan: boolean;
  /** Whether the item is gluten-free */
  glutenFree: boolean;
  /** Whether the item contains nuts */
  containsNuts: boolean;
  /** Whether the item is spicy */
  spicy: boolean;
}

/**
 * Menu item representing a product that can be ordered.
 * Matches the backend data structure for order items.
 */
export interface MenuItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Display name of the menu item */
  name: string;
  /** Detailed description of the item */
  description: string;
  /** Price in USD */
  price: number;
  /** Category the item belongs to */
  category: MenuCategory;
  /** URL to the item's image */
  image: string;
  /** Whether the item is currently available */
  available: boolean;
  /** Dietary information for the item */
  dietary: DietaryInfo;
  /** Estimated preparation time in minutes */
  prepTimeMinutes: number;
  /** Number of calories (optional) */
  calories?: number;
  /** Ingredients list (optional) */
  ingredients?: string[];
}

/**
 * Cart item representing a menu item with quantity.
 * Used in the shopping cart and order data.
 */
export interface CartItem {
  /** The menu item being ordered */
  menuItem: MenuItem;
  /** Quantity of this item in the cart */
  quantity: number;
  /** Special instructions for this item (optional) */
  specialInstructions?: string;
}

/**
 * Calculated subtotal for a cart item.
 */
export interface CartItemTotal {
  /** The cart item */
  item: CartItem;
  /** Calculated total for this line item (price * quantity) */
  total: number;
}

/**
 * Menu filter options for browsing the catalog.
 */
export interface MenuFilters {
  /** Filter by category */
  category?: MenuCategory | "all";
  /** Filter by dietary preference */
  dietary?: "vegetarian" | "vegan" | "glutenFree";
  /** Search query for name or description */
  search?: string;
  /** Filter by maximum price */
  maxPrice?: number;
  /** Show only available items */
  availableOnly?: boolean;
}
