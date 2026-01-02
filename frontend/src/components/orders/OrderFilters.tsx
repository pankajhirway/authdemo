/**
 * OrderFilters component for filtering orders by status and date range.
 *
 * Provides a comprehensive filtering interface for order history with:
 * - Status filter dropdown
 * - Date range picker (start and end dates)
 * - Quick date range presets
 * - Clear all filters button
 *
 * Features:
 * - Accessible form controls
 * - Real-time filter updates
 * - Quick preset options (Today, This Week, This Month, etc.)
 * - Responsive layout
 */

import { useState } from "react";
import { cn } from "../../lib/utils";
import type { AllOrderStatus } from "../../types/order";

/**
 * Props for the OrderFilters component.
 */
export interface OrderFiltersProps {
  /** Current status filter */
  status: AllOrderStatus | null;
  /** Current start date filter (ISO string) */
  startDate: string | null;
  /** Current end date filter (ISO string) */
  endDate: string | null;
  /** Callback when status changes */
  onStatusChange: (status: AllOrderStatus | null) => void;
  /** Callback when start date changes */
  onStartDateChange: (date: string | null) => void;
  /** Callback when end date changes */
  onEndDateChange: (date: string | null) => void;
  /** Callback when all filters are cleared */
  onClearFilters: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Status filter options.
 */
const STATUS_OPTIONS = [
  { value: null as AllOrderStatus | null, label: "All Statuses" },
  { value: "pending" as AllOrderStatus, label: "Pending" },
  { value: "preparing" as AllOrderStatus, label: "Preparing" },
  { value: "ready" as AllOrderStatus, label: "Ready" },
  { value: "delivered" as AllOrderStatus, label: "Delivered" },
  { value: "cancelled" as AllOrderStatus, label: "Cancelled" },
];

/**
 * Quick date range presets.
 */
const DATE_PRESETS = [
  {
    label: "Today",
    getRange: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { start: today.toISOString(), end: tomorrow.toISOString() };
    },
  },
  {
    label: "Last 7 Days",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: end.toISOString() };
    },
  },
  {
    label: "Last 30 Days",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: end.toISOString() };
    },
  },
  {
    label: "This Month",
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start: start.toISOString(), end: end.toISOString() };
    },
  },
  {
    label: "Last 3 Months",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: end.toISOString() };
    },
  },
];

/**
 * Format a date string for display in date input.
 */
function formatDateForInput(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

/**
 * OrderFilters component.
 *
 * Provides filtering controls for order history.
 * Supports status filtering and date range selection with presets.
 *
 * @param props - Component props
 * @returns Order filters component
 *
 * @example
 * <OrderFilters
 *   status={statusFilter}
 *   startDate={startDate}
 *   endDate={endDate}
 *   onStatusChange={setStatusFilter}
 *   onStartDateChange={setStartDate}
 *   onEndDateChange={setEndDate}
 *   onClearFilters={handleClearFilters}
 * />
 */
export function OrderFilters({
  status,
  startDate,
  endDate,
  onStatusChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  className,
}: OrderFiltersProps) {
  const [showPresets, setShowPresets] = useState(false);

  /**
   * Check if any filters are active.
   */
  const hasActiveFilters = !!(status || startDate || endDate);

  /**
   * Handle preset click.
   */
  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    const range = preset.getRange();
    onStartDateChange(range.start);
    onEndDateChange(range.end);
    setShowPresets(false);
  };

  /**
   * Handle clear all filters.
   */
  const handleClearAll = () => {
    onStatusChange(null);
    onStartDateChange(null);
    onEndDateChange(null);
    onClearFilters();
  };

  /**
   * Handle status change.
   */
  const handleStatusChange = (value: string) => {
    if (value === "null" || value === "") {
      onStatusChange(null);
    } else {
      onStatusChange(value as AllOrderStatus);
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5",
        className
      )}
    >
      <div className="space-y-4">
        {/* Header with clear button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <h2 className="font-semibold text-gray-900">Filters</h2>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className={cn(
                "text-sm font-medium text-blue-600 hover:text-blue-700",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              )}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status filter */}
          <div className="space-y-1.5">
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={status ?? "null"}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg border border-gray-300",
                "bg-white text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-colors duration-200"
              )}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value ?? "null"}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div className="space-y-1.5">
            <label
              htmlFor="start-date"
              className="block text-sm font-medium text-gray-700"
            >
              From Date
            </label>
            <input
              id="start-date"
              type="date"
              value={formatDateForInput(startDate)}
              onChange={(e) =>
                onStartDateChange(e.target.value ? new Date(e.target.value).toISOString() : null)
              }
              max={formatDateForInput(endDate || new Date().toISOString())}
              className={cn(
                "w-full px-3 py-2 rounded-lg border border-gray-300",
                "bg-white text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-colors duration-200"
              )}
            />
          </div>

          {/* End date */}
          <div className="space-y-1.5">
            <label
              htmlFor="end-date"
              className="block text-sm font-medium text-gray-700"
            >
              To Date
            </label>
            <input
              id="end-date"
              type="date"
              value={formatDateForInput(endDate)}
              onChange={(e) =>
                onEndDateChange(e.target.value ? new Date(e.target.value).toISOString() : null)
              }
              min={formatDateForInput(startDate)}
              className={cn(
                "w-full px-3 py-2 rounded-lg border border-gray-300",
                "bg-white text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-colors duration-200"
              )}
            />
          </div>
        </div>

        {/* Quick presets */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Quick Select</span>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg",
                  "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                )}
              >
                {showPresets ? "Hide Presets" : "Show Presets"}
                <svg
                  className={cn(
                    "w-4 h-4 ml-1.5 inline-block transition-transform duration-200",
                    showPresets ? "rotate-180" : ""
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Preset dropdown */}
              {showPresets && (
                <div className="absolute z-10 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-1">
                  {DATE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className={cn(
                        "w-full px-4 py-2 text-left text-sm",
                        "text-gray-700 hover:bg-gray-50",
                        "transition-colors duration-150",
                        "focus:outline-none focus:bg-gray-50"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {status && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                    "bg-blue-100 text-blue-800 border border-blue-200"
                  )}
                >
                  Status: {STATUS_OPTIONS.find((s) => s.value === status)?.label}
                  <button
                    type="button"
                    onClick={() => onStatusChange(null)}
                    className={cn(
                      "hover:bg-blue-200 rounded transition-colors duration-150",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500"
                    )}
                    aria-label="Clear status filter"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              )}
              {startDate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                    "bg-green-100 text-green-800 border border-green-200"
                  )}
                >
                  From: {formatDateForInput(startDate)}
                  <button
                    type="button"
                    onClick={() => onStartDateChange(null)}
                    className={cn(
                      "hover:bg-green-200 rounded transition-colors duration-150",
                      "focus:outline-none focus:ring-2 focus:ring-green-500"
                    )}
                    aria-label="Clear start date filter"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              )}
              {endDate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                    "bg-purple-100 text-purple-800 border border-purple-200"
                  )}
                >
                  To: {formatDateForInput(endDate)}
                  <button
                    type="button"
                    onClick={() => onEndDateChange(null)}
                    className={cn(
                      "hover:bg-purple-200 rounded transition-colors duration-150",
                      "focus:outline-none focus:ring-2 focus:ring-purple-500"
                    )}
                    aria-label="Clear end date filter"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
