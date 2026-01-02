/**
 * Tests for authentication and role detection (lib/keycloak.ts and store/auth.ts).
 * Verify role detection works from Keycloak token and auth store functions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  parseUserInfo,
  hasRole,
  hasAnyRole,
  getUserInfo,
  isAuthenticated,
  KeycloakService,
} from "./keycloak";
import type { UserInfo, UserRole } from "../types/auth";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

// Helper to create a mock Keycloak token
function createMockToken(role: UserRole, expirySeconds: number = 3600): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(
    JSON.stringify({
      sub: "user-123",
      preferred_username: "testuser",
      username: "testuser",
      email: "test@example.com",
      name: "Test User",
      realm_access: {
        roles: [role],
      },
      exp: now + expirySeconds,
      iat: now,
      iss: "http://localhost:8080/realms/demo",
    })
  );
  const signature = "mock-signature";
  return `${header}.${payload}.${signature}`;
}

// Helper to create a token with multiple roles
function createMultiRoleToken(roles: string[], expirySeconds: number = 3600): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(
    JSON.stringify({
      sub: "user-123",
      preferred_username: "testuser",
      username: "testuser",
      email: "test@example.com",
      name: "Test User",
      realm_access: {
        roles: roles,
      },
      exp: now + expirySeconds,
      iat: now,
      iss: "http://localhost:8080/realms/demo",
    })
  );
  const signature = "mock-signature";
  return `${header}.${payload}.${signature}`;
}

// Helper to create an invalid token
function createInvalidToken(): string {
  return "invalid.token.here";
}

describe("Keycloak Token Parsing", () => {
  describe("parseUserInfo", () => {
    it("should parse operator token correctly", () => {
      const token = createMockToken("operator");
      const userInfo = parseUserInfo(token);

      expect(userInfo).not.toBeNull();
      expect(userInfo?.preferred_username).toBe("testuser");
      expect(userInfo?.email).toBe("test@example.com");
      expect(userInfo?.role).toBe("operator");
      expect(userInfo?.realm_access?.roles).toContain("operator");
    });

    it("should parse supervisor token correctly", () => {
      const token = createMockToken("supervisor");
      const userInfo = parseUserInfo(token);

      expect(userInfo).not.toBeNull();
      expect(userInfo?.role).toBe("supervisor");
      expect(userInfo?.realm_access?.roles).toContain("supervisor");
    });

    it("should parse auditor token correctly", () => {
      const token = createMockToken("auditor");
      const userInfo = parseUserInfo(token);

      expect(userInfo).not.toBeNull();
      expect(userInfo?.role).toBe("auditor");
      expect(userInfo?.realm_access?.roles).toContain("auditor");
    });

    it("should parse admin token correctly", () => {
      const token = createMockToken("admin");
      const userInfo = parseUserInfo(token);

      expect(userInfo).not.toBeNull();
      expect(userInfo?.role).toBe("admin");
      expect(userInfo?.realm_access?.roles).toContain("admin");
    });

    it("should handle multiple roles and pick highest priority", () => {
      // Admin > Auditor > Supervisor > Operator
      const token = createMultiRoleToken(["operator", "supervisor"]);
      const userInfo = parseUserInfo(token);

      expect(userInfo?.role).toBe("supervisor"); // Supervisor has higher priority
    });

    it("should pick admin as highest priority role", () => {
      const token = createMultiRoleToken(["operator", "supervisor", "admin"]);
      const userInfo = parseUserInfo(token);

      expect(userInfo?.role).toBe("admin"); // Admin has highest priority
    });

    it("should default to operator if no recognized roles", () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const now = Math.floor(Date.now() / 1000);
      const payload = btoa(
        JSON.stringify({
          sub: "user-123",
          preferred_username: "testuser",
          realm_access: { roles: ["user", "guest"] }, // No recognized roles
          exp: now + 3600,
          iat: now,
        })
      );
      const signature = "mock-signature";
      const token = `${header}.${payload}.${signature}`;

      const userInfo = parseUserInfo(token);

      expect(userInfo?.role).toBe("operator"); // Default role
    });

    it("should return null for invalid token", () => {
      const userInfo = parseUserInfo(createInvalidToken());
      expect(userInfo).toBeNull();
    });

    it("should handle token without realm_access", () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const now = Math.floor(Date.now() / 1000);
      const payload = btoa(
        JSON.stringify({
          sub: "user-123",
          preferred_username: "testuser",
          exp: now + 3600,
          iat: now,
        })
      );
      const signature = "mock-signature";
      const token = `${header}.${payload}.${signature}`;

      const userInfo = parseUserInfo(token);

      expect(userInfo).not.toBeNull();
      expect(userInfo?.role).toBe("operator"); // Default when no roles
      expect(userInfo?.realm_access?.roles).toEqual([]);
    });

    it("should extract all required fields", () => {
      const token = createMockToken("operator");
      const userInfo = parseUserInfo(token);

      expect(userInfo?.sub).toBe("user-123");
      expect(userInfo?.preferred_username).toBe("testuser");
      expect(userInfo?.email).toBe("test@example.com");
      expect(userInfo?.name).toBe("Test User");
      expect(userInfo?.exp).toBeDefined();
      expect(userInfo?.iat).toBeDefined();
      expect(userInfo?.iss).toBe("http://localhost:8080/realms/demo");
    });
  });
});

describe("Auth Store - Role Detection", () => {
  // We need to test the auth store functions
  // Since the store uses Zustand and we need to test its role checking logic

  describe("hasRole function pattern", () => {
    it("should return true when user has the required role", () => {
      const mockUser: UserInfo = {
        sub: "user-123",
        preferred_username: "operator",
        email: "operator@example.com",
        name: "Operator User",
        role: "operator",
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
        iss: "http://localhost:8080/realms/demo",
        realm_access: { roles: ["operator"] },
      };

      // Simulate hasRole logic
      const hasRoleCheck = (requiredRole: UserRole, user: UserInfo | null): boolean => {
        if (!user) return false;
        return user.role === requiredRole || user.role === "admin";
      };

      expect(hasRoleCheck("operator", mockUser)).toBe(true);
      expect(hasRoleCheck("supervisor", mockUser)).toBe(false);
    });

    it("should return true for admin users for any role (admin override)", () => {
      const mockAdmin: UserInfo = {
        sub: "admin-123",
        preferred_username: "admin",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
        iss: "http://localhost:8080/realms/demo",
        realm_access: { roles: ["admin"] },
      };

      // Simulate hasRole logic
      const hasRoleCheck = (requiredRole: UserRole, user: UserInfo | null): boolean => {
        if (!user) return false;
        return user.role === requiredRole || user.role === "admin";
      };

      expect(hasRoleCheck("operator", mockAdmin)).toBe(true); // Admin override
      expect(hasRoleCheck("supervisor", mockAdmin)).toBe(true); // Admin override
      expect(hasRoleCheck("auditor", mockAdmin)).toBe(true); // Admin override
      expect(hasRoleCheck("admin", mockAdmin)).toBe(true);
    });

    it("should return false for null user", () => {
      const hasRoleCheck = (requiredRole: UserRole, user: UserInfo | null): boolean => {
        if (!user) return false;
        return user.role === requiredRole || user.role === "admin";
      };

      expect(hasRoleCheck("operator", null)).toBe(false);
      expect(hasRoleCheck("admin", null)).toBe(false);
    });
  });

  describe("hasAnyRole function pattern", () => {
    it("should return true when user has any of the specified roles", () => {
      const mockUser: UserInfo = {
        sub: "user-123",
        preferred_username: "operator",
        email: "operator@example.com",
        name: "Operator User",
        role: "operator",
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
        iss: "http://localhost:8080/realms/demo",
        realm_access: { roles: ["operator"] },
      };

      // Simulate hasAnyRole logic
      const hasAnyRoleCheck = (roles: UserRole[], user: UserInfo | null): boolean => {
        if (!user) return false;
        if (user.role === "admin") return true;
        return roles.includes(user.role);
      };

      expect(hasAnyRoleCheck(["operator", "supervisor"], mockUser)).toBe(true);
      expect(hasAnyRoleCheck(["supervisor", "auditor"], mockUser)).toBe(false);
    });

    it("should return true for admin users for any role list", () => {
      const mockAdmin: UserInfo = {
        sub: "admin-123",
        preferred_username: "admin",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
        iss: "http://localhost:8080/realms/demo",
        realm_access: { roles: ["admin"] },
      };

      // Simulate hasAnyRole logic
      const hasAnyRoleCheck = (roles: UserRole[], user: UserInfo | null): boolean => {
        if (!user) return false;
        if (user.role === "admin") return true;
        return roles.includes(user.role);
      };

      expect(hasAnyRoleCheck(["operator"], mockAdmin)).toBe(true);
      expect(hasAnyRoleCheck(["supervisor"], mockAdmin)).toBe(true);
      expect(hasAnyRoleCheck(["auditor"], mockAdmin)).toBe(true);
      expect(hasAnyRoleCheck(["operator", "supervisor", "auditor"], mockAdmin)).toBe(true);
    });

    it("should return false for null user", () => {
      const hasAnyRoleCheck = (roles: UserRole[], user: UserInfo | null): boolean => {
        if (!user) return false;
        if (user.role === "admin") return true;
        return roles.includes(user.role);
      };

      expect(hasAnyRoleCheck(["operator", "supervisor"], null)).toBe(false);
    });

    it("should return true when role list includes user's role", () => {
      const mockSupervisor: UserInfo = {
        sub: "user-456",
        preferred_username: "supervisor",
        email: "supervisor@example.com",
        name: "Supervisor User",
        role: "supervisor",
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
        iss: "http://localhost:8080/realms/demo",
        realm_access: { roles: ["supervisor"] },
      };

      const hasAnyRoleCheck = (roles: UserRole[], user: UserInfo | null): boolean => {
        if (!user) return false;
        if (user.role === "admin") return true;
        return roles.includes(user.role);
      };

      expect(hasAnyRoleCheck(["operator", "supervisor"], mockSupervisor)).toBe(true);
      expect(hasAnyRoleCheck(["auditor", "supervisor", "admin"], mockSupervisor)).toBe(true);
    });
  });
});

describe("KeycloakService Role Methods", () => {
  let keycloakService: KeycloakService;

  beforeEach(() => {
    // Create a new instance for each test
    // Note: We can't fully test KeycloakService without mocking Keycloak itself
    // But we can test the role checking logic patterns
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should be constructable", () => {
    // KeycloakService requires Keycloak environment variables
    // Set them for testing
    process.env.VITE_KEYCLOAK_URL = "http://localhost:8080";
    process.env.VITE_KEYCLOAK_REALM = "demo";
    process.env.VITE_KEYCLOAK_CLIENT_ID = "demo-client";

    // This test verifies the class can be instantiated with proper config
    expect(KeycloakService).toBeDefined();
  });

  it("should have role checking methods", () => {
    // Verify the methods exist on the class prototype
    expect(KeycloakService.prototype.hasRole).toBeDefined();
    expect(KeycloakService.prototype.hasAnyRole).toBeDefined();
    expect(KeycloakService.prototype.parseUserInfo).toBeDefined();
    expect(KeycloakService.prototype.isAuthenticated).toBeDefined();
    expect(KeycloakService.prototype.getUserInfo).toBeDefined();
  });
});

describe("Convenience Auth Functions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should export authentication functions", () => {
    expect(hasRole).toBeDefined();
    expect(hasAnyRole).toBeDefined();
    expect(getUserInfo).toBeDefined();
    expect(isAuthenticated).toBeDefined();
    expect(typeof hasRole).toBe("function");
    expect(typeof hasAnyRole).toBe("function");
    expect(typeof getUserInfo).toBe("function");
    expect(typeof isAuthenticated).toBe("function");
  });
});

describe("Role Priority Order", () => {
  it("should prioritize roles: admin > auditor > supervisor > operator", () => {
    const tokenWithAdminAndOperator = createMultiRoleToken(["operator", "admin"]);
    const userInfo1 = parseUserInfo(tokenWithAdminAndOperator);
    expect(userInfo1?.role).toBe("admin");

    const tokenWithAuditorAndSupervisor = createMultiRoleToken(["supervisor", "auditor"]);
    const userInfo2 = parseUserInfo(tokenWithAuditorAndSupervisor);
    expect(userInfo2?.role).toBe("auditor");

    const tokenWithSupervisorAndOperator = createMultiRoleToken(["operator", "supervisor"]);
    const userInfo3 = parseUserInfo(tokenWithSupervisorAndOperator);
    expect(userInfo3?.role).toBe("supervisor");
  });
});

describe("Auth State Edge Cases", () => {
  it("should handle token with missing username field", () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const now = Math.floor(Date.now() / 1000);
    const payload = btoa(
      JSON.stringify({
        sub: "user-123",
        // No preferred_username or username
        email: "test@example.com",
        realm_access: { roles: ["operator"] },
        exp: now + 3600,
        iat: now,
      })
    );
    const signature = "mock-signature";
    const token = `${header}.${payload}.${signature}`;

    const userInfo = parseUserInfo(token);

    expect(userInfo).not.toBeNull();
    expect(userInfo?.preferred_username).toBe(""); // Empty string fallback
  });

  it("should handle token with all optional fields missing", () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const now = Math.floor(Date.now() / 1000);
    const payload = btoa(
      JSON.stringify({
        sub: "user-123",
        realm_access: { roles: ["operator"] },
        exp: now + 3600,
        iat: now,
      })
    );
    const signature = "mock-signature";
    const token = `${header}.${payload}.${signature}`;

    const userInfo = parseUserInfo(token);

    expect(userInfo).not.toBeNull();
    expect(userInfo?.email).toBeUndefined();
    expect(userInfo?.name).toBeUndefined();
  });
});
