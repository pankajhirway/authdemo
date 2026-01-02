"""Event store models - append-only, immutable event storage."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field, field_validator
from sqlalchemy import JSON, DateTime, Index, String, Text, BigInteger
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Event(Base):
    """
    Append-only event storage.

    All state changes are recorded as immutable events.
    Once written, events cannot be modified or deleted.
    """

    __tablename__ = "events"

    # Primary key
    event_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    event_version: Mapped[int] = mapped_column(BigInteger, default=1, nullable=False)

    # Event identification
    entity_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)

    # Event classification
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_category: Mapped[str] = mapped_column(String(50), nullable=False)

    # Event data (immutable)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    previous_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    # Actor information (immutable)
    actor_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    actor_role: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_username: Mapped[str] = mapped_column(String(255), nullable=False)

    # Event metadata (immutable)
    correlation_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=True
    )
    causation_id: Mapped[UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )
    context: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    created_at_timestamptid: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Indexes
    __table_args__ = (
        Index("idx_events_entity", "entity_id", "entity_type"),
        Index("idx_events_timestamp", "timestamp"),
    )

    def __repr__(self) -> str:
        return (
            f"Event(event_id={self.event_id}, event_type={self.event_type}, "
            f"entity_id={self.entity_id}, actor={self.actor_username})"
        )


class AuditLog(Base):
    """
    Append-only audit log for compliance.

    All actions are logged with actor, action, timestamp, and result.
    """

    __tablename__ = "audit_logs"

    # Primary key
    audit_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)

    # Who performed the action
    actor_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    actor_role: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_username: Mapped[str] = mapped_column(String(255), nullable=False)

    # What was done
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    # Scope used for authorization
    scope_granted: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Request metadata
    request_id: Mapped[UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)
    request_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    request_method: Mapped[str | None] = mapped_column(String(10), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)

    # Result
    success: Mapped[bool] = mapped_column(nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status_code: Mapped[int | None] = mapped_column(nullable=True)

    # Timestamp (immutable)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False, default=datetime.utcnow
    )

    # Additional context
    context: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    # Indexes
    __table_args__ = (
        Index("idx_audit_resource", "resource_type", "resource_id"),
        Index("idx_audit_timestamp", "timestamp"),
    )

    def __repr__(self) -> str:
        return (
            f"AuditLog(audit_id={self.audit_id}, action={self.action}, "
            f"actor={self.actor_username}, success={self.success})"
        )


class Projection(Base):
    """Tracking table for projection consumers."""

    __tablename__ = "projections"

    projection_name: Mapped[str] = mapped_column(String(255), primary_key=True)
    last_processed_event_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    last_processed_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    def __repr__(self) -> str:
        return (
            f"Projection(name={self.projection_name}, "
            f"last_event_id={self.last_processed_event_id})"
        )
