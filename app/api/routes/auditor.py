"""Auditor API routes - /api/v1/auditor/*"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import CurrentUser, require_role
from app.security import TokenData
from app.db.session import get_session
from app.models.event import AuditLog, Event
from app.services.projections import DataEntryProjection
from app.services.event_writer import EventWriter

from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auditor", tags=["auditor"])


@router.get("/data")
async def list_data_entries(
    current_user: Annotated[TokenData, require_role("auditor")],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = 100,
    offset: int = 0,
) -> dict:
    """
    List all data entries (read-only).

    Auditors have read-only access to all data.
    Requires scope: data:read:all
    """
    stmt = select(DataEntryProjection).order_by(
        DataEntryProjection.created_at.desc()
    ).offset(offset).limit(limit)

    result = await session.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [_filter_for_auditor(item) for item in items],
        "total": len(items),
        "limit": limit,
        "offset": offset,
    }


@router.get("/data/{entry_id}")
async def get_data_entry(
    entry_id: UUID,
    current_user: Annotated[TokenData, require_role("auditor")],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """
    Get any data entry with full details.

    Auditors can read any entry with complete information.
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

    return _filter_for_auditor(entry)


@router.get("/data/{entry_id}/events")
async def get_entry_events(
    entry_id: UUID,
    current_user: Annotated[TokenData, require_role("auditor")],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """
    Get complete event history for a data entry.

    Auditors can view the full event history for compliance.
    Requires scope: events:read
    """
    stmt = select(Event).where(
        Event.entity_id == entry_id,
        Event.entity_type == "data_entry",
    ).order_by(Event.timestamp.asc())

    result = await session.execute(stmt)
    events = result.scalars().all()

    return {
        "entry_id": str(entry_id),
        "events": [
            {
                "event_id": str(e.event_id),
                "event_type": e.event_type,
                "event_category": e.event_category,
                "payload": e.payload,
                "previous_payload": e.previous_payload,
                "actor_id": str(e.actor_id),
                "actor_role": e.actor_role,
                "actor_username": e.actor_username,
                "timestamp": e.timestamp.isoformat(),
                "correlation_id": str(e.correlation_id) if e.correlation_id else None,
                "causation_id": str(e.causation_id) if e.causation_id else None,
            }
            for e in events
        ],
        "total_events": len(events),
    }


@router.get("/audit")
async def get_audit_logs(
    current_user: Annotated[TokenData, require_role("auditor")],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = 100,
    actor_id: UUID | None = None,
    from_date: str | None = None,
) -> dict:
    """
    Get audit logs.

    Auditors have access to the complete audit trail.
    Requires scope: audit:read
    """
    stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)

    if actor_id:
        stmt = stmt.where(AuditLog.actor_id == actor_id)

    # TODO: Add date filtering

    result = await session.execute(stmt)
    logs = result.scalars().all()

    return {
        "items": [
            {
                "audit_id": str(log.audit_id),
                "actor_id": str(log.actor_id),
                "actor_role": log.actor_role,
                "actor_username": log.actor_username,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": str(log.resource_id) if log.resource_id else None,
                "scope_granted": log.scope_granted,
                "request_id": str(log.request_id) if log.request_id else None,
                "request_path": log.request_path,
                "request_method": log.request_method,
                "success": log.success,
                "error_message": log.error_message,
                "status_code": log.status_code,
                "timestamp": log.timestamp.isoformat(),
            }
            for log in logs
        ],
        "total": len(logs),
    }


def _filter_for_auditor(entry: DataEntryProjection) -> dict:
    """Apply field-level filtering for auditor role - auditors see everything."""
    return {
        "entry_id": str(entry.entry_id),
        "data": entry.data,
        "status": entry.status,
        "created_at": entry.created_at.isoformat(),
        "updated_at": entry.updated_at.isoformat(),
        "created_by": str(entry.created_by),
        "created_by_role": entry.created_by_role,
        "created_by_username": entry.created_by_username,
        "submitted_at": entry.submitted_at.isoformat() if entry.submitted_at else None,
        "confirmed_by": str(entry.confirmed_by) if entry.confirmed_by else None,
        "confirmed_at": entry.confirmed_at.isoformat() if entry.confirmed_at else None,
        "confirmed_by_username": entry.confirmed_by_username,
        "rejected_by": str(entry.rejected_by) if entry.rejected_by else None,
        "rejected_at": entry.rejected_at.isoformat() if entry.rejected_at else None,
        "rejected_by_username": entry.rejected_by_username,
        "rejected_reason": entry.rejected_reason,
        "correction_count": entry.correction_count,
        "last_corrected_at": (
            entry.last_corrected_at.isoformat() if entry.last_corrected_at else None
        ),
        "last_corrected_by": (
            str(entry.last_corrected_by) if entry.last_corrected_by else None
        ),
        "last_corrected_by_username": entry.last_corrected_by_username,
        "version": entry.version,
    }
