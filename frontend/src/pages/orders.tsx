/**
 * Order history page.
 *
 * Displays a list of past orders with filtering, search, and status tracking.
 * Users can view order details, reorder, and track order status.
 *
 * Features:
 * - List of all past orders
 * - Status filtering and search
 * - Order details view
 * - Reorder functionality
 * - Responsive grid/list layout
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { useCurrentUser } from "../store/auth";
import { useCartActions } from "../store/cart";
import { OrderCard, OrderCardSkeleton } from "../components/orders/OrderCard";
import { OrderDetails, OrderDetailsSkeleton } from "../components/orders/OrderDetails";
import { StatusBadgeWithCount } from "../components/orders/StatusBadge";
import type { Order, AllOrderStatus, OrderFilters } from "../types/order";
import type { CartItem } from "../types/menu";

/**
 * Mock order data for demonstration.
 * In production, this would come from the API.
 */
const MOCK_ORDERS: Order[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    items: [
      {
        menuItem: {
          id: "1",
          name: "Classic Cheeseburger",
          description: "Juicy beef patty with cheddar cheese, lettuce, tomato, and pickles",
          price: 12.99,
          category: "entrees",
          image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
          available: true,
          dietary: { vegetarian: false, vegan: false, glutenFree: false, containsNuts: false, spicy: false },
          prepTimeMinutes: 15,
        },
        quantity: 2,
        specialInstructions: "No onions, please",
      },
      {
        menuItem: {
          id: "5",
          name: "Caesar Salad",
          description: "Crisp romaine lettuce with parmesan, croutons, and Caesar dressing",
          price: 9.99,
          category: "appetizers",
          image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400",
          available: true,
          dietary: { vegetarian: true, vegan: false, glutenFree: false, containsNuts: true, spicy: false },
          prepTimeMinutes: 10,
        },
        quantity: 1,
      },
    ],
    status: "delivered",
    deliveryMethod: "delivery",
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
    },
    subtotal: 35.97,
    tax: 2.88,
    deliveryFee: 3.99,
    total: 42.84,
    specialInstructions: "Please ring doorbell twice",
    createdBy: "user-123",
    createdByUsername: "johndoe",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86100000 * 2).toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    items: [
      {
        menuItem: {
          id: "9",
          name: "Margherita Pizza",
          description: "Traditional pizza with fresh mozzarella, tomatoes, and basil",
          price: 14.99,
          category: "entrees",
          image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
          available: true,
          dietary: { vegetarian: true, vegan: false, glutenFree: false, containsNuts: false, spicy: false },
          prepTimeMinutes: 20,
        },
        quantity: 1,
      },
      {
        menuItem: {
          id: "13",
          name: "Tiramisu",
          description: "Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream",
          price: 7.99,
          category: "desserts",
          image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
          available: true,
          dietary: { vegetarian: true, vegan: false, glutenFree: false, containsNuts: true, spicy: false },
          prepTimeMinutes: 5,
        },
        quantity: 2,
      },
    ],
    status: "preparing",
    deliveryMethod: "pickup",
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
    },
    subtotal: 30.97,
    tax: 2.48,
    deliveryFee: 0,
    total: 33.45,
    createdBy: "user-123",
    createdByUsername: "johndoe",
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    estimatedCompletionAt: new Date(Date.now() + 1800000).toISOString(), // 30 min from now
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    items: [
      {
        menuItem: {
          id: "3",
          name: "Grilled Chicken Sandwich",
          description: "Marinated chicken breast with avocado, bacon, and honey mustard",
          price: 11.99,
          category: "entrees",
          image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400",
          available: true,
          dietary: { vegetarian: false, vegan: false, glutenFree: true, containsNuts: false, spicy: false },
          prepTimeMinutes: 12,
        },
        quantity: 1,
      },
    ],
    status: "cancelled",
    deliveryMethod: "delivery",
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
    },
    subtotal: 11.99,
    tax: 0.96,
    deliveryFee: 3.99,
    total: 16.94,
    specialInstructions: "Leave at door",
    cancellationReason: "Customer requested cancellation due to change of plans",
    createdBy: "user-123",
    createdByUsername: "johndoe",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

/**
 * Status filter options.
 */
const STATUS_FILTERS = [
  { value: null as AllOrderStatus | null, label: "All Orders" },
  { value: "pending" as AllOrderStatus, label: "Pending" },
  { value: "preparing" as AllOrderStatus, label: "Preparing" },
  { value: "ready" as AllOrderStatus, label: "Ready" },
  { value: "delivered" as AllOrderStatus, label: "Delivered" },
  { value: "cancelled" as AllOrderStatus, label: "Cancelled" },
];

/**
 * OrdersPage component.
 *
 * Main page for viewing order history with filtering and details.
 *
 * @returns Orders page component
 */
function OrdersPageContent() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { addItem, clearCart } = useCartActions();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<AllOrderStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Fetch orders from the API.
   * In production, this would call the real API.
   */
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In production, this would be:
      // const response = await api.listOrders({ status: statusFilter ?? undefined });
      // setOrders(response.items);

      // For demo, use mock data
      setOrders(MOCK_ORDERS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  /**
   * Initial fetch.
   */
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Handle reorder click.
   * Adds all items from the order back to the cart.
   */
  const handleReorder = useCallback(
    (order: Order) => {
      // Clear existing cart
      clearCart();

      // Add all items from the order
      order.items.forEach((item) => {
        addItem(item, { merge: false });
      });

      // Navigate to cart
      navigate("/cart");
    },
    [addItem, clearCart, navigate]
  );

  /**
   * Handle view details click.
   */
  const handleViewDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
  }, []);

  /**
   * Handle back to list click.
   */
  const handleBackToList = useCallback(() => {
    setSelectedOrder(null);
  }, []);

  /**
   * Handle print order.
   */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /**
   * Filter orders based on status and search query.
   */
  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (statusFilter && order.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.items.some((item) => item.menuItem.name.toLowerCase().includes(query))
      );
    }

    return true;
  });

  /**
   * Get order count by status.
   */
  const getStatusCount = (status: AllOrderStatus | null) => {
    if (!status) return orders.length;
    return orders.filter((order) => order.status === status).length;
  };

  /**
   * Show details view if an order is selected.
   */
  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBackToList}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg",
              "text-gray-700 hover:bg-gray-100 transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Orders</span>
          </button>

          {/* Order details */}
          <OrderDetails
            order={selectedOrder}
            onPrint={handlePrint}
            onShare={() => {
              // Share functionality would go here
            }}
          />
        </div>
      </div>
    );
  }

  /**
   * Main orders list view.
   */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-600 mt-2">
            View and track your past orders
            {user && ` for ${user.name}`}
          </p>
        </div>

        {/* Filters and search */}
        <div className="mb-6 space-y-4">
          {/* Status filter buttons */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                )}
              >
                <StatusBadgeWithCount
                  status={filter.value || "pending"}
                  count={getStatusCount(filter.value)}
                  showIcon={statusFilter === filter.value}
                />
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by order ID, customer name, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "placeholder:text-gray-400"
              )}
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && !isLoading && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Failed to load orders</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                type="button"
                onClick={fetchOrders}
                className="text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !error && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredOrders.length === 0 && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? "No orders found" : "No orders yet"}
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto mb-6">
              {searchQuery
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Once you place an order, it will appear here."}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => navigate("/menu")}
                className={cn(
                  "px-6 py-3 bg-blue-600 text-white font-medium rounded-lg",
                  "hover:bg-blue-700 transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                )}
              >
                Browse Menu
              </button>
            )}
          </div>
        )}

        {/* Orders list */}
        {!isLoading && !error && filteredOrders.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredOrders.length}</span>{" "}
              {filteredOrders.length === 1 ? "order" : "orders"}
              {statusFilter && (
                <>
                  {" "}
                  in <span className="font-medium capitalize">{statusFilter}</span> status
                </>
              )}
            </p>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onReorder={handleReorder}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * OrdersPage component with authentication wrapper.
 *
 * @returns Orders page component
 *
 * @example
 * <OrdersPage />
 */
export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}

/**
 * Export the content component for testing.
 */
export { OrdersPageContent };
