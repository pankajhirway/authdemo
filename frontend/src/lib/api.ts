/**
 * API client with axios instance and auth header injection.
 * Provides typed methods for all backend API endpoints.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type {
  AuditLog,
  ConfirmDataEntryResponse,
  CreateDataEntryRequest,
  CreateDataEntryResponse,
  DataEntry,
  HealthCheckResponse,
  ListAuditLogsParams,
  ListAuditLogsResponse,
  ListDataEntriesParams,
  ListDataEntriesResponse,
  RejectDataEntryRequest,
  RejectDataEntryResponse,
  SubmitDataEntryResponse,
  SystemMetricsResponse,
  TokenData,
  UpdateDataEntryRequest,
  UpdateDataEntryResponse,
} from "../types/api";

/**
 * Get the base URL for the API from environment variables.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

/**
 * Storage key for the JWT token in localStorage.
 */
const TOKEN_STORAGE_KEY = "auth_token";

/**
 * Custom axios request config with the ability to skip auth header injection.
 */
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
}

/**
 * Retrieve the stored JWT token from localStorage.
 * Returns null if no token is stored.
 */
function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage may be unavailable in some environments
    return null;
  }
}

/**
 * Store the JWT token in localStorage.
 */
export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // localStorage may be unavailable in some environments
  }
}

/**
 * Remove the stored JWT token from localStorage.
 * Used on logout.
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage may be unavailable in some environments
  }
}

/**
 * Decode a JWT token without verification (for client-side use only).
 * Returns null if the token is invalid.
 */
export function decodeToken(token: string): TokenData | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded as TokenData;
  } catch {
    return null;
  }
}

/**
 * Check if the current token is expired.
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  // Expiration time is in seconds, Date.now() is in milliseconds
  return decoded.exp * 1000 < Date.now();
}

/**
 * Get the current auth token, checking expiration.
 * Returns null if expired or not found.
 */
export function getCurrentToken(): string | null {
  const token = getStoredToken();
  if (!token) {
    return null;
  }
  if (isTokenExpired(token)) {
    clearAuthToken();
    return null;
  }
  return token;
}

/**
 * Create and configure the axios instance with interceptors.
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor: inject auth header
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const customConfig = config as CustomAxiosRequestConfig;

      // Skip auth injection if explicitly requested
      if (customConfig.skipAuth) {
        return config;
      }

      const token = getCurrentToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: handle common errors
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<unknown>) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        clearAuthToken();
        // Redirect to login will be handled by the router
      }

      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * The configured axios instance for API requests.
 */
export const apiClient = createApiClient();

/**
 * Operator API endpoints.
 */
export const operatorApi = {
  /**
   * Create a new data entry.
   * POST /operator/data
   */
  createDataEntry: async (
    request: CreateDataEntryRequest
  ): Promise<CreateDataEntryResponse> => {
    const response = await apiClient.post<CreateDataEntryResponse>(
      "/operator/data",
      request
    );
    return response.data;
  },

  /**
   * Get a data entry by ID.
   * GET /operator/data/{entry_id}
   */
  getDataEntry: async (entryId: string): Promise<DataEntry> => {
    const response = await apiClient.get<DataEntry>(
      `/operator/data/${entryId}`
    );
    return response.data;
  },

  /**
   * Update a data entry.
   * PUT /operator/data/{entry_id}
   */
  updateDataEntry: async (
    entryId: string,
    request: UpdateDataEntryRequest
  ): Promise<UpdateDataEntryResponse> => {
    const response = await apiClient.put<UpdateDataEntryResponse>(
      `/operator/data/${entryId}`,
      request
    );
    return response.data;
  },

  /**
   * Submit a data entry for review.
   * POST /operator/data/{entry_id}/submit
   */
  submitDataEntry: async (
    entryId: string
  ): Promise<SubmitDataEntryResponse> => {
    const response = await apiClient.post<SubmitDataEntryResponse>(
      `/operator/data/${entryId}/submit`
    );
    return response.data;
  },

  /**
   * List data entries for the current operator.
   * GET /operator/data
   */
  listDataEntries: async (
    params?: ListDataEntriesParams
  ): Promise<ListDataEntriesResponse> => {
    const response = await apiClient.get<ListDataEntriesResponse>(
      "/operator/data",
      { params }
    );
    return response.data;
  },
};

/**
 * Supervisor API endpoints.
 */
export const supervisorApi = {
  /**
   * Confirm/approve a data entry.
   * POST /supervisor/data/{entry_id}/confirm
   */
  confirmDataEntry: async (
    entryId: string
  ): Promise<ConfirmDataEntryResponse> => {
    const response = await apiClient.post<ConfirmDataEntryResponse>(
      `/supervisor/data/${entryId}/confirm`
    );
    return response.data;
  },

  /**
   * Reject a data entry.
   * POST /supervisor/data/{entry_id}/reject
   */
  rejectDataEntry: async (
    entryId: string,
    request: RejectDataEntryRequest
  ): Promise<RejectDataEntryResponse> => {
    const response = await apiClient.post<RejectDataEntryResponse>(
      `/supervisor/data/${entryId}/reject`,
      request
    );
    return response.data;
  },

  /**
   * List all data entries for review.
   * GET /supervisor/data
   */
  listDataEntries: async (
    params?: ListDataEntriesParams
  ): Promise<ListDataEntriesResponse> => {
    const response = await apiClient.get<ListDataEntriesResponse>(
      "/supervisor/data",
      { params }
    );
    return response.data;
  },
};

/**
 * Auditor API endpoints.
 */
export const auditorApi = {
  /**
   * List all data entries (read-only access).
   * GET /auditor/data
   */
  listDataEntries: async (
    params?: ListDataEntriesParams
  ): Promise<ListDataEntriesResponse> => {
    const response = await apiClient.get<ListDataEntriesResponse>(
      "/auditor/data",
      { params }
    );
    return response.data;
  },

  /**
   * Get a specific data entry.
   * GET /auditor/data/{entry_id}
   */
  getDataEntry: async (entryId: string): Promise<DataEntry> => {
    const response = await apiClient.get<DataEntry>(
      `/auditor/data/${entryId}`
    );
    return response.data;
  },

  /**
   * Get audit logs.
   * GET /auditor/audit
   */
  getAuditLogs: async (
    params?: ListAuditLogsParams
  ): Promise<ListAuditLogsResponse> => {
    const response = await apiClient.get<ListAuditLogsResponse>(
      "/auditor/audit",
      { params }
    );
    return response.data;
  },
};

/**
 * Admin API endpoints.
 */
export const adminApi = {
  /**
   * Get system health check.
   * GET /admin/health
   */
  getHealth: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>("/admin/health");
    return response.data;
  },

  /**
   * Get system metrics.
   * GET /admin/metrics
   */
  getMetrics: async (): Promise<SystemMetricsResponse> => {
    const response = await apiClient.get<SystemMetricsResponse>("/admin/metrics");
    return response.data;
  },

  /**
   * Get admin settings.
   * GET /admin/settings
   */
  getSettings: async (): Promise<unknown> => {
    const response = await apiClient.get("/admin/settings");
    return response.data;
  },
};

/**
 * Health check endpoint (no auth required).
 */
export const healthApi = {
  /**
   * Check backend health.
   * GET /health
   */
  check: async (): Promise<{ status: string }> => {
    const response = await axios.get<{ status: string }>(
      `${API_BASE_URL}/../health`,
      { skipAuth: true }
    );
    return response.data;
  },
};

/**
 * Export all APIs as a single object for convenience.
 */
export const api = {
  operator: operatorApi,
  supervisor: supervisorApi,
  auditor: auditorApi,
  admin: adminApi,
  health: healthApi,
};
