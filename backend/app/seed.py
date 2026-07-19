import os
from decimal import Decimal

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from .auth import hash_password
from .data import BOOKS
from .database import SessionLocal
from .db_models import Book, BookRating, BookView, Purchase, PurchaseItem, User


def seed_books(db: Session) -> int:
    existing = db.scalar(select(func.count(Book.id))) or 0
    if existing:
        return 0
    db.add_all([Book(**book) for book in BOOKS])
    db.commit()
    db.execute(
        text(
            "SELECT setval(pg_get_serial_sequence('books', 'id'), "
            "COALESCE(MAX(id), 1), true) FROM books"
        )
    )
    db.commit()
    return len(BOOKS)


def seed_users(db: Session) -> int:
    accounts = [
        {
            "full_name": "BookNest Administrator",
            "email": "admin@booknest.local",
            "password": os.getenv("SEED_ADMIN_PASSWORD", "Admin123!"),
            "role": "admin",
            "favorite_genres": ["Fiction", "Self-Help"],
            "favorite_authors": ["James Clear"],
        },
        {
            "full_name": "Demo Reader",
            "email": "reader@booknest.local",
            "password": os.getenv("SEED_USER_PASSWORD", "Reader123!"),
            "role": "user",
            "favorite_genres": ["Science Fiction", "Mystery"],
            "favorite_authors": ["Andy Weir", "Frank Herbert"],
        },
        {
            "full_name": "Similar Reader",
            "email": "similar@booknest.local",
            "password": os.getenv("SEED_USER_PASSWORD", "Reader123!"),
            "role": "user",
            "favorite_genres": ["Science Fiction", "Fiction"],
            "favorite_authors": ["Andy Weir"],
        },
    ]
    inserted = 0
    for account in accounts:
        exists = db.scalar(select(User).where(func.lower(User.email) == account["email"]))
        if exists:
            continue
        db.add(
            User(
                full_name=account["full_name"],
                email=account["email"],
                password_hash=hash_password(account["password"]),
                role=account["role"],
                favorite_genres=account["favorite_genres"],
                favorite_authors=account["favorite_authors"],
                bio="Demo account for the BookNest recommendation system.",
                avatar_url="",
            )
        )
        inserted += 1
    db.commit()
    return inserted


def seed_activity(db: Session) -> int:
    reader = db.scalar(select(User).where(User.email == "reader@booknest.local"))
    similar = db.scalar(select(User).where(User.email == "similar@booknest.local"))
    if not reader or not similar or not db.get(Book, 1):
        return 0
    existing = db.scalar(select(func.count(BookRating.id))) or 0
    if existing:
        return 0

    db.add_all(
        [
            BookView(user_id=reader.id, book_id=3),
            BookView(user_id=reader.id, book_id=5),
            BookView(user_id=reader.id, book_id=6),
            BookRating(user_id=reader.id, book_id=3, rating=5, review="I loved the science and adventure."),
            BookRating(user_id=reader.id, book_id=6, rating=4, review="A thoughtful and immersive read."),
            BookRating(user_id=similar.id, book_id=3, rating=5, review="Excellent."),
            BookRating(user_id=similar.id, book_id=6, rating=5, review="A favorite."),
            BookRating(user_id=similar.id, book_id=8, rating=5, review="Highly recommended."),
        ]
    )
    purchase = Purchase(user_id=reader.id, total_amount=Decimal("49.97"), status="completed")
    purchase.items.extend(
        [
            PurchaseItem(book_id=3, selected_format="Paperback", quantity=1, unit_price=Decimal("19.54")),
            PurchaseItem(book_id=6, selected_format="Paperback", quantity=1, unit_price=Decimal("19.99")),
        ]
    )
    db.add(purchase)
    db.commit()
    return 1


def main() -> None:
    with SessionLocal() as db:
        books = seed_books(db)
        users = seed_users(db)
        activity = seed_activity(db)
        print(f"Books inserted: {books}; users inserted: {users}; demo activity inserted: {activity}.")
        print("Admin login: admin@booknest.local / Admin123!")
        print("User login: reader@booknest.local / Reader123!")


if __name__ == "__main__":
    main()
