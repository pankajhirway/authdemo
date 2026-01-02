/**
 * AuditLogViewer component for displaying system audit logs.
 *
 * Shows a read-only list of all audit logs in the system.
 * Auditors have full visibility into the complete audit trail.
 *
 * Features:
 * - Read-only view of all audit logs
 * - Success/failure filtering
 * - Action type display
 * - User information display
 * - Timestamp display
 * - Refresh functionality
 * - Empty states and loading skeletons
 *
 * Route: /auditor (part of dashboard)
 * Access: Auditor role only
 */

import { useState, useEffect, useCallback } from "react";
import { auditorApi } from "../../lib/api";
import type { AuditLog } from "../../types/api";
import { cn } from "../../lib/utils";

/**
 * Props for the AuditLogViewer component.
 */
export interface AuditLogViewerProps {
  /** Key to force refresh the list */
  refreshKey?: number;
  /** Callback when refresh key should change */
  onRefresh?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Filter options for audit logs.
 */
const SUCCESS_FILTERS = [
  { value: null as boolean | null, label: "All" },
  { value: true as boolean | null, label: "Success" },
  { value: false as boolean | null, label: "Failed" },
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
    second: "2-digit",
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
 * Get HTTP method badge color.
 */
function getMethodBadgeColor(method: string): {
  bgColor: string;
  textColor: string;
  borderColor: string;
} {
  const colors: Record<string, { bgColor: string; textColor: string; borderColor: string }> = {
    GET: {
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      borderColor: "border-blue-200",
    },
    POST: {
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      borderColor: "border-green-200",
    },
    PUT: {
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-200",
    },
    PATCH: {
      bgColor: "bg-orange-100",
      textColor: "text-orange-800",
      borderColor: "border-orange-200",
    },
    DELETE: {
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      borderColor: "border-red-200",
    },
  };
  return colors[method] || {
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    borderColor: "border-gray-200",
  };
}

/**
 * AuditLogViewer component.
 *
 * Displays a complete read-only list of all audit logs with filtering.
 * Fetches logs from the auditor API and supports manual refresh.
 *
 * @param props - Component props
 * @returns Audit log viewer component
 */
export function AuditLogViewer({
  refreshKey = 0,
  onRefresh,
  className,
}: AuditLogViewerProps) {
  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successFilter, setSuccessFilter] = useState<boolean | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  /**
   * Fetch logs from the API.
   */
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await auditorApi.getAuditLogs({
        limit: 100,
        offset: 0,
      });
      setLogs(response.items);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load audit logs. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initial fetch and refresh on filter/refreshKey change.
   */
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, refreshKey]);

  /**
   * Handle success filter change.
   */
  const handleFilterChange = (success: boolean | null) => {
    setSuccessFilter(success);
    setExpandedLogId(null);
  };

  /**
   * Toggle log detail expansion.
   */
  const handleToggleExpand = (logId: string) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  /**
   * Handle manual refresh.
   */
  const handleRefresh = () => {
    fetchLogs();
    if (onRefresh) {
      onRefresh();
    }
  };

  /**
   * Filter logs based on selected success filter.
   */
  const filteredLogs = successFilter !== null
    ? logs.filter((log) => log.success === successFilter)
    : logs;

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Audit Logs</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  Showing <span className="font-semibold text-gray-900">{filteredLogs.length}</span>{" "}
                  {filteredLogs.length === 1 ? "log entry" : "log entries"}
                  {successFilter !== null && (
                    <>
                      {" "}
                      with <span className="font-medium">{successFilter ? "successful" : "failed"}</span> status
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
            aria-label="Refresh audit logs"
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

        {/* Success filter buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {SUCCESS_FILTERS.map((filter) => {
            const isActive = successFilter === filter.value;
            const count = filter.value !== null
              ? logs.filter((l) => l.success === filter.value).length
              : logs.length;

            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => handleFilterChange(filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isActive
                    ? "bg-orange-600 text-white"
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
                <p className="text-sm font-medium text-red-900">Failed to load audit logs</p>
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
      {isLoading && !error && <AuditLogViewerSkeleton />}

      {/* Empty state */}
      {!isLoading && !error && filteredLogs.length === 0 && (
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
            No audit logs found
          </h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            {successFilter !== null
              ? `There are no ${successFilter ? "successful" : "failed"} log entries. Try selecting a different filter.`
              : "No audit logs are currently available."}
          </p>
        </div>
      )}

      {/* Logs list */}
      {!isLoading && !error && filteredLogs.length > 0 && (
        <div className="divide-y divide-gray-100">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.audit_id;
            const methodBadge = getMethodBadgeColor(log.request_method);

            return (
              <div
                key={log.audit_id}
                className="transition-colors duration-200 hover:bg-gray-50"
              >
                {/* Summary row */}
                <div className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg border-2">
                      {log.success ? (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Action and resource */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {log.action}
                            </h3>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">
                              {log.resource_type}
                            </span>
                            {log.resource_id && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-xs font-mono text-gray-500">
                                  {log.resource_id.slice(0, 8)}...
                                </span>
                              </>
                            )}
                          </div>

                          {/* Meta info */}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                            <span>
                              {formatRelativeTime(log.timestamp)}
                            </span>
                            <span>•</span>
                            <span>{log.actor_username}</span>
                            <span>•</span>
                            <span className="capitalize">{log.actor_role}</span>
                          </div>
                        </div>

                        {/* Method badge */}
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border flex-shrink-0",
                            methodBadge.bgColor,
                            methodBadge.textColor,
                            methodBadge.borderColor
                          )}
                        >
                          {log.request_method}
                        </span>
                      </div>

                      {/* Error message preview */}
                      {!log.success && log.error_message && (
                        <p className="text-sm text-red-600 mt-2 line-clamp-1">
                          {log.error_message}
                        </p>
                      )}
                    </div>

                    {/* Expand button */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(log.audit_id)}
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
                      {/* Log ID */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">Log ID:</span>
                        <span className="text-gray-900 font-mono text-xs">
                          {log.audit_id}
                        </span>
                      </div>

                      {/* Request details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Request Path:</span>
                          <p className="text-gray-900 font-mono text-xs mt-1 break-all">
                            {log.request_path}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Request Method:</span>
                          <p className="text-gray-900 mt-1">
                            {log.request_method}
                          </p>
                        </div>
                      </div>

                      {/* Actor details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Actor:</span>
                          <p className="text-gray-900 mt-1">{log.actor_username}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Role:</span>
                          <p className="text-gray-900 mt-1 capitalize">{log.actor_role}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Actor ID:</span>
                          <p className="text-gray-900 font-mono text-xs mt-1">{log.actor_id}</p>
                        </div>
                      </div>

                      {/* Scope and status */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Scope Granted:</span>
                          <p className="text-gray-900 mt-1 font-mono text-xs">
                            {log.scope_granted || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Status Code:</span>
                          <p className="text-gray-900 mt-1">
                            {log.status_code || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Error message */}
                      {!log.success && log.error_message && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-sm font-medium text-red-900">Error Message:</span>
                          <p className="text-sm text-red-800 mt-1">{log.error_message}</p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                        <span>Timestamp: {formatDate(log.timestamp)}</span>
                        {log.request_id && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="font-mono">Request ID: {log.request_id}</span>
                          </>
                        )}
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
 * AuditLogViewerSkeleton component.
 *
 * Loading skeleton for the audit log viewer.
 * Shows while audit logs data is being loaded.
 *
 * @example
 * <AuditLogViewerSkeleton />
 */
export function AuditLogViewerSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-start gap-4">
            {/* Icon skeleton */}
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />

            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="flex gap-3">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>

            {/* Badge skeleton */}
            <div className="w-16 h-6 bg-gray-200 rounded-md flex-shrink-0" />

            {/* Button skeleton */}
            <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}
