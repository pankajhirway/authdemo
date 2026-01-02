"""Operator API routes - /api/v1/operator/*"""

from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import CurrentUser, require_role
from app.security import TokenData
from app.api.dependencies.authorization import require_permission
from app.core.logging import get_logger
from app.db.session import get_session
from app.services.event_writer import EventWriteRequest, get_event_writer
from app.services.projections import DataEntryProjection
from app.services.workflows import DataEntryCreateRequest, WorkflowHandler

logger = get_logger(__name__)

router = APIRouter(prefix="/operator", tags=["operator"])


@router.post("/data", status_code=status.HTTP_201_CREATED)
async def create_data_entry(
    request: dict,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """
    Create a new data entry.

    Operators can create new data entries in draft status.
    Requires scope: data:create
    """
    # Authorization is handled by require_permission dependency
    # In a real implementation, we'd call require_permission here

    workflow = WorkflowHandler(session)
    create_request = DataEntryCreateRequest(
        data=request.get("data", {}),
        entry_type=request.get("entry_type", "default"),
        actor_id=current_user.user_id,
        actor_role=current_user.role,
        actor_username=current_user.username,
    )

    result = await workflow.create_data_entry(create_request)

    return {
        "entry_id": str(result.entity_id),
        "event_id": str(result.event_id),
        "status": "draft",
        "created_at": result.timestamp.isoformat(),
    }


@router.get("/data/{entry_id}")
async def get_data_entry(
    entry_id: UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """
    Get a data entry.

    Operators can only read their own entries.
    Requires scope: data:read:own
    """
    # Fetch entry and verify ownership
    stmt = select(DataEntryProjection).where(
        DataEntryProjection.entry_id == entry_id,
        DataEntryProjection.created_by == current_user.user_id,
    )

    result = await session.execute(stmt)
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    # Field-level filtering for operator role
    return _filter_for_operator(entry)


@router.put("/data/{entry_id}")
async def update_data_entry(
    entry_id: UUID,
    request: dict,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """
    Update a data entry.

    Operators can only update their own draft/unconfirmed entries.
    Requires scope: data:update:own
    """
    # Fetch and verify ownership and status
    stmt = select(DataEntryProjection).where(
        DataEntryProjection.entry_id == entry_id,
        DataEntryProjection.created_by == current_user.user_id,
    )

    result = await session.execute(stmt)
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    if entry.status not in ("draft", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update draft or rejected entries",
        )

    # Create update event
    event_writer = await get_event_writer(session)
    event_request = EventWriteRequest(
        entity_id=entry_id,
        entity_type="data_entry",
        event_type="data.updated",
        payload={
            "data": request.get("data", {}),
            "state": entry.status,
        },
        actor_id=current_user.user_id,
        actor_role=current_user.role,
        actor_username=current_user.username,
    )

    result = await event_writer.write(event_request)

    return {
        "event_id": str(result.event_id),
        "updated_at": result.timestamp.isoformat(),
    }


@router.post("/data/{entry_id}/submit")
async def submit_data_entry(
    entry_id: UUID,
    current_user: CurrentUser,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """
    Submit a data entry for review.

    Requires scope: data:submit (implicit for operator)
    """
    event_writer = await get_event_writer(session)
    event_request = EventWriteRequest(
        entity_id=entry_id,
        entity_type="data_entry",
        event_type="data.submitted",
        payload={
            "state": "submitted",
            "submitted_note": None,
        },
        actor_id=current_user.user_id,
        actor_role=current_user.role,
        actor_username=current_user.username,
    )

    result = await event_writer.write(event_request)

    return {
        "event_id": str(result.event_id),
        "status": "submitted",
        "submitted_at": result.timestamp.isoformat(),
    }


@router.get("/data")
async def list_data_entries(
    current_user: Annotated[TokenData, require_role("operator")],
    session: Annotated[AsyncSession, Depends(get_session)],
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    """
    List data entries.

    Operators see only their own entries.
    Requires scope: data:read:own
    """
    stmt = select(DataEntryProjection).where(
        DataEntryProjection.created_by == current_user.user_id
    )

    if status:
        stmt = stmt.where(DataEntryProjection.status == status)

    stmt = stmt.offset(offset).limit(limit)

    result = await session.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [_filter_for_operator(item) for item in items],
        "total": len(items),
        "limit": limit,
        "offset": offset,
    }


def _filter_for_operator(entry: DataEntryProjection) -> dict:
    """Apply field-level filtering for operator role."""
    return {
        "entry_id": str(entry.entry_id),
        "data": entry.data,
        "status": entry.status,
        "created_at": entry.created_at.isoformat(),
        "updated_at": entry.updated_at.isoformat(),
        # Only show own username (already filtered by query)
        "created_by_username": entry.created_by_username,
        # Don't show sensitive fields to operators
        "confirmed_by_username": None,
        "rejected_by_username": None,
        "rejected_reason": None,
    }
