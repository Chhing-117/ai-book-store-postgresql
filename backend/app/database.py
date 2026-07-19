import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()


def _normalize_database_url(url: str) -> str:
    """Use psycopg 3 even when a provider supplies a generic Postgres URL."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


raw_database_url = os.getenv("DATABASE_URL", "").strip()
if not raw_database_url:
    raise RuntimeError(
        "DATABASE_URL is not configured. Copy backend/.env.example to backend/.env "
        "and add your PostgreSQL connection URL."
    )

DATABASE_URL = _normalize_database_url(raw_database_url)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
