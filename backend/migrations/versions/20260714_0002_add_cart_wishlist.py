"""Add PostgreSQL cart and wishlist tables.

Revision ID: 20260714_0002
Revises: 20260714_0001
Create Date: 2026-07-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260714_0002"
down_revision: Union[str, None] = "20260714_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "wishlist_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.String(length=64), nullable=False),
        sa.Column("book_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("client_id", "book_id", name="uq_wishlist_client_book"),
    )
    op.create_index(
        op.f("ix_wishlist_items_book_id"),
        "wishlist_items",
        ["book_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_wishlist_items_client_id"),
        "wishlist_items",
        ["client_id"],
        unique=False,
    )

    op.create_table(
        "cart_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.String(length=64), nullable=False),
        sa.Column("book_id", sa.Integer(), nullable=False),
        sa.Column("selected_format", sa.String(length=40), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "client_id",
            "book_id",
            "selected_format",
            name="uq_cart_client_book_format",
        ),
    )
    op.create_index(
        op.f("ix_cart_items_book_id"),
        "cart_items",
        ["book_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_cart_items_client_id"),
        "cart_items",
        ["client_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_cart_items_client_id"), table_name="cart_items")
    op.drop_index(op.f("ix_cart_items_book_id"), table_name="cart_items")
    op.drop_table("cart_items")
    op.drop_index(op.f("ix_wishlist_items_client_id"), table_name="wishlist_items")
    op.drop_index(op.f("ix_wishlist_items_book_id"), table_name="wishlist_items")
    op.drop_table("wishlist_items")
