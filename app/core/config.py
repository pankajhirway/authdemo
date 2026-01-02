"""Application configuration settings."""

from functools import cached_property
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/authz_authn_db",
        description="PostgreSQL database connection URL",
    )
    database_pool_size: int = Field(default=20, description="Database connection pool size")
    database_max_overflow: int = Field(default=10, description="Database connection pool max overflow")

    # Keycloak / OAuth2
    keycloak_url: str = Field(default="http://localhost:8080", description="Keycloak base URL")
    keycloak_realm: str = Field(default="authz-authn-demo", description="Keycloak realm name")
    keycloak_client_id: str = Field(
        default="authz-authn-backend", description="Keycloak client ID"
    )
    keycloak_client_secret: str = Field(
        default="", description="Keycloak client secret (if confidential client)"
    )
    keycloak_algorithm: str = Field(default="RS256", description="JWT signature algorithm")
    keycloak_issuer: str = Field(
        default="http://localhost:8080/realms/authz-authn-demo",
        description="JWT issuer URL",
    )

    # Application
    api_v1_prefix: str = Field(default="/api/v1", description="API v1 prefix")
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    workers: int = Field(default=4, description="Number of worker processes")
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", description="Log level"
    )
    environment: Literal["development", "staging", "production"] = Field(
        default="development", description="Environment name"
    )

    # Security
    jwt_access_token_expire_minutes: int = Field(
        default=30, description="JWT access token expiration in minutes"
    )

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, description="Rate limit per minute")
    rate_limit_burst: int = Field(default=10, description="Rate limit burst size")

    # CORS
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
        description="Allowed CORS origins",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @cached_property
    def jwt_audience(self) -> str:
        """Get JWT audience from client ID."""
        return self.keycloak_client_id

    @cached_property
    def jwks_url(self) -> str:
        """Get JWKS URL for JWT verification."""
        return f"{self.keycloak_url}/realms/{self.keycloak_realm}/protocol/openid-connect/certs"


settings = Settings()
