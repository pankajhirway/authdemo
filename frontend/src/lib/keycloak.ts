/**
 * Keycloak authentication service for the frontend.
 *
 * This module integrates the keycloak-js library to handle OAuth2/OIDC flow.
 * It adapts the Keycloak instance to the application's IKeycloakService interface.
 */

import Keycloak from "keycloak-js";
import type {
  UserInfo,
  UserRole,
  KeycloakConfig,
  IKeycloakService,
  AuthState,
  AuthError,
} from "../types/auth";

/**
 * Valid user roles in the system.
 */
const VALID_ROLES: UserRole[] = ["admin", "auditor", "supervisor", "operator"];

/**
 * Get Keycloak configuration from environment variables.
 */
function getKeycloakConfig(): KeycloakConfig {
  const url = import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080";
  const realm = import.meta.env.VITE_KEYCLOAK_REALM || "authz-authn-demo";
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "demo-frontend";

  return { url, realm, clientId };
}

/**
 * Extract user role from Keycloak token payload.
 */
function extractUserRole(payload: Record<string, unknown>): UserRole {
  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;

  if (realmAccess?.roles && Array.isArray(realmAccess.roles)) {
    // Find the first valid role from the user's roles
    for (const role of VALID_ROLES) {
      if (realmAccess.roles.includes(role)) {
        return role;
      }
    }
  }

  // Default to operator role if no matching role found
  return "operator";
}

/**
 * Parse user info from Keycloak JWT token payload.
 */
function mapUserInfo(payload: Record<string, any>): UserInfo | null {
  if (!payload || typeof payload.sub !== "string" || typeof payload.preferred_username !== "string") {
    return null;
  }

  // Extract role
  const role = extractUserRole(payload);

  return {
    sub: payload.sub,
    preferred_username: payload.preferred_username,
    email: payload.email,
    name: payload.name,
    role,
    exp: payload.exp || 0,
    iat: payload.iat || 0,
    iss: payload.iss || "",
    realm_access: {
      roles: Array.isArray((payload.realm_access as { roles?: string[] })?.roles)
        ? (payload.realm_access as { roles: string[] }).roles
        : [],
    },
    resource_access: payload.resource_access,
  };
}

/**
 * Keycloak service implementation using keycloak-js.
 */
class KeycloakService implements IKeycloakService {
  private keycloak: Keycloak;
  private authChangeCallbacks: Array<(authState: AuthState) => void> = [];
  private tokenRefreshCallbacks: Array<(token: string) => void> = [];
  private tokenExpireCallbacks: Array<() => void> = [];
  private initPromise: Promise<boolean> | null = null;
  private _userInfo: UserInfo | null = null;

  constructor() {
    const config = getKeycloakConfig();
    this.keycloak = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    });

    // Setup event listeners
    this.keycloak.onAuthSuccess = () => {
      this.updateUserInfo();
      this.notifyAuthChange();
    };

    this.keycloak.onAuthError = (errorData) => {
      console.error("Keycloak Auth Error:", errorData);
      this.notifyAuthChange(new Error("Authentication failed"));
    };

    this.keycloak.onAuthRefreshSuccess = () => {
      this.updateUserInfo();
      if (this.keycloak.token) {
        this.tokenRefreshCallbacks.forEach(cb => cb(this.keycloak.token!));
        this.notifyAuthChange();
      }
    };

    this.keycloak.onTokenExpired = () => {
      this.tokenExpireCallbacks.forEach(cb => cb());
      this.notifyAuthChange();
    };

    this.keycloak.onAuthLogout = () => {
      this._userInfo = null;
      this.notifyAuthChange();
    };
  }

  private updateUserInfo() {
    if (this.keycloak.tokenParsed) {
      this._userInfo = mapUserInfo(this.keycloak.tokenParsed);
    } else {
      this._userInfo = null;
    }
  }

  /**
   * Initialize Keycloak adapter.
   */
  async init(): Promise<boolean> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.keycloak.init({
      onLoad: "check-sso",
      checkLoginIframe: false, // Disable iframe check for simpler local dev environment
      pkceMethod: "S256",
      enableLogging: true
    }).then((authenticated) => {
      if (authenticated) {
        this.updateUserInfo();
      }
      this.notifyAuthChange();
      return authenticated;
    }).catch((error) => {
      console.error("Keycloak init failed:", error);
      this.notifyAuthChange(error instanceof Error ? error : new Error("Init failed"));
      return false;
    });

    return this.initPromise;
  }

  /**
   * Redirect user to Keycloak login page.
   */
  async login(): Promise<void> {
    const redirectUri = `${window.location.origin}/callback`;
    await this.keycloak.login({ redirectUri });
  }

  /**
   * Logout the current user and clear tokens.
   */
  async logout(): Promise<void> {
    const redirectUri = `${window.location.origin}/login`;
    await this.keycloak.logout({ redirectUri });
  }

  /**
   * Update the authentication token.
   */
  async updateToken(minValidity: number): Promise<boolean> {
    return this.keycloak.updateToken(minValidity);
  }

  /**
   * Check if the user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!this.keycloak.authenticated;
  }

  /**
   * Get the current authentication token.
   */
  async getToken(): Promise<string | null> {
    if (this.isAuthenticated() && this.keycloak.token) {
      return this.keycloak.token;
    }
    return null;
  }

  /**
   * Get the current user info.
   */
  getUserInfo(): UserInfo | null {
    return this._userInfo;
  }

  /**
   * Check if the user has the required role.
   */
  hasRole(role: UserRole): boolean {
    if (!this._userInfo) {
      return false;
    }
    return this._userInfo.role === role || this._userInfo.role === "admin";
  }

  /**
   * Check if the user has any of the specified roles.
   */
  hasAnyRole(roles: UserRole[]): boolean {
    if (!this._userInfo) {
      return false;
    }
    if (this._userInfo.role === "admin") {
      return true;
    }
    return roles.includes(this._userInfo.role);
  }

  /**
   * Parse user info from a token string (manual parsing).
   * Note: keycloak-js handles this internally mostly, but kept for compatibility.
   */
  parseUserInfo(token: string): UserInfo | null {
    // Basic JWT decode for compatibility if needed directly
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return mapUserInfo(JSON.parse(jsonPayload));
    } catch (e) {
      return null;
    }
  }

  /**
   * Register a callback for authentication state changes.
   */
  onAuthChange(callback: (authState: AuthState) => void): void {
    this.authChangeCallbacks.push(callback);
  }

  /**
   * Register a callback for token refresh events.
   */
  onTokenRefresh(callback: (token: string) => void): void {
    this.tokenRefreshCallbacks.push(callback);
  }

  /**
   * Register a callback for token expiry events.
   */
  onTokenExpire(callback: () => void): void {
    this.tokenExpireCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks of auth state change.
   */
  private notifyAuthChange(error?: Error): void {
    const authState: AuthState = {
      status: this.isAuthenticated() ? "authenticated" : "unauthenticated",
      user: this._userInfo,
      token: this.keycloak.token || null,
      isTokenExpired: this.keycloak.isTokenExpired && this.keycloak.isTokenExpired(),
      error: error ? error.message : null,
    };
    this.authChangeCallbacks.forEach((callback) => callback(authState));
  }

  /**
   * SetAuth not typically needed with keycloak-js as it manages state,
   * but kept for interface compatibility if manual override is needed.
   */
  setAuth(_token: string, _userInfo: UserInfo): void {
    // Warning: Manipulating keycloak-js internal state directly is not recommended.
    // This method is deprecated in this implementation.
    console.warn("setAuth is deprecated when using keycloak-js");
  }
}

/**
 * Singleton Keycloak service instance.
 */
let keycloakInstance: KeycloakService | null = null;

/**
 * Get the singleton Keycloak service instance.
 */
export function getKeycloakService(): KeycloakService {
  if (!keycloakInstance) {
    keycloakInstance = new KeycloakService();
  }
  return keycloakInstance;
}

/**
 * Login function that redirects to Keycloak.
 */
export async function login(): Promise<void> {
  const keycloak = getKeycloakService();
  await keycloak.login();
}

/**
 * Logout function.
 */
export async function logout(): Promise<void> {
  const keycloak = getKeycloakService();
  await keycloak.logout();
}

/**
 * Initialize the Keycloak adapter.
 */
export async function initKeycloak(): Promise<boolean> {
  const keycloak = getKeycloakService();
  return await keycloak.init();
}

/**
 * Handle the OAuth callback.
 * With keycloak-js init() usually handles this if onLoad is set.
 * But we need to ensure init is called.
 */
export async function handleCallback(): Promise<void> {
  const keycloak = getKeycloakService();
  // Ensure init is called if not already
  await keycloak.init();
}

export type { UserInfo, UserRole, AuthState, AuthError };
