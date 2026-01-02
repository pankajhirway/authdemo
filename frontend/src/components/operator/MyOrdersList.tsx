/**
 * MyOrdersList component for displaying operator's data entries.
 *
 * Shows a list of all data entries created by the current operator
 * with filtering, status badges, and action buttons.
 *
 * Features:
 * - List view of all operator's entries
 * - Status filtering (all, draft, submitted, confirmed, rejected)
 * - Status badges with color coding
 * - Entry detail modal/expand
 * - Refresh functionality
 * - Empty states and loading skeletons
 *
 * Route: /operator (part of dashboard)
 */

import { useState, useEffect, useCallback } from "react";
import { operatorApi } from "../../lib/api";
import type { DataEntry, DataEntryStatus } from "../../types/api";
import { cn } from "../../lib/utils";

/**
 * Props for the MyOrdersList component.
 */
export interface MyOrdersListProps {
  /** Key to force refresh the list */
  refreshKey?: number;
  /** Callback when refresh key should change */
  onRefresh?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Status badge configuration.
 * Maps status values to display colors and labels.
 */
const STATUS_BADGES: Record<
  DataEntryStatus,
  { label: string; bgColor: string; textColor: string; borderColor: string; icon: string }
> = {
  draft: {
    label: "Draft",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    borderColor: "border-gray-200",
    icon: "📝",
  },
  submitted: {
    label: "Submitted",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-200",
    icon: "📤",
  },
  confirmed: {
    label: "Confirmed",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
    icon: "✅",
  },
  rejected: {
    label: "Rejected",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-200",
    icon: "❌",
  },
  cancelled: {
    label: "Cancelled",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
    icon: "🚫",
  },
};

/**
 * Status filter options.
 */
const STATUS_FILTERS = [
  { value: null as DataEntryStatus | null, label: "All" },
  { value: "draft" as DataEntryStatus, label: "Draft" },
  { value: "submitted" as DataEntryStatus, label: "Submitted" },
  { value: "confirmed" as DataEntryStatus, label: "Confirmed" },
  { value: "rejected" as DataEntryStatus, label: "Rejected" },
];

/**
 * Format a date string to a readable format.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format a relative time string (e.g., "2 hours ago").
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * MyOrdersList component.
 *
 * Displays a list of operator's data entries with filtering and status badges.
 * Fetches entries from the operator API and supports manual refresh.
 *
 * @param props - Component props
 * @returns Orders list component
 */
export function MyOrdersList({
  refreshKey = 0,
  onRefresh,
  className,
}: MyOrdersListProps) {
  // State
  const [entries, setEntries] = useState<DataEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DataEntryStatus | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  /**
   * Fetch entries from the API.
   */
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await operatorApi.listDataEntries({
        status: statusFilter ?? undefined,
        limit: 50,
        offset: 0,
      });
      setEntries(response.items);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load orders. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  /**
   * Initial fetch and refresh on filter/refreshKey change.
   */
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries, refreshKey]);

  /**
   * Handle status filter change.
   */
  const handleFilterChange = (status: DataEntryStatus | null) => {
    setStatusFilter(status);
    setExpandedEntryId(null); // Close expanded entry when filter changes
  };

  /**
   * Toggle entry detail expansion.
   */
  const handleToggleExpand = (entryId: string) => {
    setExpandedEntryId((prev) => (prev === entryId ? null : entryId));
  };

  /**
   * Handle manual refresh.
   */
  const handleRefresh = () => {
    fetchEntries();
    if (onRefresh) {
      onRefresh();
    }
  };

  /**
   * Filter entries based on selected status.
   */
  const filteredEntries = statusFilter
    ? entries.filter((entry) => entry.status === statusFilter)
    : entries;

  /**
   * Get status badge configuration.
   */
  const getStatusBadge = (status: DataEntryStatus) => STATUS_BADGES[status];

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">My Orders</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  Showing <span className="font-semibold text-gray-900">{filteredEntries.length}</span>{" "}
                  {filteredEntries.length === 1 ? "order" : "orders"}
                  {statusFilter && (
                    <>
                      {" "}
                      in <span className="font-medium capitalize">{statusFilter}</span> status
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className={cn(
              "p-2 rounded-lg transition-colors duration-200",
              "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            )}
            aria-label="Refresh orders"
          >
            <svg
              className={cn("w-5 h-5", isLoading && "animate-spin")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Status filter buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            const count = filter.value
              ? entries.filter((e) => e.status === filter.value).length
              : entries.length;

            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => handleFilterChange(filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {filter.label}
                <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-xs bg-white/20">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error message */}
      {error && !isLoading && (
        <div className="p-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0"
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
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Failed to load orders</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !error && <MyOrdersListSkeleton />}

      {/* Empty state */}
      {!isLoading && !error && filteredEntries.length === 0 && (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {statusFilter ? `No ${statusFilter} orders` : "No orders yet"}
          </h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            {statusFilter
              ? `You don't have any orders with ${statusFilter} status. Try selecting a different filter.`
              : "Create your first order using the form on the left."}
          </p>
        </div>
      )}

      {/* Orders list */}
      {!isLoading && !error && filteredEntries.length > 0 && (
        <div className="divide-y divide-gray-100">
          {filteredEntries.map((entry) => {
            const badge = getStatusBadge(entry.status);
            const isExpanded = expandedEntryId === entry.entry_id;

            return (
              <div
                key={entry.entry_id}
                className="transition-colors duration-200 hover:bg-gray-50"
              >
                {/* Summary row */}
                <div className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      {badge.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                            {(entry.data as { title?: string })?.title || `Order #${entry.entry_id.slice(0, 8)}`}
                          </h3>

                          {/* Meta info */}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                            <span>
                              Created {formatRelativeTime(entry.created_at)}
                            </span>
                            <span>•</span>
                            <span>{entry.created_by_username}</span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border flex-shrink-0",
                            badge.bgColor,
                            badge.textColor,
                            badge.borderColor
                          )}
                        >
                          <span aria-hidden="true">{badge.icon}</span>
                          <span className="hidden sm:inline">{badge.label}</span>
                        </span>
                      </div>

                      {/* Description preview */}
                      {(entry.data as { description?: string })?.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                          {(entry.data as { description?: string }).description}
                        </p>
                      )}
                    </div>

                    {/* Expand button */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(entry.entry_id)}
                      className={cn(
                        "flex-shrink-0 p-1.5 rounded-lg transition-colors duration-200",
                        "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500"
                      )}
                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                      aria-expanded={isExpanded}
                    >
                      <svg
                        className={cn(
                          "w-5 h-5 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-6 pb-4 pl-20">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {/* Entry ID */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">ID:</span>
                        <span className="text-gray-900 font-mono text-xs">
                          {entry.entry_id}
                        </span>
                      </div>

                      {/* Full description */}
                      {(entry.data as { description?: string })?.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Description:</span>
                          <p className="text-sm text-gray-900 mt-1">
                            {(entry.data as { description?: string }).description}
                          </p>
                        </div>
                      )}

                      {/* Additional data */}
                      {entry.data && Object.keys(entry.data).length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Details:</span>
                          <dl className="mt-2 space-y-1">
                            {Object.entries(entry.data)
                              .filter(([key]) => !["title", "description"].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="flex gap-2 text-sm">
                                  <dt className="font-medium text-gray-700 capitalize min-w-[100px]">
                                    {key}:
                                  </dt>
                                  <dd className="text-gray-900">
                                    {typeof value === "object"
                                      ? JSON.stringify(value)
                                      : String(value)}
                                  </dd>
                                </div>
                              ))}
                          </dl>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600 pt-2 border-t border-gray-200">
                        <span>
                          Created: {formatDate(entry.created_at)}
                        </span>
                        <span>
                          Updated: {formatDate(entry.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * MyOrdersListSkeleton component.
 *
 * Loading skeleton for the orders list.
 * Shows while orders data is being loaded.
 *
 * @example
 * <MyOrdersListSkeleton />
 */
export function MyOrdersListSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-start gap-4">
            {/* Icon skeleton */}
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />

            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="flex gap-3">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>

            {/* Badge skeleton */}
            <div className="w-20 h-6 bg-gray-200 rounded-md flex-shrink-0" />

            {/* Button skeleton */}
            <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}
