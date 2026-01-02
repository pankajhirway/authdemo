/**
 * Settings Panel component for Admin dashboard.
 *
 * Displays and allows modification of system settings.
 * Provides configuration options for the application.
 *
 * Features:
 * - View current system settings
 * - Modify configuration values
 * - Form validation
 * - Loading states
 * - Error handling
 */

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../lib/api";

/**
 * System settings structure.
 * This is a placeholder structure - actual settings depend on backend implementation.
 */
interface SystemSettings {
  maintenance_mode: boolean;
  max_orders_per_day: number;
  auto_approve_threshold: number;
  notification_enabled: boolean;
}

/**
 * Default settings values.
 */
const DEFAULT_SETTINGS: SystemSettings = {
  maintenance_mode: false,
  max_orders_per_day: 1000,
  auto_approve_threshold: 50,
  notification_enabled: true,
};

/**
 * Settings Panel component.
 *
 * Displays system configuration settings with the ability to view and modify them.
 * Settings are fetched from the backend and can be updated.
 *
 * @example
 * ```tsx
 * <SettingsPanel />
 * ```
 */
export function SettingsPanel() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Fetch settings from the backend.
   */
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await adminApi.getSettings();

      // Parse the response - backend may return different structure
      if (data && typeof data === "object") {
        setSettings({
          maintenance_mode: (data as Record<string, unknown>).maintenance_mode as boolean ?? false,
          max_orders_per_day: (data as Record<string, unknown>).max_orders_per_day as number ?? 1000,
          auto_approve_threshold: (data as Record<string, unknown>).auto_approve_threshold as number ?? 50,
          notification_enabled: (data as Record<string, unknown>).notification_enabled as boolean ?? true,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load settings";
      setError(message);
      // Keep default settings on error
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load settings on mount.
   */
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Handle setting value change.
   */
  const handleSettingChange = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ): void => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // Clear success message when settings change
    setSuccessMessage(null);
  };

  /**
   * Handle save settings.
   * Note: This is a demo implementation - actual save endpoint may not exist.
   */
  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // In a real implementation, you would call an update endpoint here
      // await adminApi.updateSettings(settings);

      // For demo purposes, simulate a successful save
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessMessage("Settings saved successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save settings";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle reset to defaults.
   */
  const handleReset = (): void => {
    setSettings(DEFAULT_SETTINGS);
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading || isSaving}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
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
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
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
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
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

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      )}

      {/* Settings form */}
      {!isLoading && (
        <div className="space-y-4">
          {/* Maintenance Mode */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Maintenance Mode</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enable to temporarily disable the system for maintenance
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange("maintenance_mode", !settings.maintenance_mode)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.maintenance_mode ? "bg-blue-600" : "bg-gray-200"
                }`}
                role="switch"
                aria-checked={settings.maintenance_mode}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.maintenance_mode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Max Orders Per Day */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <label htmlFor="max_orders_per_day" className="block">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Max Orders Per Day</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of orders allowed per day
                  </p>
                </div>
                <span className="text-lg font-semibold text-blue-600">
                  {settings.max_orders_per_day}
                </span>
              </div>
              <input
                id="max_orders_per_day"
                type="range"
                min="100"
                max="5000"
                step="100"
                value={settings.max_orders_per_day}
                onChange={(e) =>
                  handleSettingChange("max_orders_per_day", parseInt(e.target.value, 10))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>100</span>
                <span>5000</span>
              </div>
            </label>
          </div>

          {/* Auto Approve Threshold */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <label htmlFor="auto_approve_threshold" className="block">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Auto Approve Threshold</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Orders below this amount are auto-approved (demo setting)
                  </p>
                </div>
                <span className="text-lg font-semibold text-blue-600">
                  ${settings.auto_approve_threshold}
                </span>
              </div>
              <input
                id="auto_approve_threshold"
                type="range"
                min="0"
                max="500"
                step="10"
                value={settings.auto_approve_threshold}
                onChange={(e) =>
                  handleSettingChange("auto_approve_threshold", parseInt(e.target.value, 10))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$0</span>
                <span>$500</span>
              </div>
            </label>
          </div>

          {/* Notification Enabled */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Enable Notifications</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Send email notifications for order status changes
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSettingChange("notification_enabled", !settings.notification_enabled)
                }
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.notification_enabled ? "bg-blue-600" : "bg-gray-200"
                }`}
                role="switch"
                aria-checked={settings.notification_enabled}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.notification_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo notice */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-900">Demo Environment</h3>
            <p className="text-xs text-yellow-800 mt-1">
              Settings changes in this demo environment are simulated and will not persist.
              In production, changes would be saved to the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Settings Panel skeleton loading component.
 *
 * Displays a placeholder while settings are loading.
 *
 * @example
 * ```tsx
 * <SettingsPanelSkeleton />
 * ```
 */
export function SettingsPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
