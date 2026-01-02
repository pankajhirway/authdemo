"""
Rate limiting middleware to prevent abuse.

Implements token bucket rate limiting per user/IP.
"""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from functools import wraps
from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""

    requests_per_minute: int
    burst: int


class RateLimiter:
    """
    Token bucket rate limiter.

    Stores rate limit state in memory (can be replaced with Redis for distributed systems).
    """

    def __init__(self, config: RateLimitConfig) -> None:
        """Initialize the rate limiter."""
        self.config = config
        # In-memory storage (use Redis in production)
        self._buckets: dict[str, _TokenBucket] = {}

    def _get_bucket(self, key: str) -> "_TokenBucket":
        """Get or create a token bucket for the key."""
        if key not in self._buckets:
            self._buckets[key] = _TokenBucket(
                capacity=self.config.burst,
                refill_rate=self.config.requests_per_minute / 60,
            )
        return self._buckets[key]

    def check_rate_limit(self, key: str) -> tuple[bool, int]:
        """
        Check if a request is within rate limits.

        Args:
            key: Unique identifier for the rate limit bucket (user_id or IP)

        Returns:
            Tuple of (allowed, retry_after_seconds)
        """
        bucket = self._get_bucket(key)
        allowed, retry_after = bucket.consume()

        if not allowed:
            logger.warning(
                "Rate limit exceeded",
                key=key,
                retry_after=retry_after,
            )

        return allowed, retry_after

    def reset(self, key: str) -> None:
        """Reset rate limit for a key (admin use)."""
        if key in self._buckets:
            del self._buckets[key]


@dataclass
class _TokenBucket:
    """Token bucket for rate limiting."""

    capacity: int
    refill_rate: float  # tokens per second
    tokens: float = 0
    last_refill: datetime = None

    def __post_init__(self) -> None:
        if self.last_refill is None:
            self.last_refill = datetime.now(UTC)

    def _refill(self) -> None:
        """Refill tokens based on elapsed time."""
        now = datetime.now(UTC)
        elapsed = (now - self.last_refill).total_seconds()
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

    def consume(self) -> tuple[bool, int]:
        """
        Try to consume one token.

        Returns:
            Tuple of (allowed, retry_after_seconds)
        """
        self._refill()

        if self.tokens >= 1:
            self.tokens -= 1
            return True, 0
        else:
            # Calculate time until next token
            retry_after = int((1 - self.tokens) / self.refill_rate)
            return False, retry_after


# Global rate limiter instance
_rate_limiter = RateLimiter(
    RateLimitConfig(
        requests_per_minute=settings.rate_limit_per_minute,
        burst=settings.rate_limit_burst,
    )
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce rate limiting.

    Rate limits are applied per user (if authenticated) or per IP address.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and enforce rate limits."""
        # Get the rate limit key
        key = self._get_rate_limit_key(request)

        # Check rate limit
        allowed, retry_after = _rate_limiter.check_rate_limit(key)

        if not allowed:
            return Response(
                content='{"detail":"Rate limit exceeded"}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json",
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(settings.rate_limit_per_minute),
                },
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(settings.rate_limit_per_minute)
        response.headers["X-RateLimit-Remaining"] = "1"  # Simplified

        return response

    def _get_rate_limit_key(self, request: Request) -> str:
        """
        Get the rate limit key for a request.

        Uses user_id if authenticated, otherwise IP address.
        """
        # Try to get user from request state (set by auth middleware)
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"

        # Fall back to IP address
        # Note: In production, use proper X-Forwarded-For handling
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    return _rate_limiter
