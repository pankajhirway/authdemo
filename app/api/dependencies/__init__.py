"""FastAPI dependencies for API routes."""

from app.api.dependencies.auth import (
    CurrentUser,
    OptionalCurrentUser,
    get_current_user,
    get_current_user_optional,
    get_current_user_with_role,
    require_role,
)

__all__ = [
    "CurrentUser",
    "OptionalCurrentUser",
    "get_current_user",
    "get_current_user_optional",
    "get_current_user_with_role",
    "require_role",
]
