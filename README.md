# AuthzAuthn Demo

Backend-driven event-driven authorization/authentication platform with strict compliance requirements.

## Architecture

This system implements:
- **Event Sourcing** - All state changes recorded as immutable events
- **CQRS** - Separate command and query models
- **ABAC** - Attribute-Based Access Control with default-deny
- **Role Namespacing** - APIs isolated by role (operator, supervisor, auditor, admin)
- **Audit Trail** - Complete append-only audit log for compliance

## Quick Start

```bash
# Clone and install
git clone <repo>
cd AuthzAuthnDemo
pip install -e .

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start with Docker Compose (includes PostgreSQL, Keycloak)
docker-compose up -d

# Or run directly (requires external PostgreSQL and Keycloak)
uvicorn app.main:app --reload
```

## Roles

| Role | Permissions |
|------|-------------|
| **Operator** | Create, read own entries, submit for review |
| **Supervisor** | Read all, confirm/reject/correct entries |
| **Auditor** | Read-only access to data, events, audit logs |
| **Admin** | User management, system configuration |

## API Endpoints

- `/api/v1/operator/*` - Operator endpoints
- `/api/v1/supervisor/*` - Supervisor endpoints
- `/api/v1/auditor/*` - Auditor endpoints
- `/api/v1/admin/*` - Admin endpoints
- `/health` - Health check (no auth)
- `/docs` - API documentation (development only)

## Development

```bash
# Run tests
pytest tests/

# Lint
ruff check .

# Format
ruff format .

# Type check
mypy app/
```

## Specification

See `artifacts/` directory for the complete system specification:
- `claude_code_backend_event_system_spec.md` - Main spec
- `Tasks.yaml` - Task breakdown
- `event_store_schema.sql` - Database schema
- `api_contracts.yaml` - OpenAPI spec

## License

MIT
