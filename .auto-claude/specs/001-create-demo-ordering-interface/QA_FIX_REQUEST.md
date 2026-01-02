# QA Fix Request

**Status**: REJECTED
**Date**: 2026-01-02
**QA Session**: 2

---

## Critical Issues to Fix

### 1. Missing Unit Tests (Blocks Sign-off)

**Problem**: QA Acceptance Criteria requires 4 unit test files, but only 1 exists.

**Location**: frontend/src/lib/

**Required Files:**
- frontend/src/lib/api.test.ts - NOT FOUND
- frontend/src/store/cart.test.ts - EXISTS (470 lines)
- frontend/src/lib/auth.test.ts - NOT FOUND
- frontend/src/lib/format.test.ts - NOT FOUND

**Required Fix**: Create 3 missing unit test files

---

## File 1: frontend/src/lib/api.test.ts

**Purpose**: API client functionality

**Tests to Implement:**
1. Axios instance configuration
2. Request interceptor injects auth header
3. Response interceptor handles 401 errors
4. Token storage functions
5. Token decode functionality
6. All API method endpoints

---

## File 2: frontend/src/lib/auth.test.ts

**Purpose**: Authentication and Keycloak integration

**Tests to Implement:**
1. KeycloakService initialization
2. Login/logout methods
3. Token management
4. Role extraction from JWT
5. hasRole() with admin override
6. hasAnyRole() checks
7. Event handlers

---

## File 3: frontend/src/lib/format.test.ts

**Purpose**: Utility functions

**Tests to Implement:**
1. formatCurrency() variations
2. Negative numbers
3. Zero handling
4. Decimals
5. Custom options

---

## After Fixes

1. Commit: 'fix: Add missing unit tests (qa-requested)'
2. QA will re-run automatically
3. Verify: npm test passes

---

## Summary

**Total Issues**: 1 Critical
**Files to Create**: 3
**Files to Modify**: 0

