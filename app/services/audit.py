"""
Audit Logging Service.

All actions are logged to the append-only audit log for compliance.
The audit trail is immutable and complete.
"""

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.event import AuditLog

logger = get_logger(__name__)


@dataclass
class AuditContext:
    """Context information for an audit log entry."""

    request_id: UUID | None = None
    request_path: str | None = None
    request_method: str | None = None
    user_agent: str | None = None
    ip_address: str | None = None


class AuditLogEntry(BaseModel):
    """An audit log entry."""

    # Who
    actor_id: UUID
    actor_role: str
    actor_username: str

    # What
    action: str
    resource_type: str
    resource_id: UUID | None = None

    # Authorization
    scope_granted: str | None = None

    # Request tracking
    request_id: UUID | None = None
    request_path: str | None = None
    request_method: str | None = None

    # Client info
    user_agent: str | None = None
    ip_address: str | None = None

    # Result
    success: bool = True
    error_message: str | None = None
    status_code: int | None = None

    # Additional context
    context: dict[str, Any] | None = None


class AuditLogger:
    """
    Service for writing to the append-only audit log.

    All actions must be logged for compliance.
    The audit trail is immutable.
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize the audit logger with a database session."""
        self.session = session

    async def log(
        self,
        entry: AuditLogEntry,
    ) -> AuditLog:
        """
        Write an entry to the audit log.

        Args:
            entry: The audit log entry

        Returns:
            The created AuditLog record
        """
        audit_log = AuditLog(
            audit_id=uuid4(),
            actor_id=entry.actor_id,
            actor_role=entry.actor_role,
            actor_username=entry.actor_username,
            action=entry.action,
            resource_type=entry.resource_type,
            resource_id=entry.resource_id,
            scope_granted=entry.scope_granted,
            request_id=entry.request_id,
            request_path=entry.request_path,
            request_method=entry.request_method,
            user_agent=entry.user_agent,
            ip_address=entry.ip_address,
            success=entry.success,
            error_message=entry.error_message,
            status_code=entry.status_code,
            timestamp=datetime.now(UTC),
            context=entry.context,
        )

        self.session.add(audit_log)
        await self.session.flush()

        logger.info(
            "Audit log entry created",
            audit_id=str(audit_log.audit_id),
            action=entry.action,
            actor=entry.actor_username,
            resource=f"{entry.resource_type}:{entry.resource_id}",
            success=entry.success,
        )

        return audit_log

    async def log_action(
        self,
        actor_id: UUID,
        actor_role: str,
        actor_username: str,
        action: str,
        resource_type: str,
        resource_id: UUID | None = None,
        scope_granted: str | None = None,
        context: AuditContext | None = None,
        success: bool = True,
        error_message: str | None = None,
        status_code: int | None = None,
        additional_context: dict[str, Any] | None = None,
    ) -> AuditLog:
        """
        Convenience method to log an action.

        Args:
            actor_id: ID of the user performing the action
            actor_role: Role of the user
            actor_username: Username of the user
            action: The action being performed
            resource_type: Type of resource
            resource_id: ID of the resource
            scope_granted: The scope that granted permission
            context: Request context
            success: Whether the action succeeded
            error_message: Error message if failed
            status_code: HTTP status code
            additional_context: Additional context data

        Returns:
            The created AuditLog record
        """
        entry = AuditLogEntry(
            actor_id=actor_id,
            actor_role=actor_role,
            actor_username=actor_username,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            scope_granted=scope_granted,
            request_id=context.request_id if context else None,
            request_path=context.request_path if context else None,
            request_method=context.request_method if context else None,
            user_agent=context.user_agent if context else None,
            ip_address=context.ip_address if context else None,
            success=success,
            error_message=error_message,
            status_code=status_code,
            context=additional_context,
        )

        return await self.log(entry)

    async def get_user_actions(
        self,
        actor_id: UUID,
        limit: int = 100,
    ) -> list[AuditLog]:
        """
        Get all audit entries for a specific user.

        Args:
            actor_id: The user ID
            limit: Maximum number of entries to return

        Returns:
            List of audit log entries
        """
        from sqlalchemy import select

        stmt = (
            select(AuditLog)
            .where(AuditLog.actor_id == actor_id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
        )

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_resource_history(
        self,
        resource_type: str,
        resource_id: UUID,
        limit: int = 100,
    ) -> list[AuditLog]:
        """
        Get all audit entries for a specific resource.

        Args:
            resource_type: The resource type
            resource_id: The resource ID
            limit: Maximum number of entries to return

        Returns:
            List of audit log entries
        """
        from sqlalchemy import select, and_

        stmt = (
            select(AuditLog)
            .where(
                and_(
                    AuditLog.resource_type == resource_type,
                    AuditLog.resource_id == resource_id,
                )
            )
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
        )

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_failed_actions(
        self,
        limit: int = 100,
    ) -> list[AuditLog]:
        """
        Get all failed actions.

        Args:
            limit: Maximum number of entries to return

        Returns:
            List of failed audit log entries
        """
        from sqlalchemy import select

        stmt = (
            select(AuditLog)
            .where(AuditLog.success == False)  # noqa: E712
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
        )

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def generate_compliance_report(
        self,
        from_date: datetime,
        to_date: datetime,
    ) -> dict[str, Any]:
        """
        Generate a compliance report for a time period.

        Args:
            from_date: Start of reporting period
            to_date: End of reporting period

        Returns:
            Compliance report with aggregated statistics
        """
        from sqlalchemy import select, func, and_

        # Get all logs in the time period
        stmt = select(AuditLog).where(
            and_(
                AuditLog.timestamp >= from_date,
                AuditLog.timestamp <= to_date,
            )
        )

        result = await self.session.execute(stmt)
        all_logs = result.scalars().all()

        # Calculate statistics
        total_actions = len(all_logs)
        successful_actions = sum(1 for log in all_logs if log.success)
        failed_actions = total_actions - successful_actions

        # Group by action type
        actions_by_type: dict[str, int] = {}
        for log in all_logs:
            actions_by_type[log.action] = actions_by_type.get(log.action, 0) + 1

        # Group by role
        actions_by_role: dict[str, int] = {}
        for log in all_logs:
            actions_by_role[log.actor_role] = (
                actions_by_role.get(log.actor_role, 0) + 1
            )

        return {
            "report_period": {
                "from": from_date.isoformat(),
                "to": to_date.isoformat(),
            },
            "summary": {
                "total_actions": total_actions,
                "successful_actions": successful_actions,
                "failed_actions": failed_actions,
                "success_rate": (
                    successful_actions / total_actions if total_actions > 0 else 0
                ),
            },
            "actions_by_type": actions_by_type,
            "actions_by_role": actions_by_role,
            "generated_at": datetime.now(UTC).isoformat(),
        }


def get_audit_logger(session: AsyncSession) -> AuditLogger:
    """Get an audit logger instance for the current session."""
    return AuditLogger(session)
