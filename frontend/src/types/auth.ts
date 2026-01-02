/**
 * Authentication type definitions for Keycloak integration.
 * Matches the backend TokenData and authentication patterns.
 */

import type { UserRole } from "./api";

/**
 * Authentication states in the application.
 * Matches the backend pattern of optional vs required authentication.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * User information extracted from Keycloak token.
 * Matches the backend TokenData structure.
 */
export interface UserInfo {
  /** User's unique identifier */
  sub: string;
  /** Username for display and identification */
  preferred_username: string;
  /** User's email address */
  email?: string;
  /** User's full name */
  name?: string;
  /** User's role in the system (extracted from realm_access.roles) */
  role: UserRole;
  /** Token expiration timestamp in seconds */
  exp: number;
  /** Token issued at timestamp in seconds */
  iat: number;
  /** Token issuer */
  iss: string;
  /** All roles assigned to the user in Keycloak */
  realm_access: {
    roles: string[];
  };
  /** Resource-specific roles (if any) */
  resource_access?: Record<string, { roles: string[] }>;
}

/**
 * Authentication state for the application.
 * Provides a complete picture of the user's auth status.
 */
export interface AuthState {
  /** Current authentication status */
  status: AuthStatus;
  /** User information if authenticated */
  user: UserInfo | null;
  /** Current authentication token */
  token: string | null;
  /** Whether the token is expired */
  isTokenExpired: boolean;
  /** Authentication error if any */
  error: string | null;
}

/**
 * Keycloak configuration options.
 * Sourced from environment variables.
 */
export interface KeycloakConfig {
  /** Keycloak server URL */
  url: string;
  /** Keycloak realm name */
  realm: string;
  /** OAuth2 client ID */
  clientId: string;
}

/**
 * Keycloak init options.
 * Configures the Keycloak adapter behavior.
 */
export interface KeycloakInitOptions {
  /** Redirect to Keycloak login if not authenticated */
  onLoad?: "login-required" | "check-sso";
  /** Silent SSO check (no visible redirect) */
  silentCheckSsoRedirectUri?: string;
  /** Token verification options */
  checkLoginIframe?: boolean;
  /** Response type for OAuth2 flow */
  responseMode?: "query" | "fragment";
  /** Flow type */
  flow?: "standard" | "implicit" | "hybrid";
  /** Time before token refresh (in seconds) */
  tokenRefreshTime?: number;
  /** Use session state for iframe checks */
  useSessionState?: boolean;
}

/**
 * Authentication service interface.
 * Defines the contract for Keycloak authentication operations.
 * Mirrors the backend's authentication dependency pattern.
 */
export interface IKeycloakService {
  /**
   * Initialize Keycloak adapter.
   * Resolves to true if authentication successful, false otherwise.
   */
  init(): Promise<boolean>;

  /**
   * Redirect user to Keycloak login page.
   */
  login(): Promise<void>;

  /**
   * Logout the current user and clear tokens.
   */
  logout(): Promise<void>;

  /**
   * Update the authentication token.
   * Returns true if token was updated successfully.
   */
  updateToken(minValidity: number): Promise<boolean>;

  /**
   * Check if the user is authenticated.
   * Matches backend's get_current_user_optional pattern.
   */
  isAuthenticated(): boolean;

  /**
   * Get the current authentication token.
   * Returns null if not authenticated or token expired.
   */
  getToken(): Promise<string | null>;

  /**
   * Get the current user info.
   * Returns null if not authenticated.
   * Matches backend's TokenData return type.
   */
  getUserInfo(): UserInfo | null;

  /**
   * Check if the user has the required role.
   * Matches backend's get_current_user_with_role pattern.
   * Admin users have access to all roles.
   */
  hasRole(role: UserRole): boolean;

  /**
   * Check if the user has any of the specified roles.
   */
  hasAnyRole(roles: UserRole[]): boolean;

  /**
   * Parse and extract user info from Keycloak token.
   * Handles role extraction from realm_access.
   */
  parseUserInfo(token: string): UserInfo | null;

  /**
   * Register a callback for authentication state changes.
   */
  onAuthChange(callback: (authState: AuthState) => void): void;

  /**
   * Register a callback for token refresh events.
   */
  onTokenRefresh(callback: (token: string) => void): void;

  /**
   * Register a callback for token expiry events.
   */
  onTokenExpire(callback: () => void): void;
}

/**
 * Authentication error types.
 * Provides structured error handling similar to backend HTTPException.
 */
export type AuthErrorType =
  | "INIT_FAILED"
  | "LOGIN_FAILED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "USER_INFO_MISSING"
  | "ROLE_MISSING";

/**
 * Authentication error details.
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  code?: number;
  cause?: unknown;
}
