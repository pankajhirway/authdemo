/**
 * OrderForm component for creating new data entry orders.
 *
 * Provides a form interface for operators to create new data entries
 * with various data types and input validation.
 *
 * Features:
 * - Form validation and error handling
 * - Success/error state management
 * - Loading states during submission
 * - Integration with operator API
 *
 * Route: /operator (part of dashboard)
 */

import { useState } from "react";
import { operatorApi } from "../../lib/api";
import type { CreateDataEntryRequest } from "../../types/api";
import { cn } from "../../lib/utils";

/**
 * Available data entry types for the form.
 */
export type EntryType = "product_order" | "customer_request" | "inventory_item" | "other";

/**
 * Form state for order creation.
 */
interface OrderFormData {
  entryType: EntryType;
  title: string;
  description: string;
  quantity: number;
  priority: "low" | "medium" | "high";
  notes: string;
}

/**
 * Props for the OrderForm component.
 */
export interface OrderFormProps {
  /** Callback when order is successfully created */
  onSuccess?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Entry type options for the select dropdown.
 */
const ENTRY_TYPE_OPTIONS: { value: EntryType; label: string; description: string }[] = [
  {
    value: "product_order",
    label: "Product Order",
    description: "Order products or inventory items",
  },
  {
    value: "customer_request",
    label: "Customer Request",
    description: "Submit a customer request or inquiry",
  },
  {
    value: "inventory_item",
    label: "Inventory Item",
    description: "Add or update inventory items",
  },
  {
    value: "other",
    label: "Other",
    description: "Other type of data entry",
  },
];

/**
 * Priority level options with colors.
 */
const PRIORITY_OPTIONS = [
  { value: "low" as const, label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "medium" as const, label: "Medium", color: "bg-blue-100 text-blue-800" },
  { value: "high" as const, label: "High", color: "bg-red-100 text-red-800" },
];

/**
 * OrderForm component.
 *
 * Provides a comprehensive form for creating data entries with validation,
 * error handling, and success feedback.
 *
 * @param props - Component props
 * @returns Order form component
 */
export function OrderForm({ onSuccess, className }: OrderFormProps) {
  // Form state
  const [formData, setFormData] = useState<OrderFormData>({
    entryType: "product_order",
    title: "",
    description: "",
    quantity: 1,
    priority: "medium",
    notes: "",
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handle input change.
   */
  const handleInputChange = (
    field: keyof OrderFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
    // Clear success message on form change
    if (success) setSuccess(false);
  };

  /**
   * Validate form data.
   */
  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return "Title is required";
    }
    if (formData.title.trim().length < 3) {
      return "Title must be at least 3 characters";
    }
    if (!formData.description.trim()) {
      return "Description is required";
    }
    if (formData.description.trim().length < 10) {
      return "Description must be at least 10 characters";
    }
    if (formData.quantity < 1) {
      return "Quantity must be at least 1";
    }
    if (formData.quantity > 1000) {
      return "Quantity cannot exceed 1000";
    }
    return null;
  };

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare request payload
      const request: CreateDataEntryRequest = {
        data: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          quantity: formData.quantity,
          priority: formData.priority,
          notes: formData.notes.trim(),
        },
        entry_type: formData.entryType,
      };

      // Submit to API
      await operatorApi.createDataEntry(request);

      // Show success message
      setSuccess(true);

      // Reset form after delay
      setTimeout(() => {
        setFormData({
          entryType: "product_order",
          title: "",
          description: "",
          quantity: 1,
          priority: "medium",
          notes: "",
        });
        setSuccess(false);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err) {
      // Handle error
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create order. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to initial state.
   */
  const handleReset = () => {
    setFormData({
      entryType: "product_order",
      title: "",
      description: "",
      quantity: 1,
      priority: "medium",
      notes: "",
    });
    setError(null);
    setSuccess(false);
  };

  return (
    <div
      className={cn("bg-white rounded-xl border border-gray-200 shadow-sm", className)}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Create New Order</h2>
        <p className="text-sm text-gray-600 mt-1">
          Fill in the details below to create a new data entry
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Entry type selection */}
        <div className="space-y-2">
          <label htmlFor="entryType" className="block text-sm font-medium text-gray-900">
            Entry Type <span className="text-red-500">*</span>
          </label>
          <select
            id="entryType"
            value={formData.entryType}
            onChange={(e) => handleInputChange("entryType", e.target.value as EntryType)}
            disabled={isSubmitting}
            className={cn(
              "w-full px-3 py-2 rounded-lg border border-gray-300",
              "bg-white text-gray-900",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:bg-gray-100 disabled:cursor-not-allowed",
              "transition-colors duration-200"
            )}
            required
          >
            {ENTRY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {ENTRY_TYPE_OPTIONS.find((opt) => opt.value === formData.entryType)?.description && (
            <p className="text-xs text-gray-500">
              {ENTRY_TYPE_OPTIONS.find((opt) => opt.value === formData.entryType)?.description}
            </p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-900">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            disabled={isSubmitting}
            placeholder="Enter a descriptive title"
            className={cn(
              "w-full px-3 py-2 rounded-lg border border-gray-300",
              "bg-white text-gray-900 placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:bg-gray-100 disabled:cursor-not-allowed",
              "transition-colors duration-200"
            )}
            required
            minLength={3}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-900">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            disabled={isSubmitting}
            placeholder="Provide detailed description (at least 10 characters)"
            rows={4}
            className={cn(
              "w-full px-3 py-2 rounded-lg border border-gray-300",
              "bg-white text-gray-900 placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:bg-gray-100 disabled:cursor-not-allowed",
              "resize-y",
              "transition-colors duration-200"
            )}
            required
            minLength={10}
          />
        </div>

        {/* Quantity and Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Quantity */}
          <div className="space-y-2">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-900">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              value={formData.quantity}
              onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 1)}
              disabled={isSubmitting}
              min={1}
              max={1000}
              className={cn(
                "w-full px-3 py-2 rounded-lg border border-gray-300",
                "bg-white text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                "transition-colors duration-200"
              )}
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-900">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange("priority", e.target.value)}
              disabled={isSubmitting}
              className={cn(
                "w-full px-3 py-2 rounded-lg border border-gray-300",
                "bg-white text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                "transition-colors duration-200"
              )}
              required
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
            Notes <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            disabled={isSubmitting}
            placeholder="Additional notes or special instructions"
            rows={3}
            className={cn(
              "w-full px-3 py-2 rounded-lg border border-gray-300",
              "bg-white text-gray-900 placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:bg-gray-100 disabled:cursor-not-allowed",
              "resize-y",
              "transition-colors duration-200"
            )}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-green-800">
                <p className="font-medium">Order created successfully!</p>
                <p className="text-green-700 mt-1">The form will reset automatically.</p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting || success}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors duration-200",
              "text-gray-700 hover:bg-gray-100",
              "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
              "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            )}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting || success}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "flex items-center gap-2",
              success
                ? "bg-green-600 text-white cursor-default"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
              (isSubmitting || success) && "cursor-wait opacity-75"
            )}
          >
            {isSubmitting ? (
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
                Creating...
              </>
            ) : success ? (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Created!
              </>
            ) : (
              <>
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * OrderFormSkeleton component.
 *
 * Loading skeleton for the order form.
 * Shows while form is being initialized.
 *
 * @example
 * <OrderFormSkeleton />
 */
export function OrderFormSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-72" />
      </div>

      {/* Form fields skeleton */}
      <div className="p-6 space-y-6">
        {/* Entry type skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded-lg" />
        </div>

        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-10 bg-gray-200 rounded-lg" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-24 bg-gray-200 rounded-lg" />
        </div>

        {/* Quantity and Priority skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Notes skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-16 bg-gray-200 rounded-lg" />
        </div>

        {/* Buttons skeleton */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <div className="h-10 bg-gray-200 rounded-lg w-20" />
          <div className="h-10 bg-gray-200 rounded-lg w-32" />
        </div>
      </div>
    </div>
  );
}
