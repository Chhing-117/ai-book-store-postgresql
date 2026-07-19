import math
import os
import re
from collections import Counter
from decimal import Decimal
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import delete, desc, distinct, func, or_, select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from .ai import get_ai_book_recommendations
from .auth import (
    create_session,
    get_current_token,
    get_current_user,
    get_optional_user,
    hash_password,
    require_admin,
    revoke_session,
    verify_password,
)
from .database import get_db
from .db_models import (
    Book,
    BookRating,
    BookView,
    CartItem,
    Purchase,
    PurchaseItem,
    RecommendationLog,
    User,
    WishlistItem,
)
from .models import (
    AuthResponse,
    BookPageResponse,
    BookResponse,
    CartCreateRequest,
    CartResponse,
    CartUpdateRequest,
    CategoryResponse,
    CheckoutResponse,
    DashboardResponse,
    LoginRequest,
    MoodRequest,
    MoodResponse,
    PersonalizedRecommendationRequest,
    ProfileHistoryResponse,
    ProfileUpdateRequest,
    PurchaseResponse,
    RatingRequest,
    RatingResponse,
    RegisterRequest,
    UserResponse,
    WishlistResponse,
)

load_dotenv()

app = FastAPI(
    title="BookNest API",
    description="PostgreSQL bookstore with accounts, admin roles, reading history, and AI recommendations.",
    version="3.0.0",
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLIENT_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


def get_client_id(
    x_client_id: Annotated[str | None, Header(alias="X-Client-ID")] = None,
) -> str:
    if not x_client_id or not CLIENT_ID_PATTERN.fullmatch(x_client_id):
        raise HTTPException(status_code=400, detail="A valid X-Client-ID header is required.")
    return x_client_id


def cart_item_payload(item: CartItem) -> dict:
    return {
        "book": BookResponse.model_validate(item.book).model_dump(),
        "format": item.selected_format,
        "quantity": item.quantity,
    }


def purchase_payload(purchase: Purchase) -> dict:
    return {
        "id": purchase.id,
        "total_amount": float(purchase.total_amount),
        "status": purchase.status,
        "created_at": purchase.created_at,
        "items": [
            {
                "book": BookResponse.model_validate(item.book).model_dump(),
                "format": item.selected_format,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
            }
            for item in purchase.items
        ],
    }


def book_brief(book: Book, rating: int | None = None) -> dict:
    data = {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "category": book.category,
    }
    if rating is not None:
        data["rating"] = rating
    return data


def similar_reader_choices(db: Session, user: User) -> list[int]:
    positively_rated = set(
        db.scalars(
            select(BookRating.book_id).where(
                BookRating.user_id == user.id,
                BookRating.rating >= 4,
            )
        ).all()
    )
    purchased = set(
        db.scalars(
            select(PurchaseItem.book_id)
            .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
            .where(Purchase.user_id == user.id)
        ).all()
    )
    liked_ids = positively_rated | purchased
    if not liked_ids:
        return []

    peer_ids = set(
        db.scalars(
            select(distinct(BookRating.user_id)).where(
                BookRating.book_id.in_(liked_ids),
                BookRating.rating >= 4,
                BookRating.user_id != user.id,
            )
        ).all()
    )
    if not peer_ids:
        return []

    candidate_counts: Counter[int] = Counter()
    for book_id in db.scalars(
        select(BookRating.book_id).where(
            BookRating.user_id.in_(peer_ids),
            BookRating.rating >= 4,
            BookRating.book_id.notin_(liked_ids),
        )
    ).all():
        candidate_counts[int(book_id)] += 2

    for book_id in db.scalars(
        select(PurchaseItem.book_id)
        .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
        .where(
            Purchase.user_id.in_(peer_ids),
            PurchaseItem.book_id.notin_(liked_ids),
        )
    ).all():
        candidate_counts[int(book_id)] += 1

    return [book_id for book_id, _ in candidate_counts.most_common(20)]


def recommendation_profile(db: Session, user: User) -> dict:
    views = db.scalars(
        select(BookView)
        .where(BookView.user_id == user.id)
        .order_by(BookView.viewed_at.desc())
        .limit(30)
    ).unique().all()
    ratings = db.scalars(
        select(BookRating)
        .where(BookRating.user_id == user.id)
        .order_by(BookRating.updated_at.desc())
        .limit(30)
    ).unique().all()
    purchase_items = db.scalars(
        select(PurchaseItem)
        .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
        .where(Purchase.user_id == user.id)
        .order_by(Purchase.created_at.desc())
        .limit(40)
    ).unique().all()

    return {
        "favorite_genres": user.favorite_genres,
        "favorite_authors": user.favorite_authors,
        "viewed_books": [book_brief(item.book) for item in views],
        "purchased_books": [book_brief(item.book) for item in purchase_items],
        "ratings": [book_brief(item.book, item.rating) for item in ratings],
        "similar_reader_book_ids": similar_reader_choices(db, user),
    }


@app.get("/")
def root():
    return {"name": "BookNest API", "database": "PostgreSQL", "docs": "/docs"}


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "database": "disconnected",
                "ai_configured": bool(
                    OPENAI_API_KEY or GEMINI_API_KEY
                ),
            },
        )
    return {
        "status": "ok",
        "database": "connected",
        "ai_configured": bool(
            OPENAI_API_KEY or GEMINI_API_KEY
        ),
    }


# Authentication and profile
@app.post("/api/auth/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if db.scalar(select(User.id).where(func.lower(User.email) == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(
        full_name=payload.full_name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role="user",
        favorite_genres=[],
        favorite_authors=[],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_session(db, user), "user": user}


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower().strip()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return {"token": create_session(db, user), "user": user}


@app.post("/api/auth/logout", status_code=204)
def logout(
    token: str = Depends(get_current_token),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    revoke_session(db, token)
    return Response(status_code=204)


@app.get("/api/auth/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user


@app.put("/api/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.full_name = payload.full_name.strip()
    user.favorite_genres = payload.favorite_genres
    user.favorite_authors = payload.favorite_authors
    user.bio = payload.bio.strip()
    user.avatar_url = payload.avatar_url.strip()
    db.commit()
    db.refresh(user)
    return user


@app.get("/api/profile/history", response_model=ProfileHistoryResponse)
def profile_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    views = db.scalars(
        select(BookView)
        .where(BookView.user_id == user.id)
        .order_by(BookView.viewed_at.desc())
        .limit(20)
    ).unique().all()
    ratings = db.scalars(
        select(BookRating)
        .where(BookRating.user_id == user.id)
        .order_by(BookRating.updated_at.desc())
        .limit(20)
    ).unique().all()
    purchases = db.scalars(
        select(Purchase)
        .where(Purchase.user_id == user.id)
        .order_by(Purchase.created_at.desc())
        .limit(20)
    ).unique().all()
    return {
        "recent_views": [
            {"book": BookResponse.model_validate(item.book).model_dump(), "occurred_at": item.viewed_at}
            for item in views
        ],
        "ratings": [
            {
                "book": BookResponse.model_validate(item.book).model_dump(),
                "rating": item.rating,
                "review": item.review,
                "updated_at": item.updated_at,
            }
            for item in ratings
        ],
        "purchases": [purchase_payload(item) for item in purchases],
    }


# Catalog
@app.get("/api/categories", response_model=list[CategoryResponse])
def categories(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Book.category, func.count(Book.id)).group_by(Book.category).order_by(Book.category.asc())
    ).all()
    return [{"name": name, "count": count} for name, count in rows]


@app.get("/api/books", response_model=BookPageResponse)
def list_books(
    q: str = "",
    category: list[str] = Query(default=[]),
    format: list[str] = Query(default=[]),
    max_price: float = Query(default=50, ge=0, le=500),
    min_rating: float = Query(default=0, ge=0, le=5),
    sort: str = Query(default="popular"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    filters = [Book.price <= max_price, Book.rating >= min_rating]
    search = q.strip()
    if search:
        pattern = f"%{search}%"
        filters.append(
            or_(
                Book.title.ilike(pattern),
                Book.author.ilike(pattern),
                Book.category.ilike(pattern),
                Book.description.ilike(pattern),
            )
        )
    if category:
        filters.append(func.lower(Book.category).in_([value.lower() for value in category]))
    if format:
        filters.append(or_(*(Book.format.contains([value]) for value in format)))

    total = db.scalar(select(func.count(Book.id)).where(*filters)) or 0
    pages = max(1, math.ceil(total / limit))
    if page > pages and total:
        page = pages
    order_by = {
        "popular": (Book.reviews.desc(), Book.rating.desc()),
        "newest": (Book.is_new.desc(), Book.id.desc()),
        "price-asc": (Book.price.asc(), Book.id.asc()),
        "price-desc": (Book.price.desc(), Book.id.desc()),
        "rating": (Book.rating.desc(), Book.reviews.desc()),
    }.get(sort, (Book.reviews.desc(), Book.rating.desc()))
    items = db.scalars(
        select(Book).where(*filters).order_by(*order_by).offset((page - 1) * limit).limit(limit)
    ).all()
    return {"items": items, "total": total, "page": page, "pages": pages, "limit": limit}


@app.get("/api/books/{book_id}", response_model=BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@app.post("/api/history/views/{book_id}", status_code=204)
def track_book_view(
    book_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.get(Book, book_id):
        raise HTTPException(status_code=404, detail="Book not found")
    db.add(BookView(user_id=user.id, book_id=book_id))
    db.commit()
    return Response(status_code=204)


@app.put("/api/ratings/{book_id}", response_model=RatingResponse)
def rate_book(
    book_id: int,
    payload: RatingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.get(Book, book_id):
        raise HTTPException(status_code=404, detail="Book not found")
    rating = db.scalar(
        select(BookRating).where(BookRating.user_id == user.id, BookRating.book_id == book_id)
    )
    if rating:
        rating.rating = payload.rating
        rating.review = payload.review.strip()
    else:
        rating = BookRating(
            user_id=user.id,
            book_id=book_id,
            rating=payload.rating,
            review=payload.review.strip(),
        )
        db.add(rating)
    db.commit()
    db.refresh(rating)
    return {
        "book_id": rating.book_id,
        "rating": rating.rating,
        "review": rating.review,
        "updated_at": rating.updated_at,
    }


# Wishlist and cart
@app.get("/api/wishlist", response_model=WishlistResponse)
def get_wishlist(client_id: str = Depends(get_client_id), db: Session = Depends(get_db)):
    ids = db.scalars(
        select(WishlistItem.book_id)
        .where(WishlistItem.client_id == client_id)
        .order_by(WishlistItem.created_at.desc())
    ).all()
    return {"book_ids": list(ids)}


@app.put("/api/wishlist/{book_id}", response_model=WishlistResponse)
def add_to_wishlist(
    book_id: int,
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    if not db.get(Book, book_id):
        raise HTTPException(status_code=404, detail="Book not found")
    exists = db.scalar(
        select(WishlistItem.id).where(
            WishlistItem.client_id == client_id,
            WishlistItem.book_id == book_id,
        )
    )
    if not exists:
        db.add(WishlistItem(client_id=client_id, book_id=book_id))
        db.commit()
    return get_wishlist(client_id, db)


@app.delete("/api/wishlist/{book_id}", response_model=WishlistResponse)
def remove_from_wishlist(
    book_id: int,
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    db.execute(
        delete(WishlistItem).where(
            WishlistItem.client_id == client_id,
            WishlistItem.book_id == book_id,
        )
    )
    db.commit()
    return get_wishlist(client_id, db)


@app.get("/api/cart", response_model=CartResponse)
def get_cart(client_id: str = Depends(get_client_id), db: Session = Depends(get_db)):
    items = db.scalars(
        select(CartItem).where(CartItem.client_id == client_id).order_by(CartItem.created_at.asc())
    ).unique().all()
    return {"items": [cart_item_payload(item) for item in items]}


@app.post("/api/cart", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    payload: CartCreateRequest,
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    book = db.get(Book, payload.book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if payload.format not in book.format:
        raise HTTPException(status_code=422, detail="Selected format is not available for this book")
    item = db.scalar(
        select(CartItem).where(
            CartItem.client_id == client_id,
            CartItem.book_id == payload.book_id,
            CartItem.selected_format == payload.format,
        )
    )
    if item:
        item.quantity = min(99, item.quantity + payload.quantity)
    else:
        db.add(
            CartItem(
                client_id=client_id,
                book_id=payload.book_id,
                selected_format=payload.format,
                quantity=payload.quantity,
            )
        )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not update cart") from None
    return get_cart(client_id, db)


@app.patch("/api/cart/{book_id}", response_model=CartResponse)
def update_cart_item(
    book_id: int,
    payload: CartUpdateRequest,
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    item = db.scalar(
        select(CartItem).where(
            CartItem.client_id == client_id,
            CartItem.book_id == book_id,
            CartItem.selected_format == payload.format,
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if payload.quantity == 0:
        db.delete(item)
    else:
        item.quantity = payload.quantity
    db.commit()
    return get_cart(client_id, db)


@app.delete("/api/cart/{book_id}", response_model=CartResponse)
def remove_cart_item(
    book_id: int,
    format: str = Query(..., min_length=1, max_length=40),
    client_id: str = Depends(get_client_id),
    db: Session = Depends(get_db),
):
    db.execute(
        delete(CartItem).where(
            CartItem.client_id == client_id,
            CartItem.book_id == book_id,
            CartItem.selected_format == format,
        )
    )
    db.commit()
    return get_cart(client_id, db)


@app.delete("/api/cart", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(client_id: str = Depends(get_client_id), db: Session = Depends(get_db)):
    db.execute(delete(CartItem).where(CartItem.client_id == client_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/orders/checkout", response_model=CheckoutResponse, status_code=201)
def checkout(
    client_id: str = Depends(get_client_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart_items = db.scalars(
        select(CartItem).where(CartItem.client_id == client_id).order_by(CartItem.created_at.asc())
    ).unique().all()
    if not cart_items:
        raise HTTPException(status_code=422, detail="Your cart is empty.")

    subtotal = sum((item.book.price * item.quantity for item in cart_items), Decimal("0.00"))
    shipping = Decimal("0.00") if subtotal >= Decimal("50.00") else Decimal("6.99")
    tax = (subtotal * Decimal("0.075")).quantize(Decimal("0.01"))
    purchase = Purchase(
        user_id=user.id,
        total_amount=(subtotal + shipping + tax).quantize(Decimal("0.01")),
        status="completed",
    )
    for item in cart_items:
        purchase.items.append(
            PurchaseItem(
                book_id=item.book_id,
                selected_format=item.selected_format,
                quantity=item.quantity,
                unit_price=item.book.price,
            )
        )
    db.add(purchase)
    db.flush()
    db.execute(delete(CartItem).where(CartItem.client_id == client_id))
    db.commit()
    db.refresh(purchase)
    return {"purchase": purchase_payload(purchase), "cart": {"items": []}}


# AI recommendations
@app.post("/api/ai/mood", response_model=MoodResponse)
def mood_recommendations(payload: MoodRequest, db: Session = Depends(get_db)):
    user_request = " ".join(
        [
            payload.mood,
            payload.description,
            payload.genre,
            payload.reading_level,
            payload.audience,
            payload.topic,
            payload.budget,
            payload.favorite_books,
            payload.fiction_type,
            payload.length,
        ]
    ).strip()


    if not user_request:
        raise HTTPException(
            status_code=422,
            detail="Please answer at least one question."
    )
    database_books = db.scalars(select(Book).order_by(Book.id.asc())).all()
    if not database_books:
        raise HTTPException(status_code=503, detail="The PostgreSQL catalog is empty. Run: python -m app.seed")
    catalog = [BookResponse.model_validate(book).model_dump() for book in database_books]
    profile = {
        "genre": payload.genre,
        "reading_level": payload.reading_level,
        "audience": payload.audience,
        "topic": payload.topic,
        "budget": payload.budget,
        "favorite_books": payload.favorite_books,
        "fiction_type": payload.fiction_type,
        "length": payload.length,
    }
    return get_ai_book_recommendations(
        user_request,
        payload.mood,
        payload.limit,
        catalog,
        profile,
    )


@app.post("/api/ai/recommendations", response_model=MoodResponse)
def personalized_recommendations(
    payload: PersonalizedRecommendationRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    books = db.scalars(select(Book).order_by(Book.id.asc())).all()
    if not books:
        raise HTTPException(status_code=503, detail="The PostgreSQL catalog is empty.")
    catalog = [BookResponse.model_validate(book).model_dump() for book in books]
    result = get_ai_book_recommendations(
        payload.request,
        payload.mood,
        payload.limit,
        catalog,
        recommendation_profile(db, user),
    )
    db.add(
        RecommendationLog(
            user_id=user.id,
            request_text=f"{payload.mood} {payload.request}".strip(),
            source=result["source"],
            recommended_book_ids=[item["book_id"] for item in result["recommendations"]],
        )
    )
    db.commit()
    return result


# Admin dashboard
@app.get("/api/admin/dashboard", response_model=DashboardResponse)
def admin_dashboard(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    revenue = db.scalar(select(func.coalesce(func.sum(Purchase.total_amount), 0))) or 0
    metrics = [
        {"label": "Users", "value": db.scalar(select(func.count(User.id))) or 0},
        {"label": "Books", "value": db.scalar(select(func.count(Book.id))) or 0},
        {"label": "Orders", "value": db.scalar(select(func.count(Purchase.id))) or 0},
        {"label": "Revenue", "value": float(revenue)},
        {"label": "Book Views", "value": db.scalar(select(func.count(BookView.id))) or 0},
        {"label": "Ratings", "value": db.scalar(select(func.count(BookRating.id))) or 0},
        {
            "label": "AI Requests",
            "value": db.scalar(select(func.count(RecommendationLog.id))) or 0,
        },
    ]
    top_viewed_rows = db.execute(
        select(Book.id, Book.title, Book.author, func.count(BookView.id).label("count"))
        .join(BookView, BookView.book_id == Book.id)
        .group_by(Book.id)
        .order_by(desc("count"))
        .limit(5)
    ).all()
    top_purchased_rows = db.execute(
        select(Book.id, Book.title, Book.author, func.sum(PurchaseItem.quantity).label("count"))
        .join(PurchaseItem, PurchaseItem.book_id == Book.id)
        .group_by(Book.id)
        .order_by(desc("count"))
        .limit(5)
    ).all()
    users = db.scalars(select(User).order_by(User.created_at.desc()).limit(8)).all()
    return {
        "metrics": metrics,
        "top_viewed": [
            {"book_id": row.id, "title": row.title, "author": row.author, "count": int(row.count)}
            for row in top_viewed_rows
        ],
        "top_purchased": [
            {"book_id": row.id, "title": row.title, "author": row.author, "count": int(row.count)}
            for row in top_purchased_rows
        ],
        "recent_users": users,
    }
