"""Create PostgreSQL books table.

Revision ID: 20260714_0001
Revises:
Create Date: 2026-07-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260714_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "books",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("author", sa.String(length=180), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("original_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("rating", sa.Float(), nullable=False),
        sa.Column("reviews", sa.Integer(), nullable=False),
        sa.Column("formats", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("image", sa.Text(), nullable=False),
        sa.Column("is_bestseller", sa.Boolean(), nullable=False),
        sa.Column("is_new", sa.Boolean(), nullable=False),
        sa.Column("discount", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("publisher", sa.String(length=180), nullable=False),
        sa.Column("language", sa.String(length=80), nullable=False),
        sa.Column("pages", sa.Integer(), nullable=False),
        sa.Column("isbn", sa.String(length=32), nullable=False),
        sa.Column("publish_date", sa.String(length=80), nullable=False),
        sa.Column("dimensions", sa.String(length=120), nullable=False),
        sa.Column("moods", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("isbn"),
    )
    op.create_index(op.f("ix_books_author"), "books", ["author"], unique=False)
    op.create_index(op.f("ix_books_category"), "books", ["category"], unique=False)
    op.create_index(op.f("ix_books_is_bestseller"), "books", ["is_bestseller"], unique=False)
    op.create_index(op.f("ix_books_is_new"), "books", ["is_new"], unique=False)
    op.create_index(op.f("ix_books_title"), "books", ["title"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_books_title"), table_name="books")
    op.drop_index(op.f("ix_books_is_new"), table_name="books")
    op.drop_index(op.f("ix_books_is_bestseller"), table_name="books")
    op.drop_index(op.f("ix_books_category"), table_name="books")
    op.drop_index(op.f("ix_books_author"), table_name="books")
    op.drop_table("books")
