"""FastAPI dependencies for authorization (ABAC)."""

from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.api.dependencies.auth import CurrentUser
from app.core.logging import get_logger
from app.security import TokenData
from app.security.authorization import Permission, policy_engine

logger = get_logger(__name__)


async def require_permission(
    resource: str,
    action: str,
    current_user: CurrentUser,
    resource_id: str | None = None,
    owner_id: str | None = None,
    resource_status: str | None = None,
) -> TokenData:
    """
    Dependency that enforces ABAC authorization.

    Evaluates the user's roles and scopes against the requested permission.
    Raises HTTPException if access is denied.

    Args:
        resource: The resource being accessed
        action: The action being performed
        current_user: The authenticated user from JWT
        resource_id: Optional specific resource ID
        owner_id: Optional owner ID for ownership checks
        resource_status: Optional resource status for constraint checks

    Returns:
        The current user if access is granted

    Raises:
        HTTPException: If access is denied (403 Forbidden)
    """
    permission = Permission(
        resource=resource,
        action=action,
        resource_id=resource_id,
        owner_id=owner_id,
        resource_status=resource_status,
    )

    decision = await policy_engine.evaluate(
        role=current_user.role,
        scopes=current_user.scopes,
        permission=permission,
    )

    if not decision.allowed:
        logger.warning(
            "Access denied",
            user_id=current_user.user_id,
            role=current_user.role,
            resource=resource,
            action=action,
            reason=decision.reason,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=decision.reason,
        )

    logger.info(
        "Access granted",
        user_id=current_user.user_id,
        role=current_user.role,
        resource=resource,
        action=action,
        matched_scope=decision.matched_scope,
    )

    return current_user


def require_scope(*scopes: str) -> TokenData:
    """
    Factory function to create a scope-specific dependency.

    Checks if the user has ANY of the required scopes.

    Args:
        *scopes: One or more scope IDs that grant access

    Returns:
        A dependency that validates the user has at least one required scope

    Example:
        @app.post("/data")
        async def create_data(
            user: Annotated[TokenData, Depends(require_scope("data:create"))]
        ):
            ...
    """
    async def _check_scope(current_user: CurrentUser) -> TokenData:
        if not any(scope in current_user.scopes for scope in scopes):
            logger.warning(
                "Missing required scope",
                user_id=current_user.user_id,
                user_scopes=current_user.scopes,
                required_scopes=list(scopes),
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of scopes: {', '.join(scopes)}",
            )
        return current_user

    return Depends(_check_scope)


# Convenience functions for common permission checks
def require_data_read(current_user: CurrentUser) -> TokenData:
    """Require permission to read data (own or all)."""
    return Depends(
        require_permission("data", "read", current_user=current_user)
    )


def require_data_write(current_user: CurrentUser) -> TokenData:
    """Require permission to create or update data."""
    return Depends(
        require_permission("data", "create", current_user=current_user)
    )


def require_data_confirm(current_user: CurrentUser) -> TokenData:
    """Require permission to confirm data entries."""
    return Depends(
        require_permission("data", "confirm", current_user=current_user)
    )


def require_audit_read(current_user: CurrentUser) -> TokenData:
    """Require permission to read audit logs."""
    return Depends(
        require_permission("audit", "read", current_user=current_user)
    )
