"""Multi-tenancy: organizations, memberships, projects.org_id

Revision ID: 003
Revises: 002
Create Date: 2026-07-18

Introduces the tenancy identity layer:
  organizations  — a tenant (a company / team / solo dev's workspace)
  memberships    — which users belong to which org, and their role
  projects.org_id — every project now belongs to exactly one org

Telemetry tables already carry project_id, so an org owns its data
transitively (org -> projects -> events/spans/incidents). This migration
only adds the *ownership* layer; read-time authorization is enforced in
the app (Phase 8.2) and, later, Postgres RLS (Phase 8.4).
"""

from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Organizations (tenants) ──────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS organizations (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            name        TEXT        NOT NULL,
            slug        TEXT        UNIQUE NOT NULL,
            created_at  TIMESTAMPTZ DEFAULT now()
        );
    """)

    # ── Memberships (user ↔ org, with role) ──────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS memberships (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role        TEXT        NOT NULL DEFAULT 'member'
                                    CHECK (role IN ('owner', 'admin', 'member')),
            created_at  TIMESTAMPTZ DEFAULT now(),
            UNIQUE (org_id, user_id)
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_memberships_org  ON memberships(org_id);")

    # ── projects now belong to an org ────────────────────────────────────────
    op.execute("""
        ALTER TABLE projects
            ADD COLUMN IF NOT EXISTS org_id UUID
            REFERENCES organizations(id) ON DELETE CASCADE;
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(org_id);")

    # ── Backfill: adopt any pre-existing projects into a 'Default' org ────────
    # Keeps a single-tenant install working after the upgrade.
    op.execute("""
        INSERT INTO organizations (name, slug)
        SELECT 'Default', 'default'
        WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'default');
    """)
    op.execute("""
        UPDATE projects
        SET org_id = (SELECT id FROM organizations WHERE slug = 'default')
        WHERE org_id IS NULL;
    """)
    # If a project already has an owner_id, seat that user as org owner.
    op.execute("""
        INSERT INTO memberships (org_id, user_id, role)
        SELECT DISTINCT p.org_id, p.owner_id, 'owner'
        FROM projects p
        WHERE p.owner_id IS NOT NULL
          AND p.org_id IS NOT NULL
        ON CONFLICT (org_id, user_id) DO NOTHING;
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE projects DROP COLUMN IF EXISTS org_id;")
    op.execute("DROP TABLE IF EXISTS memberships;")
    op.execute("DROP TABLE IF EXISTS organizations;")
