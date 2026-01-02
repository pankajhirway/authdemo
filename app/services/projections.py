"""
Read Model Projections Service.

Builds and maintains read models by consuming events from the event store.
Projections are idempotent and can be rebuilt from event history.
"""

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlalchemy import and_, delete, select, update
from sqlalchemy.dialects.postgresql import insert, JSONB
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.core.logging import get_logger
from app.db.session import Base
from app.models.event import Event, Projection
from app.services.workflows import DataEntryState

logger = get_logger(__name__)


class DataEntryProjection(Base):
    """
    Read model projection for data entries.

    This is a materialized view built from the event stream.
    It can be rebuilt by replaying all events.
    """

    __tablename__ = "data_entries"

    entry_id: Mapped[UUID] = mapped_column(primary_key=True)
    data: Mapped[Any] = mapped_column(JSONB, default=dict)
    status: Mapped[str] = mapped_column(default="draft")
    created_by: Mapped[UUID] = mapped_column()
    created_by_role: Mapped[str] = mapped_column()
    created_by_username: Mapped[str] = mapped_column()
    submitted_at: Mapped[datetime | None] = mapped_column(nullable=True)
    confirmed_by: Mapped[UUID | None] = mapped_column(nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    confirmed_by_username: Mapped[str | None] = mapped_column(nullable=True)
    rejected_by: Mapped[UUID | None] = mapped_column(nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(nullable=True)
    rejected_by_username: Mapped[str | None] = mapped_column(nullable=True)
    rejected_reason: Mapped[str | None] = mapped_column(nullable=True)
    correction_count: Mapped[int] = mapped_column(default=0)
    last_corrected_at: Mapped[datetime | None] = mapped_column(nullable=True)
    last_corrected_by: Mapped[UUID | None] = mapped_column(nullable=True)
    last_corrected_by_username: Mapped[str | None] = mapped_column(nullable=True)
    version: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
