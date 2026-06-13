"""Add alert_rules and alert_history tables

Revision ID: 002
Revises: 001
Create Date: 2026-06-13
"""

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS alert_rules (
            id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name           TEXT        NOT NULL,
            metric         TEXT        NOT NULL,
            operator       TEXT        NOT NULL CHECK (operator IN ('>', '<', '=', '!=')),
            threshold      FLOAT       NOT NULL,
            window_min     INTEGER     NOT NULL DEFAULT 5,
            severity       TEXT        NOT NULL DEFAULT 'warning'
                               CHECK (severity IN ('critical', 'warning', 'info')),
            channel        TEXT        NOT NULL DEFAULT '',
            status         TEXT        NOT NULL DEFAULT 'ok'
                               CHECK (status IN ('firing', 'ok', 'pending')),
            enabled        BOOLEAN     NOT NULL DEFAULT TRUE,
            last_triggered TIMESTAMPTZ,
            created_at     TIMESTAMPTZ DEFAULT now(),
            updated_at     TIMESTAMPTZ DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_alert_rules_project ON alert_rules(project_id);")

    op.execute("""
        CREATE TABLE IF NOT EXISTS alert_history (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id  UUID        NOT NULL,
            rule_id     UUID        REFERENCES alert_rules(id) ON DELETE SET NULL,
            rule_name   TEXT        NOT NULL,
            fired_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            resolved_at TIMESTAMPTZ,
            channel     TEXT        NOT NULL DEFAULT ''
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_alert_history_project "
        "ON alert_history(project_id, fired_at DESC);"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS alert_history;")
    op.execute("DROP TABLE IF EXISTS alert_rules;")
