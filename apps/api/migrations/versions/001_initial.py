"""Initial schema — users, projects, events hypertable, spans, incidents

Revision ID: 001
Revises:
Create Date: 2025-01-01
"""

from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── TimescaleDB ──────────────────────────────────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")

    # ── Users ────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            email       TEXT        UNIQUE NOT NULL,
            name        TEXT,
            created_at  TIMESTAMPTZ DEFAULT now()
        );
    """)

    # ── Projects ─────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            name        TEXT        NOT NULL,
            api_key     TEXT        UNIQUE NOT NULL,
            owner_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
            created_at  TIMESTAMPTZ DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_projects_api_key ON projects(api_key);")

    # ── Events hypertable ────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS events (
            time        TIMESTAMPTZ NOT NULL,
            project_id  UUID        NOT NULL,
            trace_id    UUID,
            method      TEXT,
            route       TEXT,
            status_code SMALLINT,
            duration_ms INTEGER,
            user_id     TEXT,
            error_msg   TEXT
        );
    """)
    op.execute("""
        SELECT create_hypertable(
            'events', 'time',
            chunk_time_interval => INTERVAL '1 hour',
            if_not_exists => TRUE
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_project_time ON events(project_id, time DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_route ON events(project_id, route, time DESC);")

    # ── Spans (distributed tracing — populated from Phase 6) ─────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS spans (
            span_id      UUID        PRIMARY KEY,
            trace_id     UUID        NOT NULL,
            parent_id    UUID,
            project_id   UUID        NOT NULL,
            service_name TEXT,
            operation    TEXT,
            start_time   TIMESTAMPTZ,
            duration_ms  INTEGER,
            status_code  SMALLINT,
            tags         JSONB
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_spans_trace ON spans(trace_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_spans_project ON spans(project_id, start_time DESC);")

    # ── 1-minute continuous aggregate ────────────────────────────────────────
    op.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS events_1min
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket('1 minute', time)                                    AS bucket,
            project_id,
            route,
            method,
            COUNT(*)                                                          AS total_requests,
            AVG(duration_ms)::FLOAT                                          AS avg_latency,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms)        AS p99,
            SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END)              AS errors
        FROM events
        GROUP BY bucket, project_id, route, method
        WITH NO DATA;
    """)
    op.execute("""
        SELECT add_continuous_aggregate_policy(
            'events_1min',
            start_offset      => INTERVAL '1 hour',
            end_offset        => INTERVAL '1 minute',
            schedule_interval => INTERVAL '30 seconds',
            if_not_exists     => TRUE
        );
    """)

    # ── Incidents (AI anomaly detection — populated from Phase 5) ────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id  UUID        NOT NULL,
            severity    TEXT        NOT NULL DEFAULT 'warning',
            title       TEXT        NOT NULL,
            summary     TEXT        NOT NULL,
            endpoint    TEXT,
            metric      TEXT,
            z_score     FLOAT,
            resolved    BOOLEAN     DEFAULT FALSE,
            created_at  TIMESTAMPTZ DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_incidents_project ON incidents(project_id, created_at DESC);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS incidents;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS events_1min;")
    op.execute("DROP TABLE IF EXISTS spans;")
    op.execute("DROP TABLE IF EXISTS events;")
    op.execute("DROP TABLE IF EXISTS projects;")
    op.execute("DROP TABLE IF EXISTS users;")
