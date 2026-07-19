from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str
    category: str
    price: float
    original_price: float | None
    rating: float
    reviews: int
    format: list[str]
    image: str
    is_bestseller: bool
    is_new: bool
    discount: int
    description: str
    publisher: str
    language: str
    pages: int
    isbn: str
    publish_date: str
    dimensions: str
    moods: list[str]


class BookPageResponse(BaseModel):
    items: list[BookResponse]
    total: int
    page: int
    pages: int
    limit: int


class CategoryResponse(BaseModel):
    name: str
    count: int


class WishlistResponse(BaseModel):
    book_ids: list[int]


class CartCreateRequest(BaseModel):
    book_id: int
    format: str = Field(min_length=1, max_length=40)
    quantity: int = Field(default=1, ge=1, le=99)


class CartUpdateRequest(BaseModel):
    format: str = Field(min_length=1, max_length=40)
    quantity: int = Field(ge=0, le=99)


class CartItemResponse(BaseModel):
    book: BookResponse
    format: str
    quantity: int


class CartResponse(BaseModel):
    items: list[CartItemResponse]


class MoodRequest(BaseModel):

    mood: str = Field(
        default="",
        max_length=80
    )

    description: str = Field(
        default="",
        max_length=800
    )

    genre: str = Field(
        default="",
        max_length=100
    )

    reading_level: str = Field(
        default="",
        max_length=100
    )

    audience: str = Field(
        default="",
        max_length=100
    )

    topic: str = Field(
        default="",
        max_length=200
    )

    budget: str = Field(
        default="",
        max_length=100
    )

    favorite_books: str = Field(
        default="",
        max_length=200
    )

    fiction_type: str = Field(
        default="",
        max_length=50
    )

    length: str = Field(
        default="",
        max_length=50
    )

    limit: int = Field(
        default=4,
        ge=1,
        le=8
    )

    

class PersonalizedRecommendationRequest(BaseModel):
    request: str = Field(default="", max_length=1200)
    mood: str = Field(default="", max_length=80)
    limit: int = Field(default=8, ge=1, le=12)


class MoodRecommendation(BaseModel):
    book_id: int
    reason: str


class MoodResponse(BaseModel):
    source: Literal["openai", "local-fallback"]
    summary: str
    recommendations: list[MoodRecommendation]
    signals_used: list[str] = Field(default_factory=list)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: Literal["admin", "user"]
    favorite_genres: list[str]
    favorite_authors: list[str]
    bio: str
    avatar_url: str
    created_at: datetime


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: str
    password: str = Field(min_length=8, max_length=128)


    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if "@" not in cleaned or cleaned.startswith("@") or cleaned.endswith("@"):
            raise ValueError("Enter a valid email address.")
        return cleaned


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=128)


    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if "@" not in cleaned or cleaned.startswith("@") or cleaned.endswith("@"):
            raise ValueError("Enter a valid email address.")
        return cleaned


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    favorite_genres: list[str] = Field(default_factory=list, max_length=20)
    favorite_authors: list[str] = Field(default_factory=list, max_length=20)
    bio: str = Field(default="", max_length=1000)
    avatar_url: str = Field(default="", max_length=1500)

    @field_validator("favorite_genres", "favorite_authors")
    @classmethod
    def clean_preferences(cls, values: list[str]) -> list[str]:
        result: list[str] = []
        for value in values:
            cleaned = value.strip()
            if cleaned and cleaned.lower() not in {item.lower() for item in result}:
                result.append(cleaned[:120])
        return result


class RatingRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    review: str = Field(default="", max_length=2000)


class RatingResponse(BaseModel):
    book_id: int
    rating: int
    review: str
    updated_at: datetime


class HistoryBookItem(BaseModel):
    book: BookResponse
    occurred_at: datetime


class RatingHistoryItem(BaseModel):
    book: BookResponse
    rating: int
    review: str
    updated_at: datetime


class PurchaseItemResponse(BaseModel):
    book: BookResponse
    format: str
    quantity: int
    unit_price: float


class PurchaseResponse(BaseModel):
    id: int
    total_amount: float
    status: str
    created_at: datetime
    items: list[PurchaseItemResponse]


class ProfileHistoryResponse(BaseModel):
    recent_views: list[HistoryBookItem]
    ratings: list[RatingHistoryItem]
    purchases: list[PurchaseResponse]


class CheckoutResponse(BaseModel):
    purchase: PurchaseResponse
    cart: CartResponse


class DashboardMetric(BaseModel):
    label: str
    value: float | int


class DashboardBookStat(BaseModel):
    book_id: int
    title: str
    author: str
    count: int


class DashboardUserItem(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime


class DashboardResponse(BaseModel):
    metrics: list[DashboardMetric]
    top_viewed: list[DashboardBookStat]
    top_purchased: list[DashboardBookStat]
    recent_users: list[DashboardUserItem]
