
# Backend-Driven Event-Based System
## Claude Code – Autonomous Implementation Specification

This document is an **agent-executable specification** intended for use with **Claude Code** or similar autonomous coding agents.
The agent must follow all constraints strictly. Deviations are not permitted without explicit instruction.

---

## 1. Core System Constraints (NON-NEGOTIABLE)

- Backend is the single source of truth
- No business or validation logic in frontend
- Default-deny security model
- Strict role and scope isolation
- Immutable event history (no UPDATE / DELETE)
- All actions must be audit logged
- Sensitive data must never be returned to unauthorized roles

Failure to meet any constraint is a **hard failure**.

---

## 2. Technology Stack (FIXED)

### Backend
- Language: Python 3.12
- Framework: FastAPI
- ASGI Server: Uvicorn + Gunicorn

### Authentication
- OpenID Connect / OAuth2
- Identity Provider: Keycloak
- Token Type: Short-lived JWT

### Authorization
- Server-side ABAC policy engine
- No frontend permission checks

### Data
- Event Store: Append-only PostgreSQL tables
- Read Models: PostgreSQL projections
- Logs: Structured JSON (append-only)

---

## 3. Role & Application Model

- Each role has a separate frontend application
- APIs are namespaced per role
- Backend enforces role isolation regardless of frontend

Example:
```
/api/operator/*
/api/supervisor/*
/api/auditor/*
```

---

## 4. Identity & Access Resolution

Claude Code must implement the following flow:

1. Validate JWT signature and expiry
2. Extract user_id, role, scopes
3. Resolve permissions server-side
4. Apply ABAC policy evaluation
5. Filter response fields based on role
6. Deny by default if no explicit allow rule exists

---

## 5. Event-Driven Architecture

### Event Rules
- Every state change is an event
- Corrections are new events
- No mutable state
- Current state = fold(events)

### Mandatory Event Fields
- event_id (UUID)
- entity_id
- event_type
- payload
- actor
- role
- timestamp (UTC)
- context

---

## 6. AI-Executable Task Plan

Claude Code must execute tasks in order and must not skip validation.

### Task 1: Identity & Authentication
- Provision Keycloak realm
- Define roles and scopes
- Configure OAuth clients
- Implement JWT validation middleware

### Task 2: Authorization Engine
- Implement ABAC policy engine
- Enforce default-deny
- Integrate as FastAPI dependency

### Task 3: Event Store
- Design append-only schema
- Enforce immutability at DB level
- Implement event writer service

### Task 4: Domain Workflows
- Implement system-generated events
- Implement confirmation/correction flows
- Ensure corrections do not mutate state

### Task 5: Read Models
- Build projection tables
- Implement idempotent consumers
- Support full rebuild from event history

### Task 6: API Layer
- Implement role-namespaced routes
- Separate commands and queries
- Apply field-level response filtering

### Task 7: Audit Logging
- Log actor, role, scope, action, timestamp
- Include correlation IDs
- Prepare logs for compliance review

### Task 8: Security Hardening
- Sanitize all error responses
- Implement rate limiting
- Ensure no sensitive data leakage

### Task 9: Minimal UI
- Thin clients only
- Authentication + rendering
- No business rules

### Task 10: Deployment & Observability
- Dockerize services
- Structured logging
- Metrics exposure

---

## 7. Validation Requirements

Claude Code must validate:
- Unauthorized access is impossible
- Events are immutable
- Audit logs are complete
- Data isolation holds across roles
- Replaying events rebuilds state accurately

---

## 8. Execution Rules for Claude Code

- Do not assume frontend trust
- Do not introduce mutable state
- Do not bypass authorization
- Do not remove audit logging
- Prefer correctness over speed

---

## END OF SPEC
