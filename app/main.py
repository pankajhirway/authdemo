"""Main FastAPI application."""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import admin, auditor, operator, supervisor
from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.db.session import close_db, init_db
from app.middleware import ErrorHandlingMiddleware, RateLimitMiddleware

# Set up structured logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    # Startup
    logger.info("Starting application", environment=settings.environment)
    try:
        await init_db()
    except Exception as e:
        logger.warning("Database initialization failed, continuing anyway", error=str(e))

    yield

    # Shutdown
    logger.info("Shutting down application")
    await close_db()


# Create FastAPI application
app = FastAPI(
    title="AuthzAuthn Demo API",
    description="Backend-driven event-driven authorization/authentication platform",
    version="0.1.0",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add security middleware
app.add_middleware(RateLimitMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

# Mount static files for testing UI
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# Health check endpoint (no auth required)
@app.get("/health")
async def health_check() -> JSONResponse:
    """Health check endpoint."""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "authz-authn-demo",
            "environment": settings.environment,
        }
    )


# Redirect root to testing UI
@app.get("/")
async def root():
    """Redirect to testing UI."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/static/index.html")


# Include role-namespaced routers
app.include_router(operator.router, prefix=settings.api_v1_prefix)
app.include_router(supervisor.router, prefix=settings.api_v1_prefix)
app.include_router(auditor.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc) -> JSONResponse:
    """Global exception handler."""
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower(),
    )
