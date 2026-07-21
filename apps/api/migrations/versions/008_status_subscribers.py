"""Status page incident-alert subscribers (double opt-in by email)

Revision ID: 008
Revises: 007
Create Date: 2026-07-20

Backs the public status page's "Get Incident Alerts" form. A row is created
on subscribe with `confirmed_at = NULL`; the anomaly worker only emails rows
where `confirmed_at IS NOT NULL AND unsubscribed_at IS NULL`, so an address is
never emailed until it's clicked its confirmation link.
"""

from alembic import op

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS status_subscribers (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            email           TEXT        NOT NULL,
            confirm_token   TEXT        UNIQUE NOT NULL,
            confirmed_at    TIMESTAMPTZ,
            unsubscribed_at TIMESTAMPTZ,
            created_at      TIMESTAMPTZ DEFAULT now(),
            UNIQUE (project_id, email)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_status_subscribers_active "
        "ON status_subscribers(project_id) "
        "WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS status_subscribers;")
