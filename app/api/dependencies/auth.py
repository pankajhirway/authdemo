"""FastAPI dependencies for authentication."""

from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.logging import get_logger
from app.security import TokenData, jwt_validator

logger = get_logger(__name__)

# HTTP Bearer scheme for token extraction
security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(security)],
) -> TokenData | None:
    """
    Optional authentication dependency.

    Returns None if no token is provided or if token is invalid.
    Useful for endpoints that work with or without authentication.

    Args:
        credentials: The extracted Bearer credentials from the request

    Returns:
        TokenData if valid token provided, None otherwise
    """
    if credentials is None:
        return None

    try:
        return await jwt_validator.validate(credentials.credentials)
    except Exception as e:
        logger.warning("Optional auth failed", error=str(e))
        return None


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Security(security)],
) -> TokenData:
    """
    Required authentication dependency.

    Validates the JWT token and returns the user data.

    Args:
        credentials: The extracted Bearer credentials from the request

    Returns:
        TokenData with validated user information

    Raises:
        HTTPException: If authentication fails
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return await jwt_validator.validate(credentials.credentials)
    except Exception as e:
        logger.warning("Authentication failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user_with_role(required_role: str) -> TokenData:
    """
    Authentication dependency with role requirement.

    Validates the JWT token and ensures the user has the required role.

    Args:
        required_role: The role required to access the endpoint

    Returns:
        TokenData with validated user information

    Raises:
        HTTPException: If authentication fails or user lacks required role
    """
    user = await get_current_user(
        Annotated[HTTPAuthorizationCredentials, Security(security)]
    )

    if user.role != required_role and user.role != "admin":
        logger.warning("Insufficient role", user_role=user.role, required_role=required_role)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{required_role}' required",
        )

    return user


# Type aliases for cleaner dependency injection
CurrentUser = Annotated[TokenData, Depends(get_current_user)]
OptionalCurrentUser = Annotated[TokenData | None, Depends(get_current_user_optional)]


def require_role(role: str) -> TokenData:
    """
    Factory function to create a role-specific dependency.

    Args:
        role: The required role name

    Returns:
        A dependency that validates the user has the required role

    Example:
        @app.get("/admin/settings")
        async def get_settings(user: Annotated[TokenData, Depends(require_role("admin"))]):
            ...
    """
    async def _require_role(current_user: CurrentUser) -> TokenData:
        if current_user.role != role and current_user.role != "admin":
            logger.warning("Insufficient role", user_role=current_user.role, required_role=role)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' required",
            )
        return current_user

    return Depends(_require_role)
