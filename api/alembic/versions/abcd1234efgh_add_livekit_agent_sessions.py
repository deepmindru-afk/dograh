"""add livekit agent sessions table

Revision ID: abcd1234efgh
Revises: 67a5cf3e09d0
Create Date: 2026-05-21 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "abcd1234efgh"
down_revision: Union[str, None] = "67a5cf3e09d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "livekit_agent_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "room_name", sa.String(length=255), nullable=False, index=True
        ),
        sa.Column(
            "workflow_run_id", sa.Integer(), nullable=True
        ),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column(
            "agent_name",
            sa.String(length=128),
            nullable=False,
            server_default=sa.text("'dograh-agent'::character varying"),
        ),
        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
            server_default=sa.text("'initialized'::character varying"),
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["workflow_run_id"],
            ["workflow_runs.id"],
            name="fk_lk_sessions_workflow_run_id",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_lk_sessions_organization_id",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_livekit_agent_sessions"),
    )
    op.create_index(
        "idx_lk_sessions_org_status",
        "livekit_agent_sessions",
        ["organization_id", "status"],
    )
    op.create_index(
        "idx_lk_sessions_workflow_run",
        "livekit_agent_sessions",
        ["workflow_run_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_lk_sessions_workflow_run", table_name="livekit_agent_sessions")
    op.drop_index("idx_lk_sessions_org_status", table_name="livekit_agent_sessions")
    op.drop_table("livekit_agent_sessions")
