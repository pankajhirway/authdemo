"""JWT token validation and processing for Keycloak integration."""

import json
from datetime import datetime
from typing import Any
from uuid import UUID

import httpx
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from jose import jwk, jwt
from jose.exceptions import JWSError, JWTError
from pydantic import BaseModel, Field, field_validator

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class TokenData(BaseModel):
    """Extracted and validated JWT token data."""

    user_id: str = Field(..., description="User's unique identifier from the identity provider")
    username: str = Field(..., description="User's username")
    email: str | None = Field(None, description="User's email address")
    role: str = Field(..., description="Primary role assigned to the user")
    scopes: list[str] = Field(default_factory=list, description="Granted scopes/permissions")
    client_id: str = Field(..., description="OAuth2 client identifier")
    exp: int = Field(..., description="Token expiration timestamp (Unix epoch)")
    iat: int = Field(..., description="Token issued at timestamp (Unix epoch)")
    iss: str = Field(..., description="Token issuer URL")
    aud: str | None = Field(None, description="Token audience")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Validate that the role is one of the allowed roles."""
        allowed_roles = {"operator", "supervisor", "auditor", "admin"}
        if v not in allowed_roles:
            logger.warning("Unknown role in token", role=v)
        return v

    @property
    def is_expired(self) -> bool:
        """Check if the token has expired."""
        return datetime.utcnow().timestamp() > self.exp


class JWKSProvider:
    """
    Fetches and caches JSON Web Key Sets from Keycloak.

    Uses the JWKS endpoint to retrieve public keys for JWT verification.
    """

    def __init__(self, jwks_url: str, cache_ttl_seconds: int = 300) -> None:
        """
        Initialize the JWKS provider.

        Args:
            jwks_url: URL to fetch JWKS from
            cache_ttl_seconds: How long to cache keys before refetching
        """
        self.jwks_url = jwks_url
        self.cache_ttl = cache_ttl_seconds
        self._cached_keys: dict[str, Any] = {}
        self._cache_expires: float = 0

    async def get_public_key(self, kid: str) -> str | None:
        """
        Get a public key by its key ID.

        Args:
            kid: The key ID from the JWT header

        Returns:
            PEM-formatted public key string, or None if not found
        """
        if datetime.utcnow().timestamp() > self._cache_expires:
            await self._refresh_keys()

        key_data = self._cached_keys.get(kid)
        if not key_data:
            logger.error("Key not found in JWKS", kid=kid)
            return None

        return jwk.construct(key_data, algorithm=settings.keycloak_algorithm).to_pem().decode(
            "utf-8"
        )

    async def _refresh_keys(self) -> None:
        """Fetch and cache the latest JWKS from the identity provider."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.jwks_url)
                response.raise_for_status()
                jwks_data = response.json()

                self._cached_keys = {key["kid"]: key for key in jwks_data.get("keys", [])}
                self._cache_expires = datetime.utcnow().timestamp() + self.cache_ttl

                logger.info("Refreshed JWKS cache", key_count=len(self._cached_keys))
        except httpx.HTTPError as e:
            logger.error("Failed to fetch JWKS", error=str(e))
            if not self._cached_keys:
                # Only raise if we have no cached keys at all
                raise


class JWTValidator:
    """
    Validates JWT tokens using Keycloak's JWKS.

    Enforces strict validation rules:
    - Signature verification using JWKS
    - Expiration check
    - Issuer validation
    - Audience validation (if configured)
    """

    def __init__(self) -> None:
        """Initialize the JWT validator with JWKS provider."""
        self.jwks = JWKSProvider(settings.jwks_url)
        self.issuer = settings.keycloak_issuer
        self.audience = settings.jwt_audience
        self.algorithms = [settings.keycloak_algorithm]

    async def validate(self, token: str) -> TokenData:
        """
        Validate and decode a JWT token.

        Args:
            token: The raw JWT token string

        Returns:
            TokenData with extracted claims

        Raises:
            JWTError: If validation fails for any reason
        """
        try:
            # Extract header to get key ID
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")

            if not kid:
                logger.error("Token missing 'kid' in header")
                raise JWTError("Token missing key ID")

            # Get the public key for verification
            public_key = await self.jwks.get_public_key(kid)
            if not public_key:
                raise JWTError(f"Unable to find key for kid: {kid}")

            # Verify and decode the token
            # Note: Keycloak uses 'azp' (authorized party) instead of 'aud' (audience)
            # So we verify the azp claim matches our client_id instead
            payload = jwt.decode(
                token,
                public_key,
                algorithms=self.algorithms,
                issuer=self.issuer,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iss": True,
                    "verify_aud": False,  # Keycloak doesn't use aud, uses azp instead
                },
            )

            # Verify azp (authorized party) matches our client_id
            azp = payload.get("azp")
            if azp != self.audience:
                logger.error("Token azp mismatch", azp=azp, expected=self.audience)
                raise JWTError(f"Token not issued for this client: expected {self.audience}, got {azp}")

            # Extract and validate token data
            token_data = self._extract_token_data(payload)

            logger.info(
                "Token validated",
                user_id=token_data.user_id,
                role=token_data.role,
                scopes=token_data.scopes,
            )

            return token_data

        except JWSError as e:
            logger.error("JWT validation error", error=str(e))
            raise JWTError(f"Invalid token: {e}") from e
        except JWTError as e:
            logger.error("JWT processing error", error=str(e))
            raise
        except Exception as e:
            logger.error("Unexpected error during token validation", error=str(e))
            raise JWTError("Token validation failed") from e

    def _extract_token_data(self, payload: dict[str, Any]) -> TokenData:
        """
        Extract and structure token data from the JWT payload.

        Args:
            payload: The decoded JWT payload

        Returns:
            TokenData with structured claims

        Raises:
            JWTError: If required claims are missing
        """
        try:
            # Extract standard claims
            user_id = payload.get("sub")
            if not user_id:
                raise JWTError("Token missing 'sub' claim")

            # Extract role from realm_access or resource_access
            role = self._extract_role(payload)

            # Extract scopes
            scopes = self._extract_scopes(payload)

            return TokenData(
                user_id=user_id,
                username=payload.get("preferred_username", user_id),
                email=payload.get("email"),
                role=role,
                scopes=scopes,
                client_id=payload.get("azp", ""),
                exp=int(payload["exp"]),
                iat=int(payload["iat"]),
                iss=str(payload["iss"]),
                aud=payload.get("aud"),
            )

        except (KeyError, ValueError) as e:
            logger.error("Failed to extract token data", error=str(e))
            raise JWTError(f"Invalid token payload: {e}") from e

    def _extract_role(self, payload: dict[str, Any]) -> str:
        """
        Extract the primary role from the token.

        Checks realm_access.roles and resource_access for role information.

        Args:
            payload: The decoded JWT payload

        Returns:
            The primary role as a string

        Raises:
            JWTError: If no role is found
        """
        # Check realm_access.roles first
        if realm_access := payload.get("realm_access", {}):
            roles = realm_access.get("roles", [])
            if roles:
                # Return the first role that matches our known roles
                known_roles = {"operator", "supervisor", "auditor", "admin"}
                for role in roles:
                    if role in known_roles:
                        return role

        # Check resource_access as fallback
        if resource_access := payload.get("resource_access", {}):
            for client_resource in resource_access.values():
                if roles := client_resource.get("roles", []):
                    known_roles = {"operator", "supervisor", "auditor", "admin"}
                    for role in roles:
                        if role in known_roles:
                            return role

        # Fallback: if we have a 'role' claim directly
        if role := payload.get("role"):
            return role

        raise JWTError("Token missing role information")

    def _extract_scopes(self, payload: dict[str, Any]) -> list[str]:
        """
        Extract scopes from the token.

        Scopes can be in 'scope' claim (space-separated) or 'scopes' claim (array).

        Args:
            payload: The decoded JWT payload

        Returns:
            List of scope strings
        """
        # Check for scopes array
        if scopes := payload.get("scopes"):
            if isinstance(scopes, list):
                return scopes

        # Check for space-separated scope claim
        if scope_str := payload.get("scope"):
            if isinstance(scope_str, str):
                return scope_str.split()

        return []


# Global validator instance
jwt_validator = JWTValidator()
