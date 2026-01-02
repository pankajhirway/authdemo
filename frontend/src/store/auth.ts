/**
 * Zustand store for authentication state and role checking.
 * Matches the backend's authentication dependency pattern.
 */

import { create } from "zustand";
import type { UserInfo, UserRole, AuthStatus } from "../types/auth";

/**
 * Authentication store state interface.
 * Follows the same pattern as backend's TokenData but for frontend state.
 */
interface AuthStoreState {
  /** Current authentication status */
  status: AuthStatus;
  /** User information if authenticated */
  user: UserInfo | null;
  /** Current authentication token */
  token: string | null;
  /** Whether the token is expired */
  isTokenExpired: boolean;
}

/**
 * Authentication store actions.
 * Provides methods to manage auth state and check roles.
 */
interface AuthActions {
  /** Set the current user and update status */
  setUser: (user: UserInfo | null) => void;
  /** Set the authentication token */
  setToken: (token: string | null) => void;
  /** Clear all auth state (logout) */
  clearAuth: () => void;
  /** Set authentication status */
  setStatus: (status: AuthStatus) => void;
  /** Check if user has the required role (admin override pattern) */
  hasRole: (role: UserRole) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: UserRole[]) => boolean;
  /** Check if user is authenticated */
  isAuthenticated: () => boolean;
  /** Get the current user (optional auth pattern) */
  getCurrentUser: () => UserInfo | null;
  /** Get the current user's role */
  getRole: () => UserRole | null;
}

/**
 * Combined auth store interface.
 */
type AuthStore = AuthStoreState & AuthActions;

/**
 * Create the Zustand auth store.
 * Implements the frontend side of the backend authentication pattern:
 * - Optional authentication: getCurrentUser returns null if not authenticated
 * - Required authentication: use hasRole/isAuthenticated before access
 * - Admin override: admin users have access to all roles
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  status: "loading",
  user: null,
  token: null,
  isTokenExpired: false,

  // Actions
  setUser: (user) =>
    set((state) => ({
      user,
      status: user ? "authenticated" : "unauthenticated",
    })),

  setToken: (token) =>
    set((state) => ({
      token,
      isTokenExpired: false,
    })),

  setStatus: (status) =>
    set({
      status,
    }),

  clearAuth: () =>
    set({
      user: null,
      token: null,
      status: "unauthenticated",
      isTokenExpired: false,
    }),

  /**
   * Check if the current user has the required role.
   * Matches the backend's require_role pattern:
   * - Admin users have access to all roles
   * - Returns false if not authenticated
   *
   * @param role - The role to check
   * @returns true if user has the role or is admin, false otherwise
   */
  hasRole: (role) => {
    const { user } = get();
    if (!user) {
      return false;
    }
    // Admin override pattern (matches backend: user.role != required_role and user.role != "admin")
    return user.role === role || user.role === "admin";
  },

  /**
   * Check if the current user has any of the specified roles.
   * Admin users have access to all roles.
   *
   * @param roles - Array of roles to check
   * @returns true if user has any of the roles or is admin, false otherwise
   */
  hasAnyRole: (roles) => {
    const { user } = get();
    if (!user) {
      return false;
    }
    // Admin override pattern
    if (user.role === "admin") {
      return true;
    }
    return roles.includes(user.role);
  },

  /**
   * Check if the user is authenticated.
   * Matches the backend's get_current_user pattern.
   *
   * @returns true if user is authenticated, false otherwise
   */
  isAuthenticated: () => {
    const { user } = get();
    return user !== null;
  },

  /**
   * Get the current user.
   * Matches the backend's get_current_user_optional pattern.
   * Returns null if not authenticated.
   *
   * @returns UserInfo if authenticated, null otherwise
   */
  getCurrentUser: () => {
    const { user } = get();
    return user;
  },

  /**
   * Get the current user's role.
   *
   * @returns UserRole if authenticated, null otherwise
   */
  getRole: () => {
    const { user } = get();
    return user?.role ?? null;
  },
}));

/**
 * Selector hooks for optimized re-renders.
 * Use these in components to subscribe only to specific state slices.
 */

/**
 * Get the current authentication status.
 */
export const useAuthStatus = () => useAuthStore((state) => state.status);

/**
 * Get the current user info.
 */
export const useCurrentUser = () => useAuthStore((state) => state.user);

/**
 * Get the current user's role.
 */
export const useCurrentRole = () => useAuthStore((state) => state.user?.role ?? null);

/**
 * Check if user is authenticated.
 */
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.user !== null);

/**
 * Check if user has a specific role.
 * Returns a function that accepts a role parameter.
 *
 * @example
 * const hasAdminRole = useHasRole();
 * if (hasAdminRole("admin")) { ... }
 */
export const useHasRole = () => useAuthStore((state) => state.hasRole);

/**
 * Check if user has any of the specified roles.
 * Returns a function that accepts an array of roles.
 *
 * @example
 * const hasAnyRole = useHasAnyRole();
 * if (hasAnyRole(["operator", "supervisor"])) { ... }
 */
export const useHasAnyRole = () => useAuthStore((state) => state.hasAnyRole);

/**
 * Get auth actions (setUser, clearAuth, etc.).
 */
export const useAuthActions = () =>
  useAuthStore((state) => ({
    setUser: state.setUser,
    setToken: state.setToken,
    clearAuth: state.clearAuth,
    setStatus: state.setStatus,
  }));
