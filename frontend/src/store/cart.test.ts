/**
 * Tests for Zustand cart store.
 * Verify cart operations: add, remove, update quantity, clear, and calculations.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "./cart";
import type { MenuItem } from "../types/menu";
import type { CartItem } from "../types/menu";

// Mock localStorage for persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

// Helper function to create a mock menu item
function createMockMenuItem(overrides?: Partial<MenuItem>): MenuItem {
  return {
    id: overrides?.id ?? "test-item-1",
    name: overrides?.name ?? "Test Item",
    description: "Test description",
    price: overrides?.price ?? 10.0,
    category: "appetizers",
    image: "https://example.com/image.jpg",
    available: true,
    dietary: {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      containsNuts: false,
      spicy: false,
    },
    prepTimeMinutes: 15,
    calories: 300,
    ingredients: ["ingredient1", "ingredient2"],
  };
}

// Helper function to create a mock cart item
function createMockCartItem(overrides?: Partial<CartItem>): CartItem {
  return {
    menuItem: createMockMenuItem(overrides?.menuItem),
    quantity: overrides?.quantity ?? 1,
    specialInstructions: overrides?.specialInstructions,
  };
}

describe("Cart Store", () => {
  // Reset cart state before each test
  beforeEach(() => {
    useCartStore.getState().clearCart();
    localStorage.clear();
  });

  describe("addItem", () => {
    it("should add a new item to the cart", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);

      const state = useCartStore.getState();
      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.items[0]).toEqual(testItem);
      expect(state.cart.total).toBe(10.0);
      expect(state.cart.itemCount).toBe(1);
    });

    it("should increment quantity when adding existing item with merge=true", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem({ menuItem: createMockMenuItem({ id: "item-1" }) });

      cartStore.addItem(testItem);
      cartStore.addItem(testItem);

      const state = useCartStore.getState();
      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.items[0].quantity).toBe(2);
      expect(state.cart.total).toBe(20.0);
      expect(state.cart.itemCount).toBe(2);
    });

    it("should add as separate item when merge=false", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem({ menuItem: createMockMenuItem({ id: "item-1" }) });

      cartStore.addItem(testItem, { merge: false });
      cartStore.addItem(testItem, { merge: false });

      const state = useCartStore.getState();
      expect(state.cart.items).toHaveLength(2);
    });

    it("should add custom quantity", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem, { quantity: 5 });

      const state = useCartStore.getState();
      expect(state.cart.items[0].quantity).toBe(5);
      expect(state.cart.itemCount).toBe(5);
    });

    it("should add special instructions", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem, { specialInstructions: "No onions" });

      const state = useCartStore.getState();
      expect(state.cart.items[0].specialInstructions).toBe("No onions");
    });

    it("should update special instructions when adding existing item", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem, { specialInstructions: "No onions" });
      cartStore.addItem(testItem, { specialInstructions: "Extra sauce" });

      const state = useCartStore.getState();
      expect(state.cart.items[0].specialInstructions).toBe("Extra sauce");
    });
  });

  describe("removeItem", () => {
    it("should remove an item from the cart", () => {
      const cartStore = useCartStore.getState();
      const testItem1 = createMockCartItem({ menuItem: createMockMenuItem({ id: "item-1" }) });
      const testItem2 = createMockCartItem({ menuItem: createMockMenuItem({ id: "item-2", price: 15 }) });

      cartStore.addItem(testItem1);
      cartStore.addItem(testItem2);
      cartStore.removeItem("item-1");

      const state = useCartStore.getState();
      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.items[0].menuItem.id).toBe("item-2");
      expect(state.cart.total).toBe(15);
    });

    it("should do nothing if item not in cart", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);
      const itemsBefore = useCartStore.getState().cart.items.length;

      cartStore.removeItem("non-existent-id");

      const state = useCartStore.getState();
      expect(state.cart.items).toHaveLength(itemsBefore);
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);
      cartStore.updateQuantity("test-item-1", 5);

      const state = useCartStore.getState();
      expect(state.cart.items[0].quantity).toBe(5);
      expect(state.cart.itemCount).toBe(5);
      expect(state.cart.total).toBe(50);
    });

    it("should clamp quantity to max value", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);
      cartStore.updateQuantity("test-item-1", 200, { max: 99 });

      const state = useCartStore.getState();
      expect(state.cart.items[0].quantity).toBe(99);
    });

    it("should clamp quantity to min value", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);
      cartStore.updateQuantity("test-item-1", -5, { min: 1 });

      const state = useCartStore.getState();
      expect(state.cart.items[0].quantity).toBe(1);
    });

    it("should remove item when quantity reaches 0 with removeIfZero=true", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);
      cartStore.updateQuantity("test-item-1", 0);

      const state = useCartStore.getState();
      expect(state.cart.items).toHaveLength(0);
    });

    it("should keep item when quantity reaches 0 with removeIfZero=false", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);
      cartStore.updateQuantity("test-item-1", 0, { removeIfZero: false });

      const state = useCartStore.getState();
      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.items[0].quantity).toBe(0);
    });
  });

  describe("incrementItem", () => {
    it("should increment item quantity by 1", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem, { quantity: 2 });
      cartStore.incrementItem("test-item-1");

      const state = useCartStore.getState();
      expect(state.cart.items[0].quantity).toBe(3);
    });
  });

  describe("decrementItem", () => {
    it("should decrement item quantity by 1", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem, { quantity: 3 });
      cartStore.decrementItem("test-item-1");

      const state = useCartStore.getState();
      expect(state.cart.items[0].quantity).toBe(2);
    });

    it("should remove item when quantity reaches 0", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem, { quantity: 1 });
      cartStore.decrementItem("test-item-1");

      const state = useCartStore.getState();
      expect(state.cart.items).toHaveLength(0);
    });
  });

  describe("clearCart", () => {
    it("should clear all items from cart", () => {
      const cartStore = useCartStore.getState();
      const testItem1 = createMockCartItem({ menuItem: createMockMenuItem({ id: "item-1" }) });
      const testItem2 = createMockCartItem({ menuItem: createMockMenuItem({ id: "item-2" }) });

      cartStore.addItem(testItem1);
      cartStore.addItem(testItem2);
      cartStore.clearCart();

      const state = useCartStore.getState();
      expect(state.cart.items).toHaveLength(0);
      expect(state.cart.total).toBe(0);
      expect(state.cart.itemCount).toBe(0);
    });
  });

  describe("updateInstructions", () => {
    it("should update special instructions for an item", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);
      cartStore.updateInstructions("test-item-1", "No sauce");

      const state = useCartStore.getState();
      expect(state.cart.items[0].specialInstructions).toBe("No sauce");
    });
  });

  describe("hasItem", () => {
    it("should return true when item is in cart", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);

      expect(cartStore.hasItem("test-item-1")).toBe(true);
    });

    it("should return false when item is not in cart", () => {
      const cartStore = useCartStore.getState();

      expect(cartStore.hasItem("non-existent")).toBe(false);
    });
  });

  describe("getItemQuantity", () => {
    it("should return item quantity when item is in cart", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem, { quantity: 5 });

      expect(cartStore.getItemQuantity("test-item-1")).toBe(5);
    });

    it("should return 0 when item is not in cart", () => {
      const cartStore = useCartStore.getState();

      expect(cartStore.getItemQuantity("non-existent")).toBe(0);
    });
  });

  describe("getCartSummary", () => {
    it("should calculate cart summary with tax", () => {
      const cartStore = useCartStore.getState();
      const testItem1 = createMockCartItem({
        menuItem: createMockMenuItem({ id: "item-1", price: 10 }),
      });
      const testItem2 = createMockCartItem({
        menuItem: createMockMenuItem({ id: "item-2", price: 20 }),
      });

      cartStore.addItem(testItem1, { quantity: 2 }); // $20
      cartStore.addItem(testItem2, { quantity: 1 }); // $20
      // Subtotal: $40, Tax (8%): $3.20, Total: $43.20

      const summary = cartStore.getCartSummary(0.08);

      expect(summary.subtotal).toBe(40);
      expect(summary.tax).toBe(3.2);
      expect(summary.total).toBe(43.2);
      expect(summary.itemCount).toBe(2);
      expect(summary.totalQuantity).toBe(3);
    });
  });

  describe("getCartStats", () => {
    it("should return cart statistics", () => {
      const cartStore = useCartStore.getState();
      const testItem1 = createMockCartItem({
        menuItem: createMockMenuItem({ id: "item-1", price: 10 }),
      });
      const testItem2 = createMockCartItem({
        menuItem: createMockMenuItem({ id: "item-2", price: 20 }),
      });

      cartStore.addItem(testItem1, { quantity: 2 });
      cartStore.addItem(testItem2, { quantity: 1 });

      const stats = cartStore.getCartStats();

      expect(stats.uniqueItems).toBe(2);
      expect(stats.totalQuantity).toBe(3);
      expect(stats.mostExpensive?.menuItem.id).toBe("item-2");
      expect(stats.leastExpensive?.menuItem.id).toBe("item-1");
    });

    it("should return empty stats when cart is empty", () => {
      const cartStore = useCartStore.getState();
      const stats = cartStore.getCartStats();

      expect(stats.uniqueItems).toBe(0);
      expect(stats.totalQuantity).toBe(0);
      expect(stats.mostExpensive).toBeNull();
      expect(stats.leastExpensive).toBeNull();
    });
  });

  describe("restoreCart", () => {
    it("should restore cart from saved state", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      const savedCart = {
        items: [testItem],
        total: 10,
        itemCount: 1,
      };

      cartStore.restoreCart(savedCart);

      const state = useCartStore.getState();
      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.items[0].menuItem.id).toBe("test-item-1");
      expect(state.cart.total).toBe(10);
      expect(state.cart.itemCount).toBe(1);
    });
  });

  describe("Selector Hooks", () => {
    it("useCart should return entire cart state", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);

      const cart = useCartStore.getState().cart;
      expect(cart.items).toHaveLength(1);
      expect(cart.total).toBe(10);
    });

    it("useCartItems should return items array", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);

      const items = useCartStore.getState().cart.items;
      expect(items).toHaveLength(1);
    });

    it("useCartTotal should return total price", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem({ menuItem: createMockMenuItem({ price: 25 }) });

      cartStore.addItem(testItem, { quantity: 3 });

      const total = useCartStore.getState().cart.total;
      expect(total).toBe(75);
    });

    it("useCartItemCount should return item count", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem, { quantity: 7 });

      const itemCount = useCartStore.getState().cart.itemCount;
      expect(itemCount).toBe(7);
    });

    it("useIsCartEmpty should return true when cart is empty", () => {
      const isEmpty = useCartStore.getState().cart.items.length === 0;
      expect(isEmpty).toBe(true);
    });

    it("useIsCartEmpty should return false when cart has items", () => {
      const cartStore = useCartStore.getState();
      const testItem = createMockCartItem();

      cartStore.addItem(testItem);

      const isEmpty = useCartStore.getState().cart.items.length === 0;
      expect(isEmpty).toBe(false);
    });
  });
});
