"""
Attribute-Based Access Control (ABAC) Policy Engine.

Implements a default-deny authorization model where all actions are denied
unless explicitly allowed by a policy rule. The engine evaluates permissions
based on user roles, granted scopes, and resource context.
"""

from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class Role(str, Enum):
    """User roles in the system."""

    OPERATOR = "operator"
    SUPERVISOR = "supervisor"
    AUDITOR = "auditor"
    ADMIN = "admin"


@dataclass(frozen=True)
class Scope:
    """
    A scope represents a specific permission on a resource.

    Attributes:
        id: Scope identifier in format "resource:action:filter"
        resource: The target resource (e.g., "data", "users")
        action: The action being performed (e.g., "read", "create")
        filter: Optional filter on the resource (e.g., "own", "all")
        constraint: Optional additional constraint (e.g., "unconfirmed")
    """

    id: str
    resource: str
    action: str
    filter: str | None = None
    constraint: str | None = None

    @classmethod
    def from_string(cls, scope_id: str) -> "Scope":
        """Parse a scope string into a Scope object."""
        parts = scope_id.split(":")
        if len(parts) < 2:
            raise ValueError(f"Invalid scope format: {scope_id}")

        resource = parts[0]
        action = parts[1]
        filter_val = parts[2] if len(parts) > 2 else None

        return cls(id=scope_id, resource=resource, action=action, filter=filter_val)

    def matches(self, resource: str, action: str) -> bool:
        """Check if this scope matches the given resource and action."""
        return self.resource == resource and self.action == action


class Permission(BaseModel):
    """
    A permission request being evaluated.

    Attributes:
        resource: The resource being accessed
        action: The action being performed
        resource_id: Optional specific resource ID being accessed
        owner_id: Optional owner ID of the resource (for ownership checks)
        resource_status: Optional current status of the resource (for constraint checks)
    """

    resource: str = Field(..., description="The resource being accessed")
    action: str = Field(..., description="The action being performed")
    resource_id: str | None = Field(None, description="Specific resource ID")
    owner_id: str | None = Field(None, description="Owner ID of the resource")
    resource_status: str | None = Field(None, description="Current status of the resource")


class AccessDecision(BaseModel):
    """
    Result of a policy evaluation.

    Attributes:
        allowed: Whether access is granted
        reason: Human-readable explanation of the decision
        matched_scope: The scope that granted access (if allowed)
    """

    allowed: bool
    reason: str
    matched_scope: str | None = None


class PolicyEngine:
    """
    ABAC Policy Engine with default-deny semantics.

    All access requests are denied by default. Access is only granted if:
    1. The user's role has a scope matching the resource:action
    2. Any scope filters are satisfied (e.g., "own" filter requires ownership)
    3. Any scope constraints are satisfied (e.g., "unconfirmed" constraint)
    """

    def __init__(self) -> None:
        """Initialize the policy engine with role-scope mappings."""
        self._role_scopes: dict[Role, list[Scope]] = self._load_role_scopes()
        self._scope_index: dict[str, Scope] = self._build_scope_index()

    async def evaluate(
        self,
        role: str,
        scopes: list[str],
        permission: Permission,
    ) -> AccessDecision:
        """
        Evaluate whether a user with the given role and scopes can perform an action.

        Args:
            role: The user's role
            scopes: Scopes granted to the user (from JWT)
            permission: The permission request being evaluated

        Returns:
            AccessDecision with the result of the evaluation
        """
        # Admin role bypasses most checks
        if role == Role.ADMIN:
            return AccessDecision(
                allowed=True,
                reason="Admin role has all permissions",
                matched_scope="admin:all",
            )

        # Get scopes available for the user's role
        role_scopes = self._role_scopes.get(Role(role), [])
        if not role_scopes:
            return AccessDecision(
                allowed=False,
                reason=f"Role '{role}' has no defined scopes",
            )

        # Find matching scopes
        matching_scopes = [
            s
            for s in role_scopes
            if s.matches(permission.resource, permission.action) and s.id in scopes
        ]

        if not matching_scopes:
            logger.warning(
                "Access denied: no matching scope",
                role=role,
                resource=permission.resource,
                action=permission.action,
                user_scopes=scopes,
            )
            return AccessDecision(
                allowed=False,
                reason=f"No scope grants {permission.resource}:{permission.action} for role '{role}'",
            )

        # Evaluate each matching scope
        for scope in matching_scopes:
            if self._evaluate_filters_and_constraints(scope, permission):
                return AccessDecision(
                    allowed=True,
                    reason=f"Access granted via scope '{scope.id}'",
                    matched_scope=scope.id,
                )

        return AccessDecision(
            allowed=False,
            reason=f"Scope filters or constraints not satisfied for {permission.resource}:{permission.action}",
        )

    def _evaluate_filters_and_constraints(self, scope: Scope, permission: Permission) -> bool:
        """
        Evaluate scope filters and constraints against the permission context.

        Args:
            scope: The scope being evaluated
            permission: The permission request with context

        Returns:
            True if all filters and constraints are satisfied
        """
        # Check ownership filter
        if scope.filter == "own":
            if permission.owner_id is None:
                logger.warning("Ownership check failed: no owner_id in permission context")
                return False
            # We'll need to check if permission.owner_id matches the authenticated user
            # This is done at the dependency level, so we just verify the field is present
            # and return True - the actual comparison happens in the auth dependency

        # Check "all" filter - always passes
        if scope.filter == "all":
            pass

        # Check constraints (e.g., "unconfirmed")
        if scope.constraint == "unconfirmed":
            if permission.resource_status != "unconfirmed":
                logger.warning(
                    "Constraint check failed",
                    constraint=scope.constraint,
                    resource_status=permission.resource_status,
                )
                return False

        return True

    def _load_role_scopes(self) -> dict[Role, list[Scope]]:
        """
        Load the role-to-scope mapping.

        In production, this could be loaded from a database or config file.
        For now, it's hardcoded based on the specification.

        Returns:
            Dictionary mapping roles to their scopes
        """
        return {
            Role.OPERATOR: [
                Scope("data:create", "data", "create"),
                Scope("data:read:own", "data", "read", "own"),
                Scope("data:update:own", "data", "update", "own", "unconfirmed"),
            ],
            Role.SUPERVISOR: [
                Scope("data:read:all", "data", "read", "all"),
                Scope("data:confirm", "data", "confirm"),
                Scope("data:correct", "data", "correct"),
                Scope("data:reject", "data", "reject"),
                Scope("reports:read", "reports", "read"),
            ],
            Role.AUDITOR: [
                Scope("data:read:all", "data", "read", "all"),
                Scope("audit:read", "audit", "read"),
                Scope("reports:read", "reports", "read"),
                Scope("events:read", "events", "read"),
                Scope("users:read", "users", "read"),
            ],
            Role.ADMIN: [
                # Admin gets all scopes
                Scope("users:manage", "users", "manage"),
                Scope("roles:manage", "roles", "manage"),
                Scope("system:configure", "system", "configure"),
                Scope("health:read", "health", "read"),
                Scope("metrics:read", "metrics", "read"),
                Scope("data:read:all", "data", "read", "all"),
                Scope("audit:read", "audit", "read"),
                Scope("events:read", "events", "read"),
            ],
        }

    def _build_scope_index(self) -> dict[str, Scope]:
        """Build an index of all scopes for quick lookup."""
        index: dict[str, Scope] = {}
        for scopes in self._role_scopes.values():
            for scope in scopes:
                index[scope.id] = scope
        return index

    def get_scopes_for_role(self, role: str) -> list[str]:
        """
        Get all scope IDs for a given role.

        Args:
            role: The role name

        Returns:
            List of scope IDs
        """
        return [s.id for s in self._role_scopes.get(Role(role), [])]


@lru_cache
def get_policy_engine() -> PolicyEngine:
    """Get the singleton policy engine instance."""
    return PolicyEngine()


# Global policy engine instance
policy_engine = get_policy_engine()
