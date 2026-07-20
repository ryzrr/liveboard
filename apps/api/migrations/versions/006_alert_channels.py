"""Alert delivery channels (real Slack/Discord/PagerDuty/webhook targets)

Revision ID: 006
Revises: 005
Create Date: 2026-07-19

Backs the alerts "Channels" tab with real, per-project destinations. Alert
rules reference a channel by name (alert_rules.channel); the evaluation worker
looks the channel up here to get its webhook URL and delivers the notification.
"""

from alembic import op

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS alert_channels (
            id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            type             TEXT        NOT NULL CHECK (type IN ('slack', 'discord', 'pagerduty', 'webhook')),
            name             TEXT        NOT NULL,
            webhook_url      TEXT,
            enabled          BOOLEAN     NOT NULL DEFAULT TRUE,
            last_delivery_at TIMESTAMPTZ,
            last_delivery_ok BOOLEAN,
            created_at       TIMESTAMPTZ DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_alert_channels_project ON alert_channels(project_id);")

    # RLS backstop — dashboard reads (dashboard_reader role) are scoped to the
    # active project via app.project_id, same as the other tenant tables.
    op.execute("GRANT SELECT ON alert_channels TO dashboard_reader;")
    op.execute("ALTER TABLE alert_channels ENABLE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY alert_channels_tenant_isolation ON alert_channels
            FOR SELECT
            TO dashboard_reader
            USING (project_id = NULLIF(current_setting('app.project_id', true), '')::uuid);
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS alert_channels_tenant_isolation ON alert_channels;")
    op.execute("DROP TABLE IF EXISTS alert_channels;")
