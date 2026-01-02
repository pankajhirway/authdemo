/**
 * Order type definitions for the restaurant ordering interface.
 * Defines the structure of customer orders and related data.
 */

import type { CartItem } from "./menu";
import type { DataEntryStatus } from "./api";

/**
 * Order status in the restaurant workflow.
 * Extends the base DataEntryStatus with restaurant-specific statuses.
 */
export type OrderStatus =
  | "pending"    // Order placed, awaiting confirmation
  | "preparing"  // Order confirmed, being prepared
  | "ready"      // Order ready for pickup/delivery
  | "delivered"  // Order delivered/picked up
  | "cancelled"; // Order cancelled

/**
 * Combined order status type (includes workflow statuses).
 */
export type AllOrderStatus = OrderStatus | DataEntryStatus;

/**
 * Delivery method for the order.
 */
export type DeliveryMethod = "pickup" | "delivery";

/**
 * Customer information for an order.
 */
export interface CustomerInfo {
  /** Customer name */
  name: string;
  /** Customer email */
  email: string;
  /** Customer phone number */
  phone: string;
}

/**
 * Order representing a completed restaurant order.
 * Created when customer completes checkout.
 */
export interface Order {
  /** Unique identifier for the order */
  id: string;
  /** Items in the order */
  items: CartItem[];
  /** Order status */
  status: AllOrderStatus;
  /** Delivery method */
  deliveryMethod: DeliveryMethod;
  /** Customer information */
  customer: CustomerInfo;
  /** Subtotal before tax and delivery */
  subtotal: number;
  /** Tax amount */
  tax: number;
  /** Delivery fee */
  deliveryFee: number;
  /** Discount amount (if any) */
  discount?: number;
  /** Total amount including tax and delivery */
  total: number;
  /** Special instructions for the order */
  specialInstructions?: string;
  /** User ID who created the order */
  createdBy: string;
  /** Username who created the order */
  createdByUsername: string;
  /** Order creation timestamp */
  createdAt: string;
  /** Order last update timestamp */
  updatedAt: string;
  /** Estimated completion time */
  estimatedCompletionAt?: string;
  /** Actual completion time */
  completedAt?: string;
  /** Cancellation reason (if cancelled) */
  cancellationReason?: string;
}

/**
 * Order summary for display in lists.
 */
export interface OrderSummary {
  /** Order ID */
  id: string;
  /** Total amount */
  total: number;
  /** Order status */
  status: AllOrderStatus;
  /** Number of items */
  itemCount: number;
  /** Created timestamp */
  createdAt: string;
  /** Customer name */
  customerName: string;
  /** Delivery method */
  deliveryMethod: DeliveryMethod;
}

/**
 * Order filter options.
 */
export interface OrderFilters {
  /** Filter by status */
  status?: AllOrderStatus | null;
  /** Filter by date range start */
  startDate?: string | null;
  /** Filter by date range end */
  endDate?: string | null;
  /** Search by order ID or customer name */
  search?: string;
  /** Minimum order amount */
  minAmount?: number;
  /** Maximum order amount */
  maxAmount?: number;
  /** Filter by delivery method */
  deliveryMethod?: DeliveryMethod | null;
}

/**
 * Order list response.
 */
export interface OrderListResponse {
  /** List of orders */
  items: Order[];
  /** Total number of orders */
  total: number;
  /** Page limit */
  limit: number;
  /** Page offset */
  offset: number;
}

/**
 * Order timeline event for tracking.
 */
export interface OrderTimelineEvent {
  /** Event ID */
  id: string;
  /** Event type (created, confirmed, preparing, ready, delivered, cancelled) */
  type: string;
  /** Event description */
  description: string;
  /** Event timestamp */
  timestamp: string;
  /** Username who triggered the event */
  actorUsername: string;
  /** Additional event data */
  data?: Record<string, unknown>;
}
