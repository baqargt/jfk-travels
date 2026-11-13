"""Super admin flag, nullable user company, company quotas.

Revision ID: 20261113_0004
Revises: 20261113_0003
"""

import sqlalchemy as sa
from alembic import op

revision = "20261113_0004"
down_revision = "20261113_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("max_sub_companies", sa.Integer(), nullable=False, server_default="5"),
    )
    op.add_column(
        "companies",
        sa.Column("max_users", sa.Integer(), nullable=False, server_default="50"),
    )
    op.add_column(
        "companies",
        sa.Column("max_travellers", sa.Integer(), nullable=False, server_default="500"),
    )

    op.add_column(
        "users",
        sa.Column("is_super_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index("ix_users_is_super_admin", "users", ["is_super_admin"])
    op.alter_column("users", "company_id", existing_type=sa.Uuid(), nullable=True)


def downgrade() -> None:
    op.execute("DELETE FROM users WHERE company_id IS NULL")
    op.alter_column("users", "company_id", existing_type=sa.Uuid(), nullable=False)
    op.drop_index("ix_users_is_super_admin", table_name="users")
    op.drop_column("users", "is_super_admin")
    op.drop_column("companies", "max_travellers")
    op.drop_column("companies", "max_users")
    op.drop_column("companies", "max_sub_companies")
