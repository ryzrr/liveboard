"""Public per-project status page (opt-in)

Revision ID: 007
Revises: 006
Create Date: 2026-07-20

Lets a project owner publish a logged-out-visitable status page at
/status/{public_slug}, scoped to exactly that project. Off by default —
`status_page_enabled` must be flipped on (see /v1/internal/projects/{id}/status-page)
before the public route will serve anything for a project.
"""

from alembic import op

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS public_slug TEXT;")
    op.execute(
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS status_page_enabled "
        "BOOLEAN NOT NULL DEFAULT FALSE;"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_public_slug "
        "ON projects(public_slug) WHERE public_slug IS NOT NULL;"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_projects_public_slug;")
    op.execute("ALTER TABLE projects DROP COLUMN IF EXISTS status_page_enabled;")
    op.execute("ALTER TABLE projects DROP COLUMN IF EXISTS public_slug;")
