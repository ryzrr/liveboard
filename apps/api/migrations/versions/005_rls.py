"""Row-Level Security backstop for tenant isolation

Revision ID: 005
Revises: 004
Create Date: 2026-07-18

Defense-in-depth: even if an app query forgets its `WHERE project_id = …`,
the database refuses to return another tenant's rows.

Design (single DB owner + a multi-project worker):
  • A restricted, NOLOGIN role `dashboard_reader` with SELECT only.
  • Dashboard READ connections `SET ROLE dashboard_reader` + set the
    `app.project_id` GUC (see api.deps.scoped_conn). Non-owner ⇒ RLS is
    enforced ⇒ only rows for the active project are visible.
  • The owner (ingest worker, alert writes) is NOT forced under RLS, so
    cross-project writes/aggregation keep working.

A read that forgets to set `app.project_id` sees ZERO rows (fail closed).
"""

from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None

_TABLES = ["events", "spans", "incidents", "alert_rules", "alert_history"]


def upgrade() -> None:
    # Restricted read role (no login — reached only via SET ROLE by the owner).
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dashboard_reader') THEN
                CREATE ROLE dashboard_reader NOLOGIN;
            END IF;
        END $$;
    """)
    # Let the app's owner role assume dashboard_reader.
    op.execute("DO $$ BEGIN EXECUTE 'GRANT dashboard_reader TO ' || current_user; END $$;")
    op.execute("GRANT USAGE ON SCHEMA public TO dashboard_reader;")

    for t in _TABLES:
        op.execute(f"GRANT SELECT ON {t} TO dashboard_reader;")
        op.execute(f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY;")
        # Scoped SELECT policy — applies only to dashboard_reader; the owner
        # (worker/ingest/alert writes) is unaffected.
        op.execute(f"""
            CREATE POLICY {t}_tenant_isolation ON {t}
                FOR SELECT
                TO dashboard_reader
                USING (project_id = NULLIF(current_setting('app.project_id', true), '')::uuid);
        """)


def downgrade() -> None:
    for t in _TABLES:
        op.execute(f"DROP POLICY IF EXISTS {t}_tenant_isolation ON {t};")
        op.execute(f"ALTER TABLE {t} DISABLE ROW LEVEL SECURITY;")
        op.execute(f"REVOKE SELECT ON {t} FROM dashboard_reader;")
    op.execute("REVOKE USAGE ON SCHEMA public FROM dashboard_reader;")
    # Role left in place (may be referenced elsewhere); drop manually if needed.
