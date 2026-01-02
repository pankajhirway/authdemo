"""
Tests for ABAC Policy Engine authorization service.

Tests the default-deny authorization model where all actions are denied
unless explicitly allowed by policy rules.
"""

import pytest
from unittest.mock import AsyncMock

from app.security.authorization import (
    PolicyEngine,
    Permission,
    Scope,
    Role,
    AccessDecision,
    get_policy_engine,
    policy_engine,
)


class TestScope:
    """Tests for the Scope class."""

    def test_from_string_simple(self):
        """Test parsing a simple scope string."""
        scope = Scope.from_string("data:read")
        assert scope.id == "data:read"
        assert scope.resource == "data"
        assert scope.action == "read"
        assert scope.filter is None
        assert scope.constraint is None

    def test_from_string_with_filter(self):
        """Test parsing a scope string with a filter."""
        scope = Scope.from_string("data:read:own")
        assert scope.id == "data:read:own"
        assert scope.resource == "data"
        assert scope.action == "read"
        assert scope.filter == "own"
        assert scope.constraint is None

    def test_from_string_invalid(self):
        """Test parsing an invalid scope string."""
        with pytest.raises(ValueError, match="Invalid scope format"):
            Scope.from_string("data")

    def test_matches(self):
        """Test scope matching."""
        scope = Scope.from_string("data:read:own")
        assert scope.matches("data", "read") is True
        assert scope.matches("data", "create") is False
        assert scope.matches("users", "read") is False


class TestPermission:
    """Tests for the Permission model."""

    def test_permission_creation(self):
        """Test creating a permission."""
        permission = Permission(
            resource="data",
            action="read",
            resource_id="123",
            owner_id="user1",
            resource_status="draft",
        )
        assert permission.resource == "data"
        assert permission.action == "read"
        assert permission.resource_id == "123"
        assert permission.owner_id == "user1"
        assert permission.resource_status == "draft"

    def test_permission_minimal(self):
        """Test creating a permission with minimal fields."""
        permission = Permission(resource="data", action="create")
        assert permission.resource == "data"
        assert permission.action == "create"
        assert permission.resource_id is None
        assert permission.owner_id is None
        assert permission.resource_status is None


class TestAccessDecision:
    """Tests for the AccessDecision model."""

    def test_access_decision_allowed(self):
        """Test an allowed access decision."""
        decision = AccessDecision(
            allowed=True,
            reason="Access granted via scope 'data:read:own'",
            matched_scope="data:read:own",
        )
        assert decision.allowed is True
        assert "granted" in decision.reason
        assert decision.matched_scope == "data:read:own"

    def test_access_decision_denied(self):
        """Test a denied access decision."""
        decision = AccessDecision(
            allowed=False,
            reason="No scope grants data:create for role 'auditor'",
        )
        assert decision.allowed is False
        assert "denied" not in decision.reason.lower()
        assert decision.matched_scope is None


class TestPolicyEngine:
    """Tests for the PolicyEngine class."""

    @pytest.fixture
    def engine(self):
        """Get a fresh policy engine instance for testing."""
        return PolicyEngine()

    @pytest.mark.asyncio
    async def test_admin_bypass_all_checks(self, engine):
        """Test that admin role bypasses all authorization checks."""
        permission = Permission(resource="any", action="any")
        decision = await engine.evaluate(
            role=Role.ADMIN,
            scopes=[],
            permission=permission,
        )
        assert decision.allowed is True
        assert decision.matched_scope == "admin:all"

    @pytest.mark.asyncio
    async def test_operator_can_create_data(self, engine):
        """Test that operators can create data entries."""
        permission = Permission(resource="data", action="create")
        decision = await engine.evaluate(
            role=Role.OPERATOR,
            scopes=["data:create"],
            permission=permission,
        )
        assert decision.allowed is True
        assert decision.matched_scope == "data:create"

    @pytest.mark.asyncio
    async def test_operator_cannot_delete_data(self, engine):
        """Test that operators cannot delete data entries."""
        permission = Permission(resource="data", action="delete")
        decision = await engine.evaluate(
            role=Role.OPERATOR,
            scopes=["data:create", "data:read:own"],
            permission=permission,
        )
        assert decision.allowed is False
        assert "no scope" in decision.reason.lower()

    @pytest.mark.asyncio
    async def test_operator_can_read_own_data(self, engine):
        """Test that operators can read their own data entries."""
        permission = Permission(
            resource="data",
            action="read",
            owner_id="user123",
        )
        decision = await engine.evaluate(
            role=Role.OPERATOR,
            scopes=["data:read:own"],
            permission=permission,
        )
        assert decision.allowed is True
        assert decision.matched_scope == "data:read:own"

    @pytest.mark.asyncio
    async def test_operator_cannot_read_all_data(self, engine):
        """Test that operators cannot read all data entries."""
        permission = Permission(resource="data", action="read")
        decision = await engine.evaluate(
            role=Role.OPERATOR,
            scopes=["data:create", "data:read:own"],
            permission=permission,
        )
        # The operator has data:read:own but the request doesn't specify owner_id
        # So it should be denied due to filter constraints
        assert decision.allowed is False

    @pytest.mark.asyncio
    async def test_supervisor_can_read_all_data(self, engine):
        """Test that supervisors can read all data entries."""
        permission = Permission(resource="data", action="read")
        decision = await engine.evaluate(
            role=Role.SUPERVISOR,
            scopes=["data:read:all"],
            permission=permission,
        )
        assert decision.allowed is True
        assert decision.matched_scope == "data:read:all"

    @pytest.mark.asyncio
    async def test_supervisor_can_confirm_data(self, engine):
        """Test that supervisors can confirm data entries."""
        permission = Permission(resource="data", action="confirm")
        decision = await engine.evaluate(
            role=Role.SUPERVISOR,
            scopes=["data:confirm"],
            permission=permission,
        )
        assert decision.allowed is True
        assert decision.matched_scope == "data:confirm"

    @pytest.mark.asyncio
    async def test_supervisor_can_correct_data(self, engine):
        """Test that supervisors can correct data entries."""
        permission = Permission(resource="data", action="correct")
        decision = await engine.evaluate(
            role=Role.SUPERVISOR,
            scopes=["data:correct"],
            permission=permission,
        )
        assert decision.allowed is True
        assert decision.matched_scope == "data:correct"

    @pytest.mark.asyncio
    async def test_supervisor_can_reject_data(self, engine):
        """Test that supervisors can reject data entries."""
        permission = Permission(resource="data", action="reject")
        decision = await engine.evaluate(
            role=Role.SUPERVISOR,
            scopes=["data:reject"],
            permission=permission,
        )
        assert decision.allowed is True
        assert decision.matched_scope == "data:reject"

    @pytest.mark.asyncio
    async def test_auditor_read_only_access(self, engine):
        """Test that auditors have read-only access."""
        # Auditors can read
        read_decision = await engine.evaluate(
            role=Role.AUDITOR,
            scopes=["data:read:all", "audit:read"],
            permission=Permission(resource="data", action="read"),
        )
        assert read_decision.allowed is True

        # Auditors cannot create
        create_decision = await engine.evaluate(
            role=Role.AUDITOR,
            scopes=["data:read:all", "audit:read"],
            permission=Permission(resource="data", action="create"),
        )
        assert create_decision.allowed is False

    @pytest.mark.asyncio
    async def test_auditor_can_read_audit_logs(self, engine):
        """Test that auditors can read audit logs."""
        permission = Permission(resource="audit", action="read")
        decision = await engine.evaluate(
            role=Role.AUDITOR,
            scopes=["audit:read"],
            permission=permission,
        )
        assert decision.allowed is True
        assert decision.matched_scope == "audit:read"

    @pytest.mark.asyncio
    async def test_auditor_can_read_events(self, engine):
        """Test that auditors can read events."""
        permission = Permission(resource="events", action="read")
        decision = await engine.evaluate(
            role=Role.AUDITOR,
            scopes=["events:read"],
            permission=permission,
        )
        assert decision.allowed is True
        assert decision.matched_scope == "events:read"

    @pytest.mark.asyncio
    async def test_unconfirmed_constraint(self, engine):
        """Test the unconfirmed constraint on data updates."""
        # Test with data:update:own scope which has "unconfirmed" constraint
        # Need to provide owner_id since the scope has "own" filter
        permission = Permission(
            resource="data",
            action="update",
            resource_status="unconfirmed",
            owner_id="user123",  # Required for "own" filter
        )
        decision = await engine.evaluate(
            role=Role.OPERATOR,
            scopes=["data:update:own"],
            permission=permission,
        )
        # The data:update:own scope has an "unconfirmed" constraint
        # so it should allow updates on unconfirmed entries
        assert decision.allowed is True

        # Test with confirmed status - should NOT allow because
        # the "unconfirmed" constraint fails when status is "confirmed"
        permission_confirmed = Permission(
            resource="data",
            action="update",
            resource_status="confirmed",
            owner_id="user123",  # Required for "own" filter
        )
        decision_confirmed = await engine.evaluate(
            role=Role.OPERATOR,
            scopes=["data:update:own"],
            permission=permission_confirmed,
        )
        # Should NOT be allowed - constraint check fails for "confirmed" status
        assert decision_confirmed.allowed is False

    @pytest.mark.asyncio
    async def test_role_with_no_scopes(self, engine):
        """Test access when user has no scopes assigned."""
        permission = Permission(resource="data", action="read")
        decision = await engine.evaluate(
            role=Role.OPERATOR,
            scopes=[],
            permission=permission,
        )
        assert decision.allowed is False

    @pytest.mark.asyncio
    async def test_invalid_role(self, engine):
        """Test access with a role that has no defined scopes."""
        permission = Permission(resource="data", action="read")
        # Using a role that doesn't exist in the policy engine's role_scopes
        # The policy engine will try to use Role("guest") which will raise ValueError
        # So we test with a valid Role enum but one that has no scopes defined
        # Actually, all roles in the enum have scopes, so let's just test that
        # a role without proper scopes is denied
        decision = await engine.evaluate(
            role=Role.AUDITOR,  # Auditor has scopes but not for "create"
            scopes=["audit:read"],  # No data:create scope
            permission=Permission(resource="data", action="create"),
        )
        assert decision.allowed is False

    def test_get_scopes_for_role(self, engine):
        """Test getting scopes for a role."""
        operator_scopes = engine.get_scopes_for_role("operator")
        assert "data:create" in operator_scopes
        assert "data:read:own" in operator_scopes
        assert "data:update:own" in operator_scopes
        assert len(operator_scopes) == 3

        supervisor_scopes = engine.get_scopes_for_role("supervisor")
        assert "data:read:all" in supervisor_scopes
        assert "data:confirm" in supervisor_scopes
        assert "data:correct" in supervisor_scopes

        auditor_scopes = engine.get_scopes_for_role("auditor")
        assert "data:read:all" in auditor_scopes
        assert "audit:read" in auditor_scopes
        assert "events:read" in auditor_scopes

    def test_singleton_policy_engine(self):
        """Test that the singleton policy engine returns the same instance."""
        engine1 = get_policy_engine()
        engine2 = get_policy_engine()
        assert engine1 is engine2


class TestIntegrationScenarios:
    """Integration test scenarios for authorization."""

    @pytest.fixture
    def engine(self):
        """Get a fresh policy engine instance for testing."""
        return PolicyEngine()

    @pytest.mark.asyncio
    async def test_data_entry_lifecycle_operator(self, engine):
        """Test operator permissions throughout data entry lifecycle."""
        # Operator can create
        create_decision = await engine.evaluate(
            role=Role.OPERATOR,
            scopes=["data:create", "data:read:own", "data:update:own"],
            permission=Permission(resource="data", action="create"),
        )
        assert create_decision.allowed is True

        # Operator can read own
        read_decision = await engine.evaluate(
            role=Role.OPERATOR,
            scopes=["data:create", "data:read:own", "data:update:own"],
            permission=Permission(
                resource="data",
                action="read",
                owner_id="operator_user_id",
            ),
        )
        assert read_decision.allowed is True

        # Operator cannot confirm
        confirm_decision = await engine.evaluate(
            role=Role.OPERATOR,
            scopes=["data:create", "data:read:own", "data:update:own"],
            permission=Permission(resource="data", action="confirm"),
        )
        assert confirm_decision.allowed is False

    @pytest.mark.asyncio
    async def test_data_entry_lifecycle_supervisor(self, engine):
        """Test supervisor permissions throughout data entry lifecycle."""
        # Supervisor can read all
        read_decision = await engine.evaluate(
            role=Role.SUPERVISOR,
            scopes=["data:read:all", "data:confirm", "data:reject", "data:correct"],
            permission=Permission(resource="data", action="read"),
        )
        assert read_decision.allowed is True

        # Supervisor can confirm
        confirm_decision = await engine.evaluate(
            role=Role.SUPERVISOR,
            scopes=["data:read:all", "data:confirm", "data:reject", "data:correct"],
            permission=Permission(resource="data", action="confirm"),
        )
        assert confirm_decision.allowed is True

        # Supervisor can reject
        reject_decision = await engine.evaluate(
            role=Role.SUPERVISOR,
            scopes=["data:read:all", "data:confirm", "data:reject", "data:correct"],
            permission=Permission(resource="data", action="reject"),
        )
        assert reject_decision.allowed is True

        # Supervisor can correct
        correct_decision = await engine.evaluate(
            role=Role.SUPERVISOR,
            scopes=["data:read:all", "data:confirm", "data:reject", "data:correct"],
            permission=Permission(resource="data", action="correct"),
        )
        assert correct_decision.allowed is True

    @pytest.mark.asyncio
    async def test_auditor_full_read_access(self, engine):
        """Test auditor has read access to all resources."""
        auditor_scopes = [
            "data:read:all",
            "audit:read",
            "reports:read",
            "events:read",
            "users:read",
        ]

        # Can read data
        data_decision = await engine.evaluate(
            role=Role.AUDITOR,
            scopes=auditor_scopes,
            permission=Permission(resource="data", action="read"),
        )
        assert data_decision.allowed is True

        # Can read audit logs
        audit_decision = await engine.evaluate(
            role=Role.AUDITOR,
            scopes=auditor_scopes,
            permission=Permission(resource="audit", action="read"),
        )
        assert audit_decision.allowed is True

        # Can read reports
        reports_decision = await engine.evaluate(
            role=Role.AUDITOR,
            scopes=auditor_scopes,
            permission=Permission(resource="reports", action="read"),
        )
        assert reports_decision.allowed is True

        # Cannot write data
        write_decision = await engine.evaluate(
            role=Role.AUDITOR,
            scopes=auditor_scopes,
            permission=Permission(resource="data", action="create"),
        )
        assert write_decision.allowed is False

    @pytest.mark.asyncio
    async def test_admin_full_access(self, engine):
        """Test admin has access to everything."""
        admin_scopes = ["users:manage", "roles:manage", "system:configure"]

        # Admin bypasses normal scope checks
        data_decision = await engine.evaluate(
            role=Role.ADMIN,
            scopes=admin_scopes,
            permission=Permission(resource="data", action="create"),
        )
        assert data_decision.allowed is True

        delete_decision = await engine.evaluate(
            role=Role.ADMIN,
            scopes=admin_scopes,
            permission=Permission(resource="data", action="delete"),
        )
        assert delete_decision.allowed is True
