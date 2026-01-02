"""
Domain Event Workflow Handlers.

Implements the business logic workflows for data entry lifecycle,
including system-generated events, confirmation/correction flows,
and ensuring corrections don't mutate state.
"""

from dataclasses import dataclass
from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.services.event_writer import (
    EventWriter,
    EventWriteRequest,
    EventWriteResult,
    EventWriteError,
)

logger = get_logger(__name__)


class DataEntryState(str, Enum):
    """States in the data entry lifecycle."""

    DRAFT = "draft"
    SUBMITTED = "submitted"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    CORRECTED = "corrected"
    CANCELLED = "cancelled"


@dataclass
class StateTransition:
    """Represents a valid state transition."""

    from_state: DataEntryState
    to_state: DataEntryState
    event_type: str
    required_role: str
    allowed: bool = True


# Valid state transitions for data entries
STATE_TRANSITIONS: dict[tuple[DataEntryState, str], StateTransition] = {
    # From draft
    (DataEntryState.DRAFT, "data.submitted"): StateTransition(
        DataEntryState.DRAFT, DataEntryState.SUBMITTED, "data.submitted", "operator"
    ),
    # From submitted
    (DataEntryState.SUBMITTED, "data.confirmed"): StateTransition(
        DataEntryState.SUBMITTED, DataEntryState.CONFIRMED, "data.confirmed", "supervisor"
    ),
    (DataEntryState.SUBMITTED, "data.rejected"): StateTransition(
        DataEntryState.SUBMITTED, DataEntryState.REJECTED, "data.rejected", "supervisor"
    ),
    (DataEntryState.SUBMITTED, "data.cancelled"): StateTransition(
        DataEntryState.SUBMITTED, DataEntryState.CANCELLED, "data.cancelled", "operator"
    ),
    # From confirmed
    (DataEntryState.CONFIRMED, "data.corrected"): StateTransition(
        DataEntryState.CONFIRMED, DataEntryState.CORRECTED, "data.corrected", "supervisor"
    ),
    # From rejected
    (DataEntryState.REJECTED, "data.corrected"): StateTransition(
        DataEntryState.REJECTED, DataEntryState.CORRECTED, "data.corrected", "supervisor"
    ),
    (DataEntryState.REJECTED, "data.cancelled"): StateTransition(
        DataEntryState.REJECTED, DataEntryState.CANCELLED, "data.cancelled", "operator"
    ),
    # From corrected - can be resubmitted or confirmed
    (DataEntryState.CORRECTED, "data.submitted"): StateTransition(
        DataEntryState.CORRECTED, DataEntryState.SUBMITTED, "data.submitted", "supervisor"
    ),
    (DataEntryState.CORRECTED, "data.confirmed"): StateTransition(
        DataEntryState.CORRECTED, DataEntryState.CONFIRMED, "data.confirmed", "supervisor"
    ),
}


class DataEntryCreateRequest(BaseModel):
    """Request to create a new data entry."""

    data: dict[str, Any] = Field(..., description="The data to store")
    entry_type: str = Field(..., description="Type/category of the entry")
    actor_id: UUID = Field(..., description="User creating the entry")
    actor_role: str = Field(..., description="Role of the user")
    actor_username: str = Field(..., description="Username of the user")


class DataEntryConfirmRequest(BaseModel):
    """Request to confirm a data entry."""

    entry_id: UUID = Field(..., description="The entry to confirm")
    confirmation_note: str | None = Field(None, description="Optional note")
    actor_id: UUID = Field(..., description="Supervisor confirming")
    actor_role: str = Field(..., description="Must be supervisor")
    actor_username: str = Field(..., description="Username of supervisor")


class DataEntryRejectRequest(BaseModel):
    """Request to reject a data entry."""

    entry_id: UUID = Field(..., description="The entry to reject")
    rejection_reason: str = Field(..., description="Reason for rejection")
    actor_id: UUID = Field(..., description="Supervisor rejecting")
    actor_role: str = Field(..., description="Must be supervisor")
    actor_username: str = Field(..., description="Username of supervisor")


class DataEntryCorrectRequest(BaseModel):
    """Request to correct a data entry."""

    entry_id: UUID = Field(..., description="The entry to correct")
    corrected_data: dict[str, Any] = Field(..., description="The corrected data")
    fields_corrected: list[str] = Field(..., description="List of corrected field names")
    correction_note: str = Field(..., description="Explanation of correction")
    actor_id: UUID = Field(..., description="Supervisor correcting")
    actor_role: str = Field(..., description="Must be supervisor")
    actor_username: str = Field(..., description="Username of supervisor")


class WorkflowHandler:
    """
    Handles domain event workflows.

    This service orchestrates the business logic for:
    - Creating entities with initial events
    - Confirming submitted entries
    - Rejecting submitted entries
    - Correcting existing entries (creates new events, no mutation)
    - System-generated events
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize the workflow handler with a database session."""
        self.session = session
        self.event_writer = EventWriter(session)

    async def create_data_entry(self, request: DataEntryCreateRequest) -> EventWriteResult:
        """
        Create a new data entry with an initial event.

        Args:
            request: The create request

        Returns:
            EventWriteResult with the created event

        Raises:
            EventWriteError: If creation fails
        """
        entry_id = uuid4()

        event_request = EventWriteRequest(
            entity_id=entry_id,
            entity_type="data_entry",
            event_type="data.created",
            payload={
                "data": request.data,
                "entry_type": request.entry_type,
                "state": DataEntryState.DRAFT,
            },
            actor_id=request.actor_id,
            actor_role=request.actor_role,
            actor_username=request.actor_username,
            correlation_id=uuid4(),
        )

        # Optionally trigger system validation event
        # This would be done by a background worker in production
        # await self._trigger_auto_validation(entry_id, request.data)

        return await self.event_writer.write(event_request)

    async def confirm_entry(self, request: DataEntryConfirmRequest) -> EventWriteResult:
        """
        Confirm a submitted data entry.

        Args:
            request: The confirm request

        Returns:
            EventWriteResult with the confirmation event

        Raises:
            EventWriteError: If confirmation fails or state is invalid
        """
        # Get current state
        current_state = await self._get_current_state(request.entry_id)

        # Validate transition
        transition_key = (current_state, "data.confirmed")
        if transition_key not in STATE_TRANSITIONS:
            raise EventWriteError(
                f"Cannot confirm entry in state '{current_state}'. "
                f"Entry must be in 'submitted' state."
            )

        transition = STATE_TRANSITIONS[transition_key]
        if transition.required_role != request.actor_role and request.actor_role != "admin":
            raise EventWriteError(
                f"Role '{request.actor_role}' not allowed to confirm entries. "
                f"Required: '{transition.required_role}'"
            )

        # Create confirmation event
        event_request = EventWriteRequest(
            entity_id=request.entry_id,
            entity_type="data_entry",
            event_type="data.confirmed",
            payload={
                "state": DataEntryState.CONFIRMED,
                "confirmed_by": request.actor_username,
                "confirmation_note": request.confirmation_note,
            },
            actor_id=request.actor_id,
            actor_role=request.actor_role,
            actor_username=request.actor_username,
            correlation_id=uuid4(),
        )

        return await self.event_writer.write(event_request)

    async def reject_entry(self, request: DataEntryRejectRequest) -> EventWriteResult:
        """
        Reject a submitted data entry.

        Args:
            request: The reject request

        Returns:
            EventWriteResult with the rejection event

        Raises:
            EventWriteError: If rejection fails or state is invalid
        """
        # Get current state
        current_state = await self._get_current_state(request.entry_id)

        # Validate transition
        transition_key = (current_state, "data.rejected")
        if transition_key not in STATE_TRANSITIONS:
            raise EventWriteError(
                f"Cannot reject entry in state '{current_state}'. "
                f"Entry must be in 'submitted' or 'corrected' state."
            )

        transition = STATE_TRANSITIONS[transition_key]
        if transition.required_role != request.actor_role and request.actor_role != "admin":
            raise EventWriteError(
                f"Role '{request.actor_role}' not allowed to reject entries. "
                f"Required: '{transition.required_role}'"
            )

        # Create rejection event
        event_request = EventWriteRequest(
            entity_id=request.entry_id,
            entity_type="data_entry",
            event_type="data.rejected",
            payload={
                "state": DataEntryState.REJECTED,
                "rejected_by": request.actor_username,
                "rejection_reason": request.rejection_reason,
            },
            actor_id=request.actor_id,
            actor_role=request.actor_role,
            actor_username=request.actor_username,
            correlation_id=uuid4(),
        )

        return await self.event_writer.write(event_request)

    async def correct_entry(self, request: DataEntryCorrectRequest) -> EventWriteResult:
        """
        Correct an existing data entry.

        IMPORTANT: This creates a NEW event and does NOT mutate existing events.
        The correction workflow preserves full history.

        Args:
            request: The correction request

        Returns:
            EventWriteResult with the correction event

        Raises:
            EventWriteError: If correction fails or state is invalid
        """
        # Get current state and previous payload
        current_state = await self._get_current_state(request.entry_id)
        previous_payload = await self._get_current_payload(request.entry_id)

        # Validate transition
        transition_key = (current_state, "data.corrected")
        if transition_key not in STATE_TRANSITIONS:
            raise EventWriteError(
                f"Cannot correct entry in state '{current_state}'. "
                f"Entry must be in 'confirmed' or 'rejected' state."
            )

        transition = STATE_TRANSITIONS[transition_key]
        if transition.required_role != request.actor_role and request.actor_role != "admin":
            raise EventWriteError(
                f"Role '{request.actor_role}' not allowed to correct entries. "
                f"Required: '{transition.required_role}'"
            )

        # Create correction event with previous payload preserved
        event_request = EventWriteRequest(
            entity_id=request.entry_id,
            entity_type="data_entry",
            event_type="data.corrected",
            payload={
                "state": DataEntryState.CORRECTED,
                "corrected_data": request.corrected_data,
                "fields_corrected": request.fields_corrected,
                "correction_note": request.correction_note,
                "corrected_by": request.actor_username,
                # Store the previous data for reference (immutable)
                "previous_data": previous_payload,
            },
            actor_id=request.actor_id,
            actor_role=request.actor_role,
            actor_username=request.actor_username,
            correlation_id=uuid4(),
            # The event_writer will fetch and store previous_payload
        )

        return await self.event_writer.write(event_request)

    async def _get_current_state(self, entry_id: UUID) -> DataEntryState:
        """
        Get the current state of a data entry.

        This is determined by the most recent event.

        Args:
            entry_id: The entry ID

        Returns:
            Current DataEntryState

        Raises:
            EventWriteError: If entry not found
        """
        current_state_dict = await self.event_writer.get_entity_current_state(
            entry_id, "data_entry"
        )

        if current_state_dict.get("event_count", 0) == 0:
            raise EventWriteError(f"Data entry not found: {entry_id}")

        state_str = current_state_dict.get("state", DataEntryState.DRAFT)
        return DataEntryState(state_str)

    async def _get_current_payload(self, entry_id: UUID) -> dict[str, Any]:
        """
        Get the current data payload for an entry.

        Args:
            entry_id: The entry ID

        Returns:
            Current data payload

        Raises:
            EventWriteError: If entry not found
        """
        current_state_dict = await self.event_writer.get_entity_current_state(
            entry_id, "data_entry"
        )

        if current_state_dict.get("event_count", 0) == 0:
            raise EventWriteError(f"Data entry not found: {entry_id}")

        return current_state_dict.get("data", {})
