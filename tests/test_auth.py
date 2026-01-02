"""Tests for authentication and authorization."""

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch

from app.main import app
from app.security import TokenData


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_protected_endpoint_without_auth(client: AsyncClient) -> None:
    """Test that protected endpoints return 401 without auth."""
    response = await client.get("/api/v1/operator/data")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_jwt_validation() -> None:
    """Test JWT token validation."""
    from app.security.jwt import JWTValidator

    validator = JWTValidator()

    # Test with invalid token
    with pytest.raises(Exception):
        await validator.validate("invalid.token.here")
