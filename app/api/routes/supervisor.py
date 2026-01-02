"""Supervisor API routes - /api/v1/supervisor/*"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.dependencies.auth import CurrentUser, require_role
from app.security import TokenData
from app.db.session import get_session
from app.models.event import Event
from app.services.projections import DataEntryProjection
from app.services.workflows import (
    DataEntryConfirmRequest,
    DataEntryCorrectRequest,
    DataEntryRejectRequest,
    WorkflowHandler,
)

from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/supervisor", tags=["supervisor"])


class ConfirmRequest(BaseModel):
    confirmation_note: str | None = None


class RejectRequest(BaseModel):
    rejection_reason: str


class CorrectRequest(BaseModel):
    corrected_data: dict
    fields_corrected: list[str]
    correction_note: str


@router.get("/data")
async def list_data_entries(
    current_user: Annotated[TokenData, require_role("supervisor")],
    session: Annotated[AsyncSession, Depends(get_session)],
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    """
    List all data entries.

    Supervisors can see all entries, especially those requiring review.
    Requires scope: data:read:all
    """
    stmt = select(DataEntryProjection)

    if status:
        stmt = stmt.where(DataEntryProjection.status == status)

    stmt = stmt.order_by(DataEntryProjection.created_at.desc()).offset(offset).limit(limit)

    result = await session.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [_filter_for_supervisor(item) for item in items],
        "total": len(items),
        "limit": limit,
        "offset": offset,
    }


@router.get("/data/{entry_id}")
async def get_data_entry(
    entry_id: UUID,
    current_user: Annotated[TokenData, require_role("supervisor")],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """
    Get any data entry.

    Supervisors can read any entry with full details.
    Requires scope: data:read:all
    """
    stmt = select(DataEntryProjection).where(DataEntryProjection.entry_id == entry_id)
    result = await session.execute(stmt)
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    return _filter_for_supervisor(entry)


@router.post("/data/{entry_id}/confirm")
async def confirm_data_entry(
    entry_id: UUID,
    request: ConfirmRequest,
    current_user: Annotated[TokenData, require_role("supervisor")],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """
    Confirm a data entry.

    Requires scope: data:confirm
    """
    workflow = WorkflowHandler(session)
    confirm_request = DataEntryConfirmRequest(
        entry_id=entry_id,
        confirmation_note=request.confirmation_note,
        actor_id=current_user.user_id,
        actor_role=current_user.role,
        actor_username=current_user.username,
    )

    result = await workflow.confirm_entry(confirm_request)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.error_message,
        )

    return {
        "event_id": str(result.event_id),
        "status": "confirmed",
        "confirmed_at": result.timestamp.isoformat(),
    }


@router.post("/data/{entry_id}/reject")
async def reject_data_entry(
    entry_id: UUID,
    request: RejectRequest,
    current_user: Annotated[TokenData, require_role("supervisor")],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """
    Reject a data entry.

    Requires scope: data:reject
    """
    workflow = WorkflowHandler(session)
    reject_request = DataEntryRejectRequest(
        entry_id=entry_id,
        rejection_reason=request.rejection_reason,
        actor_id=current_user.user_id,
        actor_role=current_user.role,
        actor_username=current_user.username,
    )

    result = await workflow.reject_entry(reject_request)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.error_message,
        )

    return {
        "event_id": str(result.event_id),
        "status": "rejected",
        "rejected_at": result.timestamp.isoformat(),
    }


@router.post("/data/{entry_id}/correct")
async def correct_data_entry(
    entry_id: UUID,
    request: CorrectRequest,
    current_user: Annotated[TokenData, require_role("supervisor")],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """
    Correct a data entry.

    Creates a new event without mutating the original.
    Requires scope: data:correct
    """
    workflow = WorkflowHandler(session)
    correct_request = DataEntryCorrectRequest(
        entry_id=entry_id,
        corrected_data=request.corrected_data,
        fields_corrected=request.fields_corrected,
        correction_note=request.correction_note,
        actor_id=current_user.user_id,
        actor_role=current_user.role,
        actor_username=current_user.username,
    )

    result = await workflow.correct_entry(correct_request)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.error_message,
        )

    return {
        "event_id": str(result.event_id),
        "status": "corrected",
        "corrected_at": result.timestamp.isoformat(),
    }


def _filter_for_supervisor(entry: DataEntryProjection) -> dict:
    """Apply field-level filtering for supervisor role."""
    return {
        "entry_id": str(entry.entry_id),
        "data": entry.data,
        "status": entry.status,
        "created_at": entry.created_at.isoformat(),
        "updated_at": entry.updated_at.isoformat(),
        "created_by_username": entry.created_by_username,
        "created_by": str(entry.created_by),
        "submitted_at": entry.submitted_at.isoformat() if entry.submitted_at else None,
        "confirmed_by_username": entry.confirmed_by_username,
        "confirmed_at": entry.confirmed_at.isoformat() if entry.confirmed_at else None,
        "rejected_by_username": entry.rejected_by_username,
        "rejected_at": entry.rejected_at.isoformat() if entry.rejected_at else None,
        "rejected_reason": entry.rejected_reason,
        "correction_count": entry.correction_count,
        "last_corrected_at": (
            entry.last_corrected_at.isoformat() if entry.last_corrected_at else None
        ),
        "last_corrected_by_username": entry.last_corrected_by_username,
    }
