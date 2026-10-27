"""Protect ledger and audit records from mutation.

Revision ID: 20261027_0002
Revises: 20261026_0001
"""

from alembic import op

revision = "20261027_0002"
down_revision = "20261026_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION reject_immutable_mutation()
        RETURNS trigger AS $$
        BEGIN
          RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    for table in ("ledger_entries", "audit_logs"):
        op.execute(
            f"""
            CREATE TRIGGER {table}_immutable
            BEFORE UPDATE OR DELETE ON {table}
            FOR EACH ROW EXECUTE FUNCTION reject_immutable_mutation();
            """
        )


def downgrade() -> None:
    for table in ("ledger_entries", "audit_logs"):
        op.execute(f"DROP TRIGGER IF EXISTS {table}_immutable ON {table};")
    op.execute("DROP FUNCTION IF EXISTS reject_immutable_mutation();")
