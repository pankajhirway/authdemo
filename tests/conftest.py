"""Test configuration and fixtures."""

import asyncio
from typing import AsyncGenerator
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.db.session import Base, get_session
from app.core.config import settings

# Test database URL - disable SSL for local development
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:aw2555@localhost:5432/authz_authn_test_db"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> asyncio.AbstractEventLoop:
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def setup_database():
    """Set up test database."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Cleanup - handle errors gracefully
    try:
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    except Exception:
        # Ignore cleanup errors to avoid masking actual test failures
        pass
    finally:
        # Dispose engine to release connections
        await test_engine.dispose()


@pytest.fixture
async def db_session(setup_database) -> AsyncGenerator[AsyncSession, None]:
    """Get a test database session."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Get a test client."""
    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    # Create test app without rate limiting middleware for faster testing
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from app.api.routes import admin, auditor, operator, supervisor
    from app.core.config import settings

    test_app = FastAPI(
        title="AuthzAuthn Demo API - Test",
        version="0.1.0",
    )

    # Configure CORS
    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Add error handling middleware only (skip rate limiting for tests)
    from app.middleware import ErrorHandlingMiddleware
    test_app.add_middleware(ErrorHandlingMiddleware)

    # Override database session
    test_app.dependency_overrides[get_session] = override_get_session

    # Include routers
    test_app.include_router(operator.router, prefix=settings.api_v1_prefix)
    test_app.include_router(supervisor.router, prefix=settings.api_v1_prefix)
    test_app.include_router(auditor.router, prefix=settings.api_v1_prefix)
    test_app.include_router(admin.router, prefix=settings.api_v1_prefix)

    # Health check endpoint
    from fastapi.responses import JSONResponse

    @test_app.get("/health")
    async def health_check() -> JSONResponse:
        return JSONResponse(content={"status": "healthy", "service": "test"})

    async with AsyncClient(
        transport=ASGITransport(app=test_app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def mock_user_token():
    """Create a mock JWT token for testing."""
    return {
        "sub": str(uuid4()),
        "preferred_username": "testuser",
        "email": "test@example.com",
        "role": "operator",
        "scopes": ["data:create", "data:read:own"],
        "exp": 9999999999,
        "iat": 1234567890,
        "iss": "http://localhost:8080/realms/authz-authn-demo",
    }
