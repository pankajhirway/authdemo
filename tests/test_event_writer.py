"""
Tests for Event Writer and Workflow services.

Tests the append-only event store, event validation, and workflow handlers.
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.event_writer import (
    EventWriter,
    EventWriteRequest,
    EventWriteResult,
    EventWriteError,
    get_event_writer,
)
from app.services.workflows import (
    WorkflowHandler,
    DataEntryCreateRequest,
    DataEntryConfirmRequest,
    DataEntryRejectRequest,
    DataEntryCorrectRequest,
    DataEntryState,
    STATE_TRANSITIONS,
    EventWriteError as WorkflowEventWriteError,
)


class TestEventWriteRequest:
    """Tests for EventWriteRequest validation."""

    def test_valid_event_write_request(self):
        """Test creating a valid event write request."""
        request = EventWriteRequest(
            entity_id=uuid4(),
            entity_type="data_entry",
            event_type="data.created",
            payload={"data": "test", "state": "draft"},
            actor_id=uuid4(),
            actor_role="operator",
            actor_username="testuser",
        )
        assert request.entity_type == "data_entry"
        assert request.event_type == "data.created"

    def test_event_type_validation_valid(self):
        """Test validation of valid event types."""
        request = EventWriteRequest(
            entity_id=uuid4(),
            entity_type="data_entry",
            event_type="data.created",
            payload={},
            actor_id=uuid4(),
            actor_role="operator",
            actor_username="testuser",
        )
        # Should not raise
        assert request.event_type == "data.created"

    def test_event_type_validation_invalid_format(self):
        """Test validation of invalid event type format."""
        with pytest.raises(ValueError, match="Invalid event_type format"):
            EventWriteRequest(
                entity_id=uuid4(),
                entity_type="data_entry",
                event_type="invalid_format",
                payload={},
                actor_id=uuid4(),
                actor_role="operator",
                actor_username="testuser",
            )

    def test_event_type_validation_empty(self):
        """Test validation of empty event type."""
        with pytest.raises(ValueError, match="event_type cannot be empty"):
            EventWriteRequest(
                entity_id=uuid4(),
                entity_type="data_entry",
                event_type="",
                payload={},
                actor_id=uuid4(),
                actor_role="operator",
                actor_username="testuser",
            )

    def test_entity_type_validation_unknown(self):
        """Test validation of unknown entity type (should warn but not error)."""
        # Unknown entity types should warn but not error
        request = EventWriteRequest(
            entity_id=uuid4(),
            entity_type="unknown_type",
            event_type="unknown.created",
            payload={},
            actor_id=uuid4(),
            actor_role="operator",
            actor_username="testuser",
        )
        assert request.entity_type == "unknown_type"

    def test_optional_fields(self):
        """Test event write request with optional fields."""
        request = EventWriteRequest(
            entity_id=uuid4(),
            entity_type="data_entry",
            event_type="data.created",
            payload={},
            actor_id=uuid4(),
            actor_role="operator",
            actor_username="testuser",
            correlation_id=uuid4(),
            causation_id=uuid4(),
            context={"ip": "127.0.0.1"},
        )
        assert request.correlation_id is not None
        assert request.causation_id is not None
        assert request.context is not None


class TestEventWriteResult:
    """Tests for EventWriteResult."""

    def test_successful_result(self):
        """Test a successful event write result."""
        event_id = uuid4()
        entity_id = uuid4()
        result = EventWriteResult(
            event_id=event_id,
            entity_id=entity_id,
            event_type="data.created",
            timestamp=datetime.now(UTC),
            success=True,
        )
        assert result.success is True
        assert result.error_message is None

    def test_failed_result(self):
        """Test a failed event write result."""
        result = EventWriteResult(
            event_id=uuid4(),
            entity_id=uuid4(),
            event_type="data.created",
            timestamp=datetime.now(UTC),
            success=False,
            error_message="Validation failed",
        )
        assert result.success is False
        assert result.error_message == "Validation failed"


class TestEventWriter:
    """Tests for EventWriter service."""

    @pytest.fixture
    def mock_session(self):
        """Create a mock database session."""
        session = AsyncMock(spec=AsyncSession)
        return session

    @pytest.fixture
    def event_writer(self, mock_session):
        """Create an EventWriter instance with mock session."""
        return EventWriter(mock_session)

    @pytest.mark.asyncio
    async def test_write_event_success(self, event_writer, mock_session):
        """Test successfully writing an event."""
        entity_id = uuid4()
        request = EventWriteRequest(
            entity_id=entity_id,
            entity_type="data_entry",
            event_type="data.created",
            payload={"data": "test"},
            actor_id=uuid4(),
            actor_role="operator",
            actor_username="testuser",
        )

        result = await event_writer.write(request)

        assert result.success is True
        assert result.entity_id == entity_id
        assert result.event_type == "data.created"
        assert result.error_message is None
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_write_event_failure(self, event_writer, mock_session):
        """Test handling write failure."""
        mock_session.commit.side_effect = Exception("Database error")

        request = EventWriteRequest(
            entity_id=uuid4(),
            entity_type="data_entry",
            event_type="data.created",
            payload={},
            actor_id=uuid4(),
            actor_role="operator",
            actor_username="testuser",
        )

        result = await event_writer.write(request)

        assert result.success is False
        assert result.error_message is not None
        mock_session.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_events_for_entity(self, event_writer, mock_session):
        """Test retrieving events for an entity."""
        entity_id = uuid4()
        # Set up the mock to return an empty list
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result

        events = await event_writer.get_events_for_entity(entity_id, "data_entry")

        assert isinstance(events, list)

    @pytest.mark.asyncio
    async def test_get_entity_current_state(self, event_writer, mock_session):
        """Test getting the current state of an entity."""
        entity_id = uuid4()
        # Set up the mock to return an empty list
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result

        state = await event_writer.get_entity_current_state(entity_id, "data_entry")

        assert isinstance(state, dict)
        assert "entity_id" in state
        assert "entity_type" in state


class TestDataEntryState:
    """Tests for DataEntryState enum."""

    def test_state_values(self):
        """Test all state enum values."""
        assert DataEntryState.DRAFT == "draft"
        assert DataEntryState.SUBMITTED == "submitted"
        assert DataEntryState.CONFIRMED == "confirmed"
        assert DataEntryState.REJECTED == "rejected"
        assert DataEntryState.CORRECTED == "corrected"
        assert DataEntryState.CANCELLED == "cancelled"


class TestStateTransitions:
    """Tests for state transition definitions."""

    def test_draft_to_submit_transition(self):
        """Test transition from draft to submitted."""
        key = (DataEntryState.DRAFT, "data.submitted")
        assert key in STATE_TRANSITIONS
        transition = STATE_TRANSITIONS[key]
        assert transition.to_state == DataEntryState.SUBMITTED
        assert transition.required_role == "operator"

    def test_submitted_to_confirm_transition(self):
        """Test transition from submitted to confirmed."""
        key = (DataEntryState.SUBMITTED, "data.confirmed")
        assert key in STATE_TRANSITIONS
        transition = STATE_TRANSITIONS[key]
        assert transition.to_state == DataEntryState.CONFIRMED
        assert transition.required_role == "supervisor"

    def test_submitted_to_reject_transition(self):
        """Test transition from submitted to rejected."""
        key = (DataEntryState.SUBMITTED, "data.rejected")
        assert key in STATE_TRANSITIONS
        transition = STATE_TRANSITIONS[key]
        assert transition.to_state == DataEntryState.REJECTED
        assert transition.required_role == "supervisor"

    def test_confirmed_to_corrected_transition(self):
        """Test transition from confirmed to corrected."""
        key = (DataEntryState.CONFIRMED, "data.corrected")
        assert key in STATE_TRANSITIONS
        transition = STATE_TRANSITIONS[key]
        assert transition.to_state == DataEntryState.CORRECTED
        assert transition.required_role == "supervisor"

    def test_invalid_transition(self):
        """Test that invalid transitions are not defined."""
        # Cannot go from confirmed to submitted directly
        key = (DataEntryState.CONFIRMED, "data.submitted")
        assert key not in STATE_TRANSITIONS


class TestWorkflowHandler:
    """Tests for WorkflowHandler service."""

    @pytest.fixture
    def mock_session(self):
        """Create a mock database session."""
        session = AsyncMock(spec=AsyncSession)
        return session

    @pytest.fixture
    def workflow_handler(self, mock_session):
        """Create a WorkflowHandler instance."""
        return WorkflowHandler(mock_session)

    @pytest.mark.asyncio
    async def test_create_data_entry(self, workflow_handler):
        """Test creating a new data entry."""
        actor_id = uuid4()
        request = DataEntryCreateRequest(
            data={"field1": "value1"},
            entry_type="test_entry",
            actor_id=actor_id,
            actor_role="operator",
            actor_username="operator1",
        )

        # Mock the event writer write method
        workflow_handler.event_writer.write = AsyncMock()
        workflow_handler.event_writer.write.return_value = MagicMock(
            entity_id=uuid4(),
            event_id=uuid4(),
            event_type="data.created",
            timestamp=datetime.now(UTC),
            success=True,
        )

        result = await workflow_handler.create_data_entry(request)

        assert result.success is True
        assert result.event_type == "data.created"
        workflow_handler.event_writer.write.assert_called_once()

    @pytest.mark.asyncio
    async def test_confirm_entry_success(self, workflow_handler):
        """Test confirming a submitted entry."""
        entry_id = uuid4()
        request = DataEntryConfirmRequest(
            entry_id=entry_id,
            confirmation_note="Looks good",
            actor_id=uuid4(),
            actor_role="supervisor",
            actor_username="supervisor1",
        )

        # Mock the current state as submitted
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.SUBMITTED)
        workflow_handler.event_writer.write = AsyncMock()
        workflow_handler.event_writer.write.return_value = MagicMock(
            entity_id=entry_id,
            event_id=uuid4(),
            event_type="data.confirmed",
            timestamp=datetime.now(UTC),
            success=True,
        )

        result = await workflow_handler.confirm_entry(request)

        assert result.success is True
        assert result.event_type == "data.confirmed"

    @pytest.mark.asyncio
    async def test_confirm_entry_invalid_state(self, workflow_handler):
        """Test confirming an entry that's not in submitted state."""
        entry_id = uuid4()
        request = DataEntryConfirmRequest(
            entry_id=entry_id,
            confirmation_note="Looks good",
            actor_id=uuid4(),
            actor_role="supervisor",
            actor_username="supervisor1",
        )

        # Mock the current state as draft (invalid for confirmation)
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.DRAFT)

        with pytest.raises(WorkflowEventWriteError, match="Cannot confirm entry"):
            await workflow_handler.confirm_entry(request)

    @pytest.mark.asyncio
    async def test_confirm_entry_wrong_role(self, workflow_handler):
        """Test confirming an entry with wrong role."""
        entry_id = uuid4()
        request = DataEntryConfirmRequest(
            entry_id=entry_id,
            confirmation_note="Looks good",
            actor_id=uuid4(),
            actor_role="operator",  # Wrong role
            actor_username="operator1",
        )

        # Mock the current state as submitted
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.SUBMITTED)

        with pytest.raises(WorkflowEventWriteError, match="not allowed to confirm"):
            await workflow_handler.confirm_entry(request)

    @pytest.mark.asyncio
    async def test_reject_entry_success(self, workflow_handler):
        """Test rejecting a submitted entry."""
        entry_id = uuid4()
        request = DataEntryRejectRequest(
            entry_id=entry_id,
            rejection_reason="Data validation failed",
            actor_id=uuid4(),
            actor_role="supervisor",
            actor_username="supervisor1",
        )

        # Mock the current state as submitted
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.SUBMITTED)
        workflow_handler.event_writer.write = AsyncMock()
        workflow_handler.event_writer.write.return_value = MagicMock(
            entity_id=entry_id,
            event_id=uuid4(),
            event_type="data.rejected",
            timestamp=datetime.now(UTC),
            success=True,
        )

        result = await workflow_handler.reject_entry(request)

        assert result.success is True
        assert result.event_type == "data.rejected"

    @pytest.mark.asyncio
    async def test_reject_entry_invalid_state(self, workflow_handler):
        """Test rejecting an entry that's not in submitted state."""
        entry_id = uuid4()
        request = DataEntryRejectRequest(
            entry_id=entry_id,
            rejection_reason="Data validation failed",
            actor_id=uuid4(),
            actor_role="supervisor",
            actor_username="supervisor1",
        )

        # Mock the current state as confirmed (invalid for rejection)
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.CONFIRMED)

        with pytest.raises(WorkflowEventWriteError, match="Cannot reject entry"):
            await workflow_handler.reject_entry(request)

    @pytest.mark.asyncio
    async def test_correct_entry_success(self, workflow_handler):
        """Test correcting a confirmed entry."""
        entry_id = uuid4()
        request = DataEntryCorrectRequest(
            entry_id=entry_id,
            corrected_data={"field1": "corrected_value"},
            fields_corrected=["field1"],
            correction_note="Fixed typo",
            actor_id=uuid4(),
            actor_role="supervisor",
            actor_username="supervisor1",
        )

        # Mock the current state as confirmed
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.CONFIRMED)
        workflow_handler._get_current_payload = AsyncMock(return_value={"field1": "old_value"})
        workflow_handler.event_writer.write = AsyncMock()
        workflow_handler.event_writer.write.return_value = MagicMock(
            entity_id=entry_id,
            event_id=uuid4(),
            event_type="data.corrected",
            timestamp=datetime.now(UTC),
            success=True,
        )

        result = await workflow_handler.correct_entry(request)

        assert result.success is True
        assert result.event_type == "data.corrected"

    @pytest.mark.asyncio
    async def test_correct_entry_invalid_state(self, workflow_handler):
        """Test correcting an entry in invalid state."""
        entry_id = uuid4()
        request = DataEntryCorrectRequest(
            entry_id=entry_id,
            corrected_data={"field1": "corrected_value"},
            fields_corrected=["field1"],
            correction_note="Fixed typo",
            actor_id=uuid4(),
            actor_role="supervisor",
            actor_username="supervisor1",
        )

        # Mock the current state as draft (invalid for correction)
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.DRAFT)
        workflow_handler._get_current_payload = AsyncMock(return_value={})

        with pytest.raises(WorkflowEventWriteError, match="Cannot correct entry"):
            await workflow_handler.correct_entry(request)

    @pytest.mark.asyncio
    async def test_correct_entry_preserves_history(self, workflow_handler):
        """Test that correction preserves previous data."""
        entry_id = uuid4()
        previous_data = {"field1": "old_value", "field2": "value2"}
        corrected_data = {"field1": "new_value"}

        request = DataEntryCorrectRequest(
            entry_id=entry_id,
            corrected_data=corrected_data,
            fields_corrected=["field1"],
            correction_note="Fixed field1",
            actor_id=uuid4(),
            actor_role="supervisor",
            actor_username="supervisor1",
        )

        # Mock the current state and payload
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.CONFIRMED)
        workflow_handler._get_current_payload = AsyncMock(return_value=previous_data)

        # Capture the event write request
        captured_request = None

        async def capture_write(req):
            nonlocal captured_request
            captured_request = req
            return MagicMock(
                entity_id=entry_id,
                event_id=uuid4(),
                event_type="data.corrected",
                timestamp=datetime.now(UTC),
                success=True,
            )

        workflow_handler.event_writer.write = capture_write

        await workflow_handler.correct_entry(request)

        # Verify the previous data is preserved in the payload
        assert "previous_data" in captured_request.payload
        assert captured_request.payload["previous_data"] == previous_data

    @pytest.mark.asyncio
    async def test_get_current_state_entry_not_found(self, workflow_handler):
        """Test getting state for non-existent entry."""
        workflow_handler.event_writer.get_entity_current_state = AsyncMock(
            return_value={"event_count": 0}
        )

        with pytest.raises(WorkflowEventWriteError, match="Data entry not found"):
            await workflow_handler._get_current_state(uuid4())

    @pytest.mark.asyncio
    async def test_get_current_payload_entry_not_found(self, workflow_handler):
        """Test getting payload for non-existent entry."""
        workflow_handler.event_writer.get_entity_current_state = AsyncMock(
            return_value={"event_count": 0}
        )

        with pytest.raises(WorkflowEventWriteError, match="Data entry not found"):
            await workflow_handler._get_current_payload(uuid4())


class TestEventWriterHelper:
    """Tests for event writer helper functions."""

    @pytest.mark.asyncio
    async def test_get_event_writer(self):
        """Test getting event writer instance."""
        mock_session = AsyncMock(spec=AsyncSession)
        writer = await get_event_writer(mock_session)
        assert isinstance(writer, EventWriter)


class TestWorkflowScenarios:
    """Integration tests for complete workflow scenarios."""

    @pytest.fixture
    def mock_session(self):
        """Create a mock database session."""
        session = AsyncMock(spec=AsyncSession)
        return session

    @pytest.fixture
    def workflow_handler(self, mock_session):
        """Create a WorkflowHandler instance."""
        handler = WorkflowHandler(mock_session)
        # Mock the event writer with proper return values
        mock_result = MagicMock()
        mock_result.entity_id = uuid4()
        mock_result.event_id = uuid4()
        mock_result.event_type = "data.created"  # Default, can be overridden
        mock_result.timestamp = datetime.now(UTC)
        mock_result.success = True

        handler.event_writer.write = AsyncMock(return_value=mock_result)
        return handler

    @pytest.mark.asyncio
    async def test_full_entry_lifecycle(self, workflow_handler):
        """Test complete data entry lifecycle."""
        entry_id = uuid4()
        operator_id = uuid4()
        supervisor_id = uuid4()

        # Create a proper mock result
        def create_mock_result(event_type):
            result = MagicMock()
            result.entity_id = uuid4()
            result.event_id = uuid4()
            result.event_type = event_type
            result.timestamp = datetime.now(UTC)
            result.success = True
            return result

        # 1. Create entry (draft)
        workflow_handler.event_writer.write = AsyncMock(return_value=create_mock_result("data.created"))
        create_request = DataEntryCreateRequest(
            data={"name": "Test Entry"},
            entry_type="test",
            actor_id=operator_id,
            actor_role="operator",
            actor_username="operator1",
        )
        create_result = await workflow_handler.create_data_entry(create_request)
        assert create_result.success is True
        assert create_result.event_type == "data.created"

        # 2. Submit entry - Mock state progression
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.SUBMITTED)

        # 3. Confirm entry
        workflow_handler.event_writer.write = AsyncMock(return_value=create_mock_result("data.confirmed"))
        confirm_request = DataEntryConfirmRequest(
            entry_id=entry_id,
            confirmation_note="Approved",
            actor_id=supervisor_id,
            actor_role="supervisor",
            actor_username="supervisor1",
        )
        confirm_result = await workflow_handler.confirm_entry(confirm_request)
        assert confirm_result.success is True
        assert confirm_result.event_type == "data.confirmed"

    @pytest.mark.asyncio
    async def test_correction_workflow(self, workflow_handler):
        """Test correction workflow preserves history."""
        entry_id = uuid4()
        supervisor_id = uuid4()

        # Entry is confirmed
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.CONFIRMED)
        workflow_handler._get_current_payload = AsyncMock(
            return_value={"field1": "original", "field2": "value"}
        )

        # Correct the entry
        correct_request = DataEntryCorrectRequest(
            entry_id=entry_id,
            corrected_data={"field1": "corrected", "field2": "value"},
            fields_corrected=["field1"],
            correction_note="Fixed field1",
            actor_id=supervisor_id,
            actor_role="supervisor",
            actor_username="supervisor1",
        )

        captured_request = None

        async def capture_write(req):
            nonlocal captured_request
            captured_request = req
            return MagicMock(
                entity_id=entry_id,
                event_id=uuid4(),
                timestamp=datetime.now(UTC),
                success=True,
            )

        workflow_handler.event_writer.write = capture_write
        result = await workflow_handler.correct_entry(correct_request)

        assert result.success is True
        assert captured_request.payload["previous_data"]["field1"] == "original"
        assert captured_request.payload["corrected_data"]["field1"] == "corrected"

    @pytest.mark.asyncio
    async def test_rejection_workflow(self, workflow_handler):
        """Test rejection workflow."""
        entry_id = uuid4()
        supervisor_id = uuid4()

        # Entry is submitted
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.SUBMITTED)

        # Set up the mock to return the correct event type
        def create_mock_result(event_type):
            result = MagicMock()
            result.entity_id = uuid4()
            result.event_id = uuid4()
            result.event_type = event_type
            result.timestamp = datetime.now(UTC)
            result.success = True
            return result

        workflow_handler.event_writer.write = AsyncMock(return_value=create_mock_result("data.rejected"))

        # Reject the entry
        reject_request = DataEntryRejectRequest(
            entry_id=entry_id,
            rejection_reason="Invalid data format",
            actor_id=supervisor_id,
            actor_role="supervisor",
            actor_username="supervisor1",
        )

        result = await workflow_handler.reject_entry(reject_request)

        assert result is not None
        assert result.event_type == "data.rejected"

    @pytest.mark.asyncio
    async def test_state_transition_validation(self, workflow_handler):
        """Test that invalid state transitions are blocked."""
        entry_id = uuid4()
        operator_id = uuid4()

        # Entry is in draft state
        workflow_handler._get_current_state = AsyncMock(return_value=DataEntryState.DRAFT)

        # Cannot confirm draft entry
        confirm_request = DataEntryConfirmRequest(
            entry_id=entry_id,
            confirmation_note="Try to confirm",
            actor_id=operator_id,
            actor_role="operator",
            actor_username="operator1",
        )

        with pytest.raises(WorkflowEventWriteError):
            await workflow_handler.confirm_entry(confirm_request)
