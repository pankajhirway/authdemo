/**
 * ApprovalActions component for approve/reject actions on submitted entries.
 *
 * Provides buttons for supervisors to approve or reject submitted data entries
 * with optional notes for rejections.
 *
 * Features:
 * - Approve button with confirmation
 * - Reject button with reason input modal
 * - Loading states during API calls
 * - Success/error state management
 * - Integration with supervisor API
 *
 * Route: /supervisor (part of dashboard)
 */

import { useState } from "react";
import { supervisorApi } from "../../lib/api";
import type { RejectDataEntryRequest } from "../../types/api";
import { cn } from "../../lib/utils";

/**
 * Props for the ApprovalActions component.
 */
export interface ApprovalActionsProps {
  /** The ID of the entry to approve/reject */
  entryId: string;
  /** Callback when an action is completed */
  onComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ApprovalActions component.
 *
 * Provides approve and reject buttons with proper error handling
 * and success feedback.
 *
 * @param props - Component props
 * @returns Approval actions component
 */
export function ApprovalActions({
  entryId,
  onComplete,
  className,
}: ApprovalActionsProps) {
  // UI state
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Handle approve action.
   */
  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);
    setSuccess(null);

    try {
      await supervisorApi.confirmDataEntry(entryId);
      setSuccess("Entry approved successfully!");

      // Call completion callback after delay
      setTimeout(() => {
        setSuccess(null);
        if (onComplete) {
          onComplete();
        }
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to approve entry. Please try again.";
      setError(errorMessage);
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Handle reject action - show modal first.
   */
  const handleRejectClick = () => {
    setShowRejectModal(true);
    setError(null);
    setSuccess(null);
  };

  /**
   * Confirm and submit rejection.
   */
  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      setError("Rejection reason is required");
      return;
    }

    setIsRejecting(true);
    setError(null);

    try {
      const request: RejectDataEntryRequest = {
        reason: rejectReason.trim(),
      };

      await supervisorApi.rejectDataEntry(entryId, request);
      setSuccess("Entry rejected successfully!");

      // Close modal and reset after delay
      setTimeout(() => {
        setShowRejectModal(false);
        setRejectReason("");
        setSuccess(null);
        if (onComplete) {
          onComplete();
        }
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reject entry. Please try again.";
      setError(errorMessage);
    } finally {
      setIsRejecting(false);
    }
  };

  /**
   * Cancel rejection modal.
   */
  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectReason("");
    setError(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Approve button */}
        <button
          type="button"
          onClick={handleApprove}
          disabled={isApproving || isRejecting || showRejectModal}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
            "flex items-center gap-2",
            "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md",
            "disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          )}
        >
          {isApproving ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
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
              Approving...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
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
              Approve
            </>
          )}
        </button>

        {/* Reject button */}
        <button
          type="button"
          onClick={handleRejectClick}
          disabled={isApproving || isRejecting || showRejectModal}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
            "flex items-center gap-2",
            "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
            "disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          )}
        >
          {isRejecting ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
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
              Rejecting...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Reject
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && !showRejectModal && (
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
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            {/* Modal header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Entry</h3>
              <p className="text-sm text-gray-600 mt-1">
                Please provide a reason for rejecting this entry. This will be visible to the
                operator.
              </p>
            </div>

            {/* Reason input */}
            <div className="mb-4">
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-900 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={isRejecting}
                placeholder="Explain why this entry is being rejected..."
                rows={4}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border border-gray-300",
                  "bg-white text-gray-900 placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500",
                  "disabled:bg-gray-100 disabled:cursor-not-allowed",
                  "resize-y"
                )}
              />
            </div>

            {/* Modal error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Modal buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleRejectCancel}
                disabled={isRejecting}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                  "text-gray-700 hover:bg-gray-100",
                  "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
                  "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={isRejecting || !rejectReason.trim()}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                  "flex items-center gap-2",
                  "bg-red-600 text-white hover:bg-red-700 shadow-sm",
                  "disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                )}
              >
                {isRejecting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Rejecting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
