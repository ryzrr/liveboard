"""API keys table — multiple keys per project, rotation + revocation

Revision ID: 004
Revises: 003
Create Date: 2026-07-18

Moves API-key auth from the single `projects.api_key` column to a dedicated
`api_keys` table so a project can have multiple keys, rotate, and revoke.
`projects.api_key` is kept (now nullable) as a legacy fallback for auth.
"""

from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS api_keys (
            id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id   UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            key_hash     TEXT        UNIQUE NOT NULL,
            name         TEXT        NOT NULL DEFAULT 'default',
            prefix       TEXT,       -- display hint, e.g. 'lb_live_eyA2'
            last_used_at TIMESTAMPTZ,
            revoked_at   TIMESTAMPTZ,
            created_at   TIMESTAMPTZ DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_api_keys_project ON api_keys(project_id);")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) "
        "WHERE revoked_at IS NULL;"
    )

    # Backfill existing project keys into the new table.
    op.execute("""
        INSERT INTO api_keys (project_id, key_hash, name)
        SELECT id, api_key, 'default'
        FROM projects
        WHERE api_key IS NOT NULL
        ON CONFLICT (key_hash) DO NOTHING;
    """)

    # New projects store their keys in api_keys; the column is now optional.
    op.execute("ALTER TABLE projects ALTER COLUMN api_key DROP NOT NULL;")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS api_keys;")
    # Leaves projects.api_key nullable — safe (existing rows keep their value).
