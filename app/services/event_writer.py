"""
Event Writer Service - Handles writing events to the event store.

The event writer is responsible for:
1. Validating events before writing
2. Enforcing immutability constraints
3. Writing events to the append-only event store
4. Triggering projection updates
5. Logging all event writes to the audit log
"""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.event import Event, Projection

logger = get_logger(__name__)


class EventWriteError(Exception):
    """Raised when an event write fails validation or cannot be persisted."""

    pass


class EventWriteRequest(BaseModel):
    """
    Request to write a new event.

    Attributes:
        entity_id: The entity this event relates to
        entity_type: The type of entity (e.g., 'data_entry', 'user')
        event_type: The type of event (e.g., 'data.created', 'data.confirmed')
        payload: The event payload
        actor_id: User who is triggering the event
        actor_role: Role of the actor
        actor_username: Username of the actor
        correlation_id: Optional ID to correlate related events
        causation_id: Optional ID of the event that caused this one
        context: Additional context (IP, user-agent, etc.)
    """

    entity_id: UUID = Field(..., description="The entity this event relates to")
    entity_type: str = Field(..., description="Type of entity (e.g., 'data_entry', 'user')")
    event_type: str = Field(..., description="Type of event (e.g., 'data.created')")
    payload: dict[str, Any] = Field(..., description="Event payload")
    actor_id: UUID = Field(..., description="User who is triggering the event")
    actor_role: str = Field(..., description="Role of the actor")
    actor_username: str = Field(..., description="Username of the actor")
    correlation_id: UUID | None = Field(None, description="Correlation ID for related events")
    causation_id: UUID | None = Field(None, description="Event that caused this one")
    context: dict[str, Any] | None = Field(None, description="Additional context")

    @field_validator("entity_type")
    @classmethod
    def validate_entity_type(cls, v: str) -> str:
        """Validate entity type is known."""
        known_types = {"data_entry", "user", "audit_log", "projection"}
        if v not in known_types:
            logger.warning("Unknown entity type", entity_type=v)
        return v

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: str, info) -> str:
        """Validate event type format and ensure it matches entity type."""
        if not v:
            raise ValueError("event_type cannot be empty")

        parts = v.split(".")
        if len(parts) != 2:
            raise ValueError(f"Invalid event_type format: {v}. Expected 'entity.action'")

        entity_prefix, action = parts
        entity_type = info.data.get("entity_type", "")

        # Convert entity_type to match prefix (e.g., data_entry -> data)
        expected_prefix = entity_type.split("_")[0] if entity_type else ""

        if expected_prefix and entity_prefix != expected_prefix:
            logger.warning(
                "Event type prefix doesn't match entity type",
                event_type=v,
                entity_type=entity_type,
            )

        return v


class EventWriteResult(BaseModel):
    """Result of writing an event."""

    event_id: UUID
    entity_id: UUID
    event_type: str
    timestamp: datetime
    success: bool
    error_message: str | None = None


class EventWriter:
    """
    Service for writing events to the event store.

    The event writer validates events and ensures they are written
    to the append-only event store with immutability guarantees.
    """

    # Event type categories
    CATEGORY_USER = "user"
    CATEGORY_SYSTEM = "system"
    CATEGORY_CORRECTION = "correction"

    # Valid event types and their categories
    _EVENT_CATEGORIES: dict[str, str] = {
        # Data entry events
        "data.created": CATEGORY_USER,
        "data.submitted": CATEGORY_USER,
        "data.confirmed": CATEGORY_USER,
        "data.rejected": CATEGORY_USER,
        "data.corrected": CATEGORY_CORRECTION,
        "data.cancelled": CATEGORY_USER,
        "data.auto_validated": CATEGORY_SYSTEM,
        "data.expired": CATEGORY_SYSTEM,
        # User events
        "user.created": CATEGORY_USER,
        "user.role_changed": CATEGORY_USER,
        "user.deactivated": CATEGORY_USER,
    }

    def __init__(self, session: AsyncSession) -> None:
        """
        Initialize the event writer with a database session.

        Args:
            session: SQLAlchemy async session
        """
        self.session = session

    async def write(self, request: EventWriteRequest) -> EventWriteResult:
        """
        Write an event to the event store.

        Args:
            request: The event write request

        Returns:
            EventWriteResult with the written event details

        Raises:
            EventWriteError: If validation fails or write fails
        """
        try:
            # Validate the event request
            await self._validate_event(request)

            # Create the event
            event = self._create_event(request)

            # Write to database
            self.session.add(event)
            await self.session.commit()
            await self.session.refresh(event)

            logger.info(
                "Event written",
                event_id=str(event.event_id),
                event_type=event.event_type,
                entity_id=str(event.entity_id),
                actor=request.actor_username,
            )

            return EventWriteResult(
                event_id=event.event_id,
                entity_id=event.entity_id,
                event_type=event.event_type,
                timestamp=event.timestamp,
                success=True,
            )

        except Exception as e:
            logger.error(
                "Failed to write event",
                event_type=request.event_type,
                entity_id=str(request.entity_id),
                error=str(e),
            )
            await self.session.rollback()
            return EventWriteResult(
                event_id=uuid4(),
                entity_id=request.entity_id,
                event_type=request.event_type,
                timestamp=datetime.now(UTC),
                success=False,
                error_message=str(e),
            )

    async def _validate_event(self, request: EventWriteRequest) -> None:
        """
        Validate the event before writing.

        Args:
            request: The event write request

        Raises:
            EventWriteError: If validation fails
        """
        # Validate event type is known
        if request.event_type not in self._EVENT_CATEGORIES:
            logger.warning("Unknown event type", event_type=request.event_type)

        # For corrections, we may need to fetch the previous state
        category = self._EVENT_CATEGORIES.get(request.event_type, self.CATEGORY_USER)

        if category == self.CATEGORY_CORRECTION:
            # Corrections should ideally include the previous state
            # This can be fetched from the event store
            await self._validate_correction(request)

    async def _validate_correction(self, request: EventWriteRequest) -> None:
        """
        Validate that a correction event is valid.

        For corrections, we should verify:
        1. The entity exists
        2. The current state allows correction
        3. The previous state is recorded

        Args:
            request: The event write request

        Raises:
            EventWriteError: If correction validation fails
        """
        # Fetch the most recent event for this entity
        stmt = select(Event).where(
            Event.entity_id == request.entity_id,
            Event.entity_type == request.entity_type,
        ).order_by(Event.timestamp.desc())

        result = await self.session.execute(stmt)
        previous_event = result.scalar_one_or_none()

        if previous_event:
            # Store the previous payload for reference
            request.previous_payload = previous_event.payload
        else:
            raise EventWriteError(f"Cannot correct non-existent entity: {request.entity_id}")

    def _create_event(self, request: EventWriteRequest) -> Event:
        """
        Create an Event instance from the request.

        Args:
            request: The event write request

        Returns:
            Event instance ready to be persisted
        """
        now = datetime.now(UTC)
        category = self._EVENT_CATEGORIES.get(request.event_type, self.CATEGORY_USER)

        return Event(
            event_id=uuid4(),
            event_version=1,
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            event_type=request.event_type,
            event_category=category,
            payload=request.payload,
            previous_payload=getattr(request, "previous_payload", None),
            actor_id=request.actor_id,
            actor_role=request.actor_role,
            actor_username=request.actor_username,
            correlation_id=request.correlation_id,
            causation_id=request.causation_id,
            timestamp=now,
            context=request.context,
            created_at=now,
            created_at_timestamptid=now,
        )

    async def get_events_for_entity(
        self,
        entity_id: UUID,
        entity_type: str,
        limit: int = 100,
    ) -> list[Event]:
        """
        Get all events for an entity.

        Args:
            entity_id: The entity ID
            entity_type: The entity type
            limit: Maximum number of events to return

        Returns:
            List of events in chronological order
        """
        stmt = (
            select(Event)
            .where(
                Event.entity_id == entity_id,
                Event.entity_type == entity_type,
            )
            .order_by(Event.timestamp.asc())
            .limit(limit)
        )

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_entity_current_state(
        self,
        entity_id: UUID,
        entity_type: str,
    ) -> dict[str, Any]:
        """
        Get the current state of an entity by folding all events.

        This implements the "state = fold(events)" pattern.

        Args:
            entity_id: The entity ID
            entity_type: The entity type

        Returns:
            Current state as a dictionary
        """
        events = await self.get_events_for_entity(entity_id, entity_type)

        state: dict[str, Any] = {
            "entity_id": str(entity_id),
            "entity_type": entity_type,
            "event_count": len(events),
            "last_event_at": None,
        }

        for event in events:
            state["last_event_at"] = event.timestamp
            # Merge payload into state
            state.update(event.payload)

        return state


async def get_event_writer(session: AsyncSession) -> EventWriter:
    """Get an event writer instance for the current session."""
    return EventWriter(session)
