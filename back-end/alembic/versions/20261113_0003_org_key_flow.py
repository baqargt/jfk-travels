"""Org KEY FLOW: job titles, access profiles, customer links.

Revision ID: 20261113_0003
Revises: 20261027_0002
"""

import sqlalchemy as sa
from alembic import op

revision = "20261113_0003"
down_revision = "20261027_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "job_titles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.Column("code", sa.String(length=30), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "name", name="uq_job_title_company_name"),
    )
    op.create_index("ix_job_titles_company_id", "job_titles", ["company_id"])

    op.create_table(
        "access_profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=250), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("preset_key", sa.String(length=60), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "name", name="uq_access_profile_company_name"),
    )
    op.create_index("ix_access_profiles_company_id", "access_profiles", ["company_id"])

    op.create_table(
        "access_profile_permissions",
        sa.Column("access_profile_id", sa.Uuid(), nullable=False),
        sa.Column("permission_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["access_profile_id"], ["access_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("access_profile_id", "permission_id"),
    )

    op.add_column("users", sa.Column("job_title_id", sa.Uuid(), nullable=True))
    op.add_column("users", sa.Column("access_profile_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_users_job_title_id", "users", "job_titles", ["job_title_id"], ["id"], ondelete="SET NULL"
    )
    op.create_foreign_key(
        "fk_users_access_profile_id",
        "users",
        "access_profiles",
        ["access_profile_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("customers", sa.Column("pricing_model_id", sa.Uuid(), nullable=True))
    op.create_index("ix_customers_pricing_model_id", "customers", ["pricing_model_id"])
    op.create_foreign_key(
        "fk_customers_pricing_model_id",
        "customers",
        "pricing_models",
        ["pricing_model_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "customer_branches",
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("branch_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("customer_id", "branch_id"),
    )
    op.create_table(
        "customer_suppliers",
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("supplier_connection_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["supplier_connection_id"], ["supplier_connections.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("customer_id", "supplier_connection_id"),
    )


def downgrade() -> None:
    op.drop_table("customer_suppliers")
    op.drop_table("customer_branches")
    op.drop_constraint("fk_customers_pricing_model_id", "customers", type_="foreignkey")
    op.drop_index("ix_customers_pricing_model_id", table_name="customers")
    op.drop_column("customers", "pricing_model_id")
    op.drop_constraint("fk_users_access_profile_id", "users", type_="foreignkey")
    op.drop_constraint("fk_users_job_title_id", "users", type_="foreignkey")
    op.drop_column("users", "access_profile_id")
    op.drop_column("users", "job_title_id")
    op.drop_table("access_profile_permissions")
    op.drop_index("ix_access_profiles_company_id", table_name="access_profiles")
    op.drop_table("access_profiles")
    op.drop_index("ix_job_titles_company_id", table_name="job_titles")
    op.drop_table("job_titles")
