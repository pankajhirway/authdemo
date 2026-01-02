"""Admin API routes - /api/v1/admin/*"""

from typing import Annotated

from fastapi import APIRouter
from app.api.dependencies.auth import require_role
from app.security import TokenData

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/health")
async def get_health(
    current_user: Annotated[TokenData, require_role("admin")],
) -> dict:
    """System health check. Requires admin role"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z",
    }


@router.get("/metrics")
async def get_metrics(
    current_user: Annotated[TokenData, require_role("admin")],
) -> dict:
    """System metrics. Requires admin role"""
    return {
        "events_processed": 0,
        "active_users": 0,
        "projection_lag_seconds": 0,
    }
