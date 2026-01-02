"""
Error handling and sanitization middleware.

Prevents sensitive data leakage in error responses.
"""

import traceback
from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


# Sensitive patterns that should never appear in error messages
SENSITIVE_PATTERNS = [
    "password",
    "secret",
    "token",
    "api_key",
    "private_key",
    "credentials",
    "session",
    "cookie",
]


def sanitize_error_message(message: str) -> str:
    """
    Sanitize an error message to prevent sensitive data leakage.

    Args:
        message: The original error message

    Returns:
        Sanitized error message safe for client response
    """
    if not message:
        return "An error occurred"

    # Check for sensitive patterns
    message_lower = message.lower()
    for pattern in SENSITIVE_PATTERNS:
        if pattern in message_lower:
            logger.warning(
                "Sensitive data pattern detected in error message",
                pattern=pattern,
            )
            return "An error occurred while processing your request"

    # In production, return generic message
    if settings.environment == "production":
        return "An error occurred while processing your request"

    # In development, return the original message
    return message


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Global error handling middleware.

    Catches all exceptions and returns appropriate sanitized responses.
    """

    async def dispatch(self, request: Request, call_next) -> JSONResponse:
        """Process request and handle any exceptions."""
        try:
            response = await call_next(request)
            return response

        except HTTPException as exc:
            # Re-raise HTTP exceptions with sanitized detail
            raise HTTPException(
                status_code=exc.status_code,
                detail=sanitize_error_message(str(exc.detail)),
                headers=getattr(exc, "headers", None),
            ) from exc

        except ValueError as exc:
            logger.warning(
                "Validation error",
                path=request.url.path,
                error=str(exc),
            )
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": sanitize_error_message(str(exc))},
            )

        except PermissionError as exc:
            logger.warning(
                "Permission denied",
                path=request.url.path,
                error=str(exc),
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Access denied"},
            )

        except Exception as exc:
            # Log full error for debugging
            logger.error(
                "Unhandled exception",
                path=request.url.path,
                method=request.method,
                error=str(exc),
                traceback=traceback.format_exc(),
            )

            # Return sanitized error
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal server error"},
            )


def sanitizable_http_exception(
    status_code: int,
    detail: Any,
    **kwargs: Any,
) -> HTTPException:
    """
    Create an HTTPException with sanitizable detail.

    Args:
        status_code: HTTP status code
        detail: Error detail (will be sanitized if needed)
        **kwargs: Additional HTTPException arguments

    Returns:
        HTTPException instance
    """
    sanitized_detail = sanitize_error_message(str(detail))
    return HTTPException(status_code=status_code, detail=sanitized_detail, **kwargs)
