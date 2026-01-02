# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **backend-driven, event-sourced authorization/authentication platform** with strict compliance requirements. Key architectural principles:

- **Backend is the single source of truth** - no business logic in frontend
- **Default-deny security model** - all actions denied unless explicitly allowed
- **Immutable event history** - no UPDATE/DELETE operations, corrections are new events
- **Role-based isolation** - separate frontend applications per role, APIs namespaced by role
- **Complete audit trail** - all actions logged with actor, role, scope, timestamp

## Technology Stack

- **Backend**: Python 3.13, FastAPI, Uvicorn
- **Identity Provider**: Keycloak (OAuth2/OIDC, short-lived JWTs)
- **Authorization**: Server-side ABAC policy engine
- **Database**: PostgreSQL (append-only event store + read model projections)
- **Testing**: pytest, pytest-asyncio, httpx

## Development Commands

```bash
# Install dependencies
pip install -e .

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest tests/ -v

# Run tests with coverage
pytest tests/ --cov=app --cov-report=html

# Lint code
ruff check .

# Format code
ruff format .

# Type check
mypy app/

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Docker development
docker-compose up -d

# Setup test database (required for running tests)
python setup_db.py
```

## Test Coverage

**All 122 tests passing** - Comprehensive test coverage for:

| Test Suite | Tests | File | Coverage |
|------------|-------|------|----------|
| **Authorization** | 40 | `tests/test_authorization.py` | ABAC policy engine, role-scope mappings, constraint validation |
| **Event Writer** | 30 | `tests/test_event_writer.py` | Event validation, state transitions, correction workflows |
| **Middleware** | 27 | `tests/test_middleware.py` | Rate limiting, error handling, response sanitization |
| **API Routes** | 22 | `tests/test_api_routes.py` | Field-level filtering, validation, pagination |
| **Auth** | 3 | `tests/test_auth.py` | JWT validation, health checks |

### Test Database Setup

Tests use a separate PostgreSQL database:
```bash
# Database URL (set in tests/conftest.py)
postgresql+asyncpg://postgres:aw2555@localhost:5432/authz_authn_test_db
```

Run `python setup_db.py` to create the test database and tables before running tests.

### Key Test Features

- **Test client excludes rate limiting** - FastAPI test app created without rate limiting middleware for faster, reliable tests
- **Proper database cleanup** - Graceful teardown prevents connection errors
- **Settings isolation** - Tests that modify settings use try-finally for cleanup
- **Mock authentication** - JWT tokens mocked for unit testing

## Critical Architectural Constraints

These are **non-negotiable** - any modifications must enforce:

1. **No UPDATE/DELETE on event tables** - state changes are append-only
2. **No frontend permission checks** - authorization enforced server-side only
3. **Field-level response filtering** - sensitive data never returned to unauthorized roles
4. **Corrections create new events** - never mutate existing state
5. **Current state = fold(events)** - read models are projections from event history

## API Structure

APIs are namespaced by role:
```
/api/v1/operator/*    # Operators perform data entry
/api/v1/supervisor/*  # Supervisors confirm/correct data
/api/v1/auditor/*     # Auditors read-only access
/api/v1/admin/*       # System administration
```

### Role Permissions

| Role | Scopes |
|------|--------|
| **Operator** | `data:create`, `data:read:own`, `data:update:own` (unconfirmed only) |
| **Supervisor** | `data:read:all`, `data:confirm`, `data:reject`, `data:correct` |
| **Auditor** | `data:read:all`, `audit:read`, `events:read`, `reports:read`, `users:read` |
| **Admin** | All permissions (bypasses policy checks) |

### State Transitions

```
draft → submitted → confirmed
                    ↘ rejected
confirmed → corrected
```

## Event Schema Requirements

All events MUST contain:
- `event_id` (UUID)
- `entity_id`
- `entity_type`
- `event_type`
- `payload`
- `actor_id`, `actor_role`, `actor_username`
- `timestamp` (UTC)
- `correlation_id` (optional)
- `causation_id` (optional)
- `context` (optional)

### Event Types

- `data.created` - New data entry created (draft)
- `data.submitted` - Entry submitted for review
- `data.confirmed` - Entry confirmed by supervisor
- `data.rejected` - Entry rejected by supervisor
- `data.corrected` - Entry corrected by supervisor (preserves previous data)

## Key Module Locations

- **Auth**: `app/security/jwt.py` - JWT validation with Keycloak
- **Authorization**: `app/security/authorization.py` - ABAC policy engine
- **Events**: `app/services/event_writer.py` - Event store writer
- **Workflows**: `app/services/workflows.py` - Domain event workflows
- **Projections**: `app/services/projections.py` - Read model builder
- **Audit**: `app/services/audit.py` - Audit logging service
- **Routes**: `app/api/routes/` - Role-namespaced API endpoints
  - `operator.py` - Data entry CRUD operations
  - `supervisor.py` - Confirm/reject/correct operations
  - `auditor.py` - Read-only audit access
  - `admin.py` - System administration
- **Middleware**: `app/middleware/` - Rate limiting, error handling
- **Dependencies**: `app/api/dependencies/` - Auth and authorization dependencies

## Database Schema

### Tables

- **events** - Append-only event store (immutable)
- **audit_logs** - Append-only audit trail (immutable)
- **data_entries** - Read model projection (mutable, rebuilt from events)
- **projections** - Projection tracking table

### Immutability Constraints

Event tables have database-level constraints preventing mutations:
- Triggers that raise exceptions on UPDATE/DELETE
- Check constraints verifying immutable fields
- `created_at = created_at_timestamptid` constraint

## Configuration

Configuration is loaded from environment variables or `.env` file:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:aw2555@localhost:5432/authz_authn_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Keycloak / OAuth2
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=authz-authn-demo
KEYCLOAK_CLIENT_ID=authz-authn-backend
KEYCLOAK_CLIENT_SECRET=backend-secret
KEYCLOAK_ALGORITHM=RS256
KEYCLOAK_ISSUER=http://localhost:8080/realms/authz-authn-demo

# Application
API_V1_PREFIX=/api/v1
HOST=0.0.0.0
PORT=8000
WORKERS=4
LOG_LEVEL=INFO
ENVIRONMENT=development

# Security
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_ENABLED=false

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=10

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
```

## Field-Level Response Filtering

Sensitive fields are filtered based on user role:

| Field | Operator | Supervisor | Auditor |
|-------|----------|------------|---------|
| Entry data | ✅ Own only | ✅ All | ✅ All |
| Workflow status | ✅ Own only | ✅ All | ✅ All |
| Confirmation details | ❌ Hidden | ✅ Visible | ✅ Visible |
| Rejection details | ❌ Hidden | ✅ Visible | ✅ Visible |
| Correction history | ❌ Hidden | ✅ Visible | ✅ Visible |
| Full audit trail | ❌ Hidden | ❌ Hidden | ✅ Visible |

## Artifact Files

The `artifacts/` directory contains the original specification files:
- `keycloak_realm_config.json` - Keycloak realm configuration
- `event_store_schema.sql` - Database schema with immutability constraints
- `role_scope_matrix.yaml` - Role and scope definitions
- `event_definitions.yaml` - Event type specifications
- `workflow_rules.yaml` - Domain workflow rules
- `api_contracts.yaml` - OpenAPI specification

## Current State

### Completed Features

✅ **ABAC Policy Engine** - Complete implementation with role-scope mappings
✅ **Event Sourcing** - Append-only event store with immutability constraints
✅ **Workflow Handlers** - Create, confirm, reject, correct operations
✅ **Field-Level Filtering** - Role-based response data filtering
✅ **Audit Logging** - Complete audit trail for all actions
✅ **Rate Limiting** - Token bucket algorithm with IP/user-based limiting
✅ **Error Handling** - Sanitized error messages for production
✅ **Comprehensive Tests** - 122 tests covering all major functionality
✅ **Testing UI** - Interactive web interface for testing all workflows

### Testing UI

A comprehensive web-based testing interface is available at `http://localhost:8000` (or `http://localhost:8000/static/index.html`).

**Features:**
- **Role Switching** - Switch between Operator, Supervisor, Auditor, and Admin views
- **Operator Workspace** - Create, edit, and submit data entries
- **Supervisor Workspace** - Confirm, reject, and correct entries
- **Auditor Workspace** - Read-only access to audit trails and event history
- **Admin Dashboard** - System health metrics and monitoring
- **Event Timeline** - Visual representation of event history for each entry
- **Field-Level Filtering Demo** - See how different roles see different data

**Start the UI:**
```bash
# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Open in browser
open http://localhost:8000
```

See `static/README.md` for detailed testing scenarios and workflow instructions.

### Database Setup

The application uses a local PostgreSQL instance:
- **Host**: localhost:5432
- **User**: postgres
- **Database**: authz_authn_db (main), authz_authn_test_db (testing)

Run `python setup_db.py` to initialize the database schema.

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_authorization.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

All 122 tests pass successfully with comprehensive coverage of authorization, event handling, workflows, middleware, and API endpoints.
