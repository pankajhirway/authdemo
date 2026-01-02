# Specification: Fix Docker Compose Startup Issue

## Overview

The application is a FastAPI-based authorization and authentication demo that currently fails to start when launched via docker-compose. The Docker image does not start properly, preventing access to both the API backend and the UI. This task involves diagnosing and fixing the container startup issue, ensuring the application runs successfully in Docker with all services (postgres, keycloak, backend, prometheus, grafana) and that the UI is accessible.

## Workflow Type

**Type**: feature

**Rationale**: This is a feature implementation task because we're adding/enabling Docker deployment capability which is new functionality. The task involves fixing existing Docker configurations to make the application containerization work properly.

## Task Scope

### Services Involved
- **main** (primary) - FastAPI backend with UI that needs to start in Docker
- **postgres** (infrastructure) - PostgreSQL database for application data
- **keycloak** (infrastructure) - Identity and access management provider

### This Task Will:
- [ ] Diagnose why Docker container fails to start
- [ ] Fix Dockerfile configuration to ensure proper startup
- [ ] Verify docker-compose.yml service orchestration
- [ ] Ensure UI static files are included and accessible in Docker image
- [ ] Configure proper process management (foreground process)
- [ ] Verify all services start correctly via docker-compose
- [ ] Test accessibility of UI and API endpoints

### Out of Scope:
- Modifying Keycloak configuration or realm setup
- Changing database schema or migrations
- Adding new application features or endpoints
- Performance optimization beyond basic startup

## Service Context

### main (Primary Service)

**Tech Stack:**
- Language: Python
- Framework: FastAPI
- ORM: SQLAlchemy
- Testing: pytest
- Migrations: Alembic

**Key directories:**
- `app/` - Application code
- `tests/` - Test files
- `alembic/versions/` - Database migrations

**Entry Point:** `app/main.py`

**How to Run (local):**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**How to Run (Docker):**
```bash
docker-compose up --build
```

**Port:** 8000

**Health Check:** `http://localhost:8000/health`

**API Documentation:** `http://localhost:8000/docs`

### postgres (Infrastructure Service)

**Port:** 5432

**Environment Variables Required:**
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

### keycloak (Infrastructure Service)

**Port:** 8080 (default)

**Purpose:** OAuth2/OIDC authentication provider

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `Dockerfile` | main | Fix container startup command, ensure foreground process runs |
| `docker-compose.yml` | main | Verify service dependencies, environment variables, volume mounts |
| `app/main.py` | main | Add static file serving configuration for UI if missing |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `app/main.py` | FastAPI application setup with static routes |
| `.env` | Required environment variables for container configuration |
| `pyproject.toml` or `requirements.txt` | Python dependencies to include in Docker image |

## Patterns to Follow

### FastAPI Static File Serving

From typical FastAPI applications:

```python
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI

app = FastAPI()

# Mount static files for UI
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/", StaticFiles(directory="ui", html=True), name="ui")
```

**Key Points:**
- Static files must be copied into Docker image
- Mount routes before API routes to catch UI paths
- Use `html=True` for single-page applications

### Dockerfile Foreground Process

From working Python FastAPI Dockerfiles:

```dockerfile
# Use uvicorn directly as CMD
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Key Points:**
- Must run process in foreground (not background with &)
- Use exec form (JSON array) for proper signal handling
- Bind to 0.0.0.0 to accept connections from outside container

### Docker Compose Service Dependencies

```yaml
services:
  backend:
    depends_on:
      postgres:
        condition: service_healthy
      keycloak:
        condition: service_started
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/authz_authn_db
```

**Key Points:**
- Wait for database to be healthy before starting backend
- Use service names as hostnames in DATABASE_URL
- Pass all required environment variables

## Requirements

### Functional Requirements

1. **Container Starts Successfully**
   - Description: Docker container must start and remain running without exiting
   - Acceptance: `docker-compose up` shows backend service as "running" without restart loops

2. **UI is Accessible**
   - Description: User interface must load when accessing the application URL
   - Acceptance: Browser can load UI at http://localhost:8000 (or appropriate port) without 404 errors

3. **API Endpoints Respond**
   - Description: All FastAPI routes must be accessible via HTTP
   - Acceptance: Health check at http://localhost:8000/health returns 200 OK
   - Acceptance: API docs at http://localhost:8000/docs load successfully

4. **Database Connectivity**
   - Description: Application must connect to PostgreSQL database
   - Acceptance: No database connection errors in container logs
   - Acceptance: Application can perform database queries

5. **Keycloak Integration**
   - Description: Application must communicate with Keycloak for auth
   - Acceptance: No Keycloak connection errors in logs
   - Acceptance: OAuth flow can initiate successfully

### Edge Cases

1. **Missing Environment Variables** - Container should fail to start gracefully with clear error message if required env vars are missing
2. **Database Not Ready** - Backend should wait/retry if database is not immediately available
3. **Port Already in Use** - docker-compose should fail clearly if ports conflict
4. **UI Build Artifacts Missing** - Docker build should fail if UI files are not present or not built
5. **Container Exit on Error** - Container should exit with non-zero code on startup failure, not continue running broken

## Implementation Notes

### DO
- Examine current Dockerfile CMD/ENTRYPOINT to identify why container exits
- Check if uvicorn/gunicorn is installed in Docker image
- Ensure UI build step runs during Docker build if needed
- Use `docker-compose logs backend` to diagnose startup issues
- Add health checks to docker-compose.yml
- Verify all static assets are copied into Docker image
- Test with `docker-compose up --build` to ensure clean build works

### DON'T
- Don't use background process (&) in CMD - container will exit
- Don't bind to localhost in container - use 0.0.0.0
- Don't forget to copy UI/static files into Docker image
- Don't hardcode localhost for database - use service name "postgres"
- Don't ignore build warnings about missing files
- Don't skip testing full stack (all services) together

## Development Environment

### Start Services

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Service URLs
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000
- **Keycloak**: http://localhost:8080

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `KEYCLOAK_URL` - Keycloak server URL
- `KEYCLOAK_REALM` - Keycloak realm name
- `KEYCLOAK_CLIENT_ID` - OAuth client ID
- `KEYCLOAK_CLIENT_SECRET` - OAuth client secret
- `HOST` - Default: 0.0.0.0
- `PORT` - Default: 8000
- `WORKERS` - Default: 4
- `LOG_LEVEL` - Default: INFO
- `CORS_ORIGINS` - Allowed CORS origins

## Success Criteria

The task is complete when:

1. [ ] `docker-compose up` successfully starts all services without errors
2. [ ] Backend container remains running (no exit/restart loops)
3. [ ] UI loads in browser at http://localhost:8000
4. [ ] Health check endpoint returns 200 OK
5. [ ] API documentation is accessible at /docs
6. [ ] No database connection errors in logs
7. [ ] Container logs show clean startup sequence
8. [ ] All services can communicate (backend ↔ postgres, backend ↔ keycloak)

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| Docker build syntax | `Dockerfile` | Image builds without errors |
| docker-compose syntax | `docker-compose.yml` | File validates successfully (`docker-compose config`) |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Service startup | docker-compose | All services reach "running" state |
| Backend health check | backend → postgres | `/health` endpoint returns 200 |
| Database connection | backend ↔ postgres | No connection errors in logs |
| Static file serving | backend UI | UI assets load without 404s |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Full stack startup | 1. Run `docker-compose up --build` 2. Wait for services to start 3. Access UI in browser | All services running, UI loads, API responsive |
| API access | 1. Start services 2. Call http://localhost:8000/health 3. Access /docs | Health returns 200, docs page renders |
| Container restart | 1. Start services 2. Restart backend container 3. Verify functionality | Container restarts successfully, app still works |

### Browser Verification
| Page/Component | URL | Checks |
|----------------|-----|--------|
| UI Home | `http://localhost:8000/` | Page loads, no 404, styles render |
| API Documentation | `http://localhost:8000/docs` | Swagger UI renders, can try endpoints |
| Health Endpoint | `http://localhost:8000/health` | Returns JSON with status "healthy" |

### Docker Verification
| Check | Command | Expected |
|-------|---------|----------|
| Container status | `docker-compose ps` | All services "Up" |
| Backend logs | `docker-compose logs backend` | No ERROR or FATAL messages |
| Image size | `docker images` | Reasonable size (< 1GB ideally) |
| Port bindings | `docker port` | Correct ports mapped (8000:8000) |

### Troubleshooting Commands (for QA)
```bash
# Check container status
docker-compose ps

# View backend logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up

# Execute into container to debug
docker-compose exec backend bash

# Check environment variables
docker-compose exec backend env

# Test health endpoint
curl http://localhost:8000/health
```

### QA Sign-off Requirements
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Browser verification complete
- [ ] Docker container status verified
- [ ] No regressions in existing functionality
- [ ] Startup time is reasonable (< 30 seconds for all services)
- [ ] No resource leaks (container memory/CPU stable)
- [ ] Code follows established patterns
- [ ] No security vulnerabilities introduced (check exposed ports, secrets)

### Common Failure Modes to Check
- [ ] Container exits immediately after start
- [ ] Container restarts repeatedly (crash loop)
- [ ] UI returns 404 Not Found
- [ ] Database connection refused
- [ ] Port conflicts (address already in use)
- [ ] Missing static files in container
- [ ] Environment variables not passed to container
- [ ] Health check fails or times out
