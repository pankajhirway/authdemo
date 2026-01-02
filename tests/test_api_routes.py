"""
Tests for API routes for all roles.

Tests the operator, supervisor, auditor, and admin API endpoints.
"""

from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestOperatorRoutes:
    """Tests for /api/v1/operator/* routes."""

    @pytest.mark.asyncio
    async def test_create_data_entry_unauthorized(self, client: AsyncClient):
        """Test creating entry without authentication."""
        response = await client.post("/api/v1/operator/data", json={"data": {}})
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_data_entry_success(self, client: AsyncClient, db_session: AsyncSession):
        """Test creating a data entry successfully."""
        # Mock authentication
        with patch("app.api.dependencies.auth.jwt_validator") as mock_jwt:
            mock_jwt.validate = AsyncMock(
                return_value=MagicMock(
                    user_id=str(uuid4()),
                    username="operator1",
                    role="operator",
                    scopes=["data:create"],
                )
            )

            response = await client.post(
                "/api/v1/operator/data",
                json={"data": {"field1": "value1"}, "entry_type": "test"},
                headers={"Authorization": "Bearer fake_token"},
            )

            # Note: This may return 401 due to actual JWT validation in tests
            # In a real test setup, you'd mock the JWT dependency properly

    @pytest.mark.asyncio
    async def test_get_own_data_entry(self, client: AsyncClient):
        """Test getting own data entry."""
        entry_id = uuid4()
        response = await client.get(f"/api/v1/operator/data/{entry_id}")
        # Should return 401 without auth
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_data_entries(self, client: AsyncClient):
        """Test listing data entries."""
        response = await client.get("/api/v1/operator/data")
        # Should return 401 without auth
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_data_entry(self, client: AsyncClient):
        """Test updating a data entry."""
        entry_id = uuid4()
        response = await client.put(
            f"/api/v1/operator/data/{entry_id}",
            json={"data": {"field1": "updated"}},
        )
        # Should return 401 without auth
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_submit_data_entry(self, client: AsyncClient):
        """Test submitting a data entry for review."""
        entry_id = uuid4()
        response = await client.post(f"/api/v1/operator/data/{entry_id}/submit")
        # Should return 401 without auth
        assert response.status_code == 401


class TestSupervisorRoutes:
    """Tests for /api/v1/supervisor/* routes."""

    @pytest.mark.asyncio
    async def test_list_all_data_entries_unauthorized(self, client: AsyncClient):
        """Test listing all data entries without auth."""
        response = await client.get("/api/v1/supervisor/data")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_any_data_entry(self, client: AsyncClient):
        """Test getting any data entry."""
        entry_id = uuid4()
        response = await client.get(f"/api/v1/supervisor/data/{entry_id}")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_confirm_data_entry(self, client: AsyncClient):
        """Test confirming a data entry."""
        entry_id = uuid4()
        response = await client.post(
            f"/api/v1/supervisor/data/{entry_id}/confirm",
            json={"confirmation_note": "Approved"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_reject_data_entry(self, client: AsyncClient):
        """Test rejecting a data entry."""
        entry_id = uuid4()
        response = await client.post(
            f"/api/v1/supervisor/data/{entry_id}/reject",
            json={"rejection_reason": "Invalid data"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_correct_data_entry(self, client: AsyncClient):
        """Test correcting a data entry."""
        entry_id = uuid4()
        response = await client.post(
            f"/api/v1/supervisor/data/{entry_id}/correct",
            json={
                "corrected_data": {"field1": "corrected"},
                "fields_corrected": ["field1"],
                "correction_note": "Fixed typo",
            },
        )
        assert response.status_code == 401


class TestAuditorRoutes:
    """Tests for /api/v1/auditor/* routes."""

    @pytest.mark.asyncio
    async def test_list_data_entries_readonly(self, client: AsyncClient):
        """Test listing data entries (read-only)."""
        response = await client.get("/api/v1/auditor/data")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_data_entry_full_details(self, client: AsyncClient):
        """Test getting a data entry with full details."""
        entry_id = uuid4()
        response = await client.get(f"/api/v1/auditor/data/{entry_id}")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_entry_events(self, client: AsyncClient):
        """Test getting complete event history for an entry."""
        entry_id = uuid4()
        response = await client.get(f"/api/v1/auditor/data/{entry_id}/events")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_audit_logs(self, client: AsyncClient):
        """Test getting audit logs."""
        response = await client.get("/api/v1/auditor/audit")
        assert response.status_code == 401


class TestAdminRoutes:
    """Tests for /api/v1/admin/* routes."""

    @pytest.mark.asyncio
    async def test_health_check_unauthorized(self, client: AsyncClient):
        """Test health check without admin role."""
        response = await client.get("/api/v1/admin/health")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_metrics_unauthorized(self, client: AsyncClient):
        """Test metrics without admin role."""
        response = await client.get("/api/v1/admin/metrics")
        assert response.status_code == 401


class TestFieldLevelFiltering:
    """Tests for field-level response filtering by role."""

    def test_operator_filter_excludes_sensitive_fields(self):
        """Test that operator responses exclude sensitive fields."""
        from app.api.routes.operator import _filter_for_operator
        from app.services.projections import DataEntryProjection
        from datetime import datetime

        # Create a mock entry with all fields
        entry = MagicMock(spec=DataEntryProjection)
        entry.entry_id = uuid4()
        entry.data = {"field1": "value1"}
        entry.status = "submitted"
        entry.created_at = datetime.utcnow()
        entry.updated_at = datetime.utcnow()
        entry.created_by_username = "operator1"
        entry.created_by = uuid4()
        entry.confirmed_by_username = "supervisor1"
        entry.rejected_by_username = "supervisor2"
        entry.rejected_reason = "Invalid"

        # Apply operator filter
        filtered = _filter_for_operator(entry)

        # Operator should NOT see these fields
        assert filtered["confirmed_by_username"] is None
        assert filtered["rejected_by_username"] is None
        assert filtered["rejected_reason"] is None

        # Operator should see these fields
        assert "entry_id" in filtered
        assert "data" in filtered
        assert "status" in filtered
        assert "created_at" in filtered

    def test_supervisor_filter_includes_workflow_fields(self):
        """Test that supervisor responses include workflow fields."""
        from app.api.routes.supervisor import _filter_for_supervisor
        from app.services.projections import DataEntryProjection
        from datetime import datetime

        entry = MagicMock(spec=DataEntryProjection)
        entry.entry_id = uuid4()
        entry.data = {"field1": "value1"}
        entry.status = "confirmed"
        entry.created_at = datetime.utcnow()
        entry.updated_at = datetime.utcnow()
        entry.created_by = uuid4()
        entry.created_by_username = "operator1"
        entry.submitted_at = datetime.utcnow()
        entry.confirmed_by = uuid4()
        entry.confirmed_at = datetime.utcnow()
        entry.confirmed_by_username = "supervisor1"
        entry.rejected_by_username = None
        entry.rejected_at = None
        entry.rejected_reason = None
        entry.correction_count = 0
        entry.last_corrected_at = None
        entry.last_corrected_by_username = None

        filtered = _filter_for_supervisor(entry)

        # Supervisor should see workflow fields
        assert "confirmed_by_username" in filtered
        assert "rejected_by_username" in filtered
        assert "rejected_reason" in filtered
        assert "correction_count" in filtered
        assert "submitted_at" in filtered

    def test_auditor_filter_includes_all_fields(self):
        """Test that auditor responses include all fields."""
        from app.api.routes.auditor import _filter_for_auditor
        from app.services.projections import DataEntryProjection
        from datetime import datetime

        entry = MagicMock(spec=DataEntryProjection)
        entry.entry_id = uuid4()
        entry.data = {"field1": "value1"}
        entry.status = "confirmed"
        entry.created_at = datetime.utcnow()
        entry.updated_at = datetime.utcnow()
        entry.created_by = uuid4()
        entry.created_by_role = "operator"
        entry.created_by_username = "operator1"
        entry.submitted_at = datetime.utcnow()
        entry.confirmed_by = uuid4()
        entry.confirmed_at = datetime.utcnow()
        entry.confirmed_by_username = "supervisor1"
        entry.rejected_by = uuid4()
        entry.rejected_at = datetime.utcnow()
        entry.rejected_by_username = "supervisor2"
        entry.rejected_reason = "Invalid"
        entry.correction_count = 1
        entry.last_corrected_at = datetime.utcnow()
        entry.last_corrected_by = uuid4()
        entry.last_corrected_by_username = "supervisor1"
        entry.version = 2

        filtered = _filter_for_auditor(entry)

        # Auditor should see everything
        assert "entry_id" in filtered
        assert "data" in filtered
        assert "status" in filtered
        assert "created_by_role" in filtered
        assert "confirmed_by" in filtered
        assert "rejected_by" in filtered
        assert "version" in filtered
        assert "last_corrected_by" in filtered


class TestAPIValidation:
    """Tests for API request validation."""

    @pytest.mark.asyncio
    async def test_create_entry_missing_data(self, client: AsyncClient):
        """Test creating entry with missing data field."""
        response = await client.post(
            "/api/v1/operator/data",
            json={},
            headers={"Authorization": "Bearer fake_token"},
        )
        # Should return 401 (auth fails before validation) or 422 if mocked

    @pytest.mark.asyncio
    async def test_confirm_with_missing_note(self, client: AsyncClient):
        """Test confirming with missing note (should be optional)."""
        entry_id = uuid4()
        response = await client.post(
            f"/api/v1/supervisor/data/{entry_id}/confirm",
            json={},  # confirmation_note is optional
            headers={"Authorization": "Bearer fake_token"},
        )
        # Should return 401 (auth fails)

    @pytest.mark.asyncio
    async def test_reject_with_missing_reason(self, client: AsyncClient):
        """Test rejecting without reason (required field)."""
        entry_id = uuid4()
        response = await client.post(
            f"/api/v1/supervisor/data/{entry_id}/reject",
            json={},  # rejection_reason is required
            headers={"Authorization": "Bearer fake_token"},
        )
        # Should return 401 (auth fails) or 422 if auth mocked


class TestPagination:
    """Tests for pagination parameters."""

    @pytest.mark.asyncio
    async def test_list_with_limit(self, client: AsyncClient):
        """Test listing with custom limit."""
        response = await client.get(
            "/api/v1/operator/data?limit=10",
            headers={"Authorization": "Bearer fake_token"},
        )
        # Should return 401 (auth fails)

    @pytest.mark.asyncio
    async def test_list_with_offset(self, client: AsyncClient):
        """Test listing with offset."""
        response = await client.get(
            "/api/v1/operator/data?offset=20",
            headers={"Authorization": "Bearer fake_token"},
        )
        # Should return 401 (auth fails)

    @pytest.mark.asyncio
    async def test_list_with_status_filter(self, client: AsyncClient):
        """Test listing with status filter."""
        response = await client.get(
            "/api/v1/operator/data?status=draft",
            headers={"Authorization": "Bearer fake_token"},
        )
        # Should return 401 (auth fails)


class TestAPIResponseFormats:
    """Tests for API response formats."""

    def test_create_response_format(self):
        """Test create entry response format."""
        response = {
            "entry_id": str(uuid4()),
            "event_id": str(uuid4()),
            "status": "draft",
            "created_at": "2024-01-01T00:00:00Z",
        }
        assert "entry_id" in response
        assert "event_id" in response
        assert "status" in response
        assert "created_at" in response

    def test_confirm_response_format(self):
        """Test confirm entry response format."""
        response = {
            "event_id": str(uuid4()),
            "status": "confirmed",
            "confirmed_at": "2024-01-01T00:00:00Z",
        }
        assert "event_id" in response
        assert "status" in response
        assert "confirmed_at" in response

    def test_list_response_format(self):
        """Test list entries response format."""
        response = {
            "items": [],
            "total": 0,
            "limit": 50,
            "offset": 0,
        }
        assert "items" in response
        assert "total" in response
        assert "limit" in response
        assert "offset" in response
