import json
import os
import re
import google.generativeai as genai

from .config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel(
    "gemini-2.0-flash"
)
from collections import Counter
from typing import Any

def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, flags=re.DOTALL)
    if fenced:
        cleaned = fenced.group(1)
    else:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())

def _extract_budget(text: str) -> float | None:
    """
    Extract budget only from budget phrases.

    Examples:
    under 18$
    below $20
    less than 15 dollars
    budget 25
    """
    if not text:
        return None

    text = text.lower()

    patterns = [
        r"(?:under|below|less than|max|maximum|budget)\s*\$?\s*(\d+(?:\.\d+)?)",
        r"\$\s*(\d+(?:\.\d+)?)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return float(match.group(1))

    return None

def _filter_books_by_budget(
    books: list[dict[str, Any]],
    budget_text: str,
) -> tuple[list[dict[str, Any]], float | None]:

    budget = _extract_budget(budget_text)

    if budget is None:
        return books, None

    matched = [
        book
        for book in books
        if float(book.get("price", 0)) <= budget
    ]

    # If no exact match:
    # return all books but tell AI it is closest match
    if not matched:
        closest = sorted(
            books,
            key=lambda b: abs(float(b.get("price", 0)) - budget)
        )

        return closest[:10], budget

    return matched, budget

def _local_mood_recommendations(
    mood: str,
    description: str,
    limit: int,
    books: list[dict[str, Any]],
) -> dict[str, Any]:
    combined = _normalize(f"{mood} {description}")
    aliases = {
        "happy": ["happy", "joy", "good", "cheerful", "fun"],
        "romantic": ["romantic", "love", "date", "heart"],
        "adventurous": ["adventure", "adventurous", "excited", "escape"],
        "curious": ["curious", "learn", "mystery", "discover", "interesting"],
        "motivated": ["motivated", "productive", "improve", "discipline", "success"],
        "relaxed": ["relaxed", "calm", "peaceful", "cozy", "light"],
        "sad": ["sad", "down", "lonely", "heartbroken", "tired"],
        "energized": ["energized", "energy", "active", "powerful"],
        "reflective": ["reflective", "thinking", "meaning", "life", "deep"],
        "hopeful": ["hopeful", "hope", "healing", "better"],
        "focused": ["focused", "focus", "work", "study"],
        "emotional": ["emotional", "cry", "feelings"],
        "inspired": ["inspired", "inspiration", "creative", "create"],
    }
    detected = {key for key, words in aliases.items() if any(word in combined for word in words)}
    if mood:
        detected.add(mood.lower())

    scored: list[tuple[float, dict[str, Any], list[str]]] = []
    for book in books:
        reasons: list[str] = []
        score = 0.0
        matching_moods = [tag for tag in book.get("moods", []) if tag.lower() in detected]
        if matching_moods:
            score += len(matching_moods) * 4
            reasons.append(f"matches your {', '.join(matching_moods)} mood")
        searchable = _normalize(
            f"{book['title']} {book['author']} {book['category']} {book['description']} {' '.join(book.get('moods', []))}"
        )
        words = {word for word in re.findall(r"[a-z0-9-]+", combined) if len(word) > 2}
        overlap = sum(1 for word in words if word in searchable)
        if overlap:
            score += min(6, overlap * 1.2)
            reasons.append("fits the words you used")
        score += float(book.get("rating", 0)) / 2
        scored.append((score, book, reasons))

    scored.sort(
        key=lambda row: (row[0], row[1].get("rating", 0), row[1].get("reviews", 0)),
        reverse=True,
    )
    recommendations = []
    for _, book, reasons in scored[:limit]:
        reason = "; ".join(reasons[:2]) or f"a highly rated {book['category'].lower()} choice"
        recommendations.append({"book_id": book["id"], "reason": reason.capitalize() + "."})

    label = mood.strip() or "current"
    return {
        "source": "local-fallback",
        "summary": f"Here are thoughtful picks for your {label} mood.",
        "recommendations": recommendations,
        "signals_used": ["mood", "reader description", "catalog ratings"],
    }


def _profile_signals(profile: dict[str, Any]) -> list[str]:
    signals: list[str] = []
    if profile.get("favorite_genres"):
        signals.append("favorite genres")
    if profile.get("favorite_authors"):
        signals.append("favorite authors")
    if profile.get("viewed_books"):
        signals.append("recently viewed books")
    if profile.get("purchased_books"):
        signals.append("purchase history")
    if profile.get("ratings"):
        signals.append("ratings and reading history")
    if profile.get("similar_reader_book_ids"):
        signals.append("similar readers' choices")
    return signals


def _local_personalized_recommendations(
    request_text: str,
    mood: str,
    limit: int,
    books: list[dict[str, Any]],
    profile: dict[str, Any],
) -> dict[str, Any]:
    query = _normalize(f"{request_text} {mood}")
    words = {word for word in re.findall(r"[a-z0-9-]+", query) if len(word) > 2}
    favorite_genres = {_normalize(value) for value in profile.get("favorite_genres", [])}
    favorite_authors = {_normalize(value) for value in profile.get("favorite_authors", [])}
    viewed = profile.get("viewed_books", [])
    purchased = profile.get("purchased_books", [])
    ratings = profile.get("ratings", [])
    similar_ids = set(profile.get("similar_reader_book_ids", []))

    viewed_genres = Counter(_normalize(item["category"]) for item in viewed)
    viewed_authors = Counter(_normalize(item["author"]) for item in viewed)
    purchased_genres = Counter(_normalize(item["category"]) for item in purchased)
    purchased_authors = Counter(_normalize(item["author"]) for item in purchased)
    positive_genres = Counter(
        _normalize(item["category"]) for item in ratings if int(item.get("rating", 0)) >= 4
    )
    positive_authors = Counter(
        _normalize(item["author"]) for item in ratings if int(item.get("rating", 0)) >= 4
    )
    purchased_ids = {int(item["id"]) for item in purchased}

    scored: list[tuple[float, dict[str, Any], list[str]]] = []
    for book in books:
        score = float(book.get("rating", 0)) * 0.65
        reasons: list[str] = []
        category = _normalize(book["category"])
        author = _normalize(book["author"])
        searchable = _normalize(
            f"{book['title']} {book['author']} {book['category']} {book['description']} {' '.join(book.get('moods', []))}"
        )

        overlap = sum(1 for word in words if word in searchable)
        if overlap:
            score += min(9, overlap * 1.7)
            reasons.append("matches what you asked to read")
        if category in favorite_genres:
            score += 6
            reasons.append(f"matches your favorite genre, {book['category']}")
        if author in favorite_authors:
            score += 7
            reasons.append(f"you marked {book['author']} as a favorite author")
        if viewed_genres[category]:
            score += min(4, viewed_genres[category] * 0.9)
            reasons.append("similar to books you recently viewed")
        if viewed_authors[author]:
            score += min(4, viewed_authors[author] * 1.2)
        if purchased_genres[category]:
            score += min(5, purchased_genres[category] * 1.3)
            reasons.append("fits your purchase history")
        if purchased_authors[author]:
            score += min(5, purchased_authors[author] * 1.5)
        if positive_genres[category] or positive_authors[author]:
            score += min(6, positive_genres[category] * 1.2 + positive_authors[author] * 1.5)
            reasons.append("aligns with books you rated highly")
        if int(book["id"]) in similar_ids:
            score += 6
            reasons.append("popular with readers who have similar tastes")
        if int(book["id"]) in purchased_ids:
            score -= 10

        scored.append((score, book, reasons))

    scored.sort(
        key=lambda row: (row[0], row[1].get("rating", 0), row[1].get("reviews", 0)),
        reverse=True,
    )
    selected = scored[:limit]
    recommendations = []
    for _, book, reasons in selected:
        unique_reasons = list(dict.fromkeys(reasons))
        reason = "; ".join(unique_reasons[:2])
        if not reason:
            reason = f"A highly rated {book['category'].lower()} book worth exploring"
        recommendations.append({"book_id": book["id"], "reason": reason.capitalize() + "."})

    signals = _profile_signals(profile)
    if request_text.strip() or mood.strip():
        signals.insert(0, "your reading request")
    if not signals:
        signals = ["catalog ratings and popularity"]
    return {
        "source": "local-fallback",
        "summary": "These recommendations combine your profile, reading activity, and the kind of book you described.",
        "recommendations": recommendations,
        "signals_used": signals,
    }


def _run_gemini(
    *,
    prompt: str,
    books: list[dict[str, Any]],
    limit: int,
    fallback: dict[str, Any],
    signals: list[str],
) -> dict[str, Any]:

    if not GEMINI_API_KEY:
        return fallback

    try:
        response = model.generate_content(prompt)

        text = response.text

        parsed = _extract_json(text)

        valid_ids = {int(book["id"]) for book in books}

        seen = set()
        recommendations = []

        for item in parsed.get("recommendations", []):

            book_id = int(item.get("book_id"))

            if book_id in valid_ids and book_id not in seen:
                seen.add(book_id)

                recommendations.append({
                    "book_id": book_id,
                    "reason": str(
                        item.get(
                            "reason",
                            "Recommended for your preferences."
                        )
                    )[:300]
                })

            if len(recommendations) >= limit:
                break


        if not recommendations:
            raise ValueError(
                "Gemini returned no valid books"
            )


        return {
            "source": "gemini",
            "summary": str(
                parsed.get(
                    "summary",
                    "Here are your recommendations."
                )
            )[:350],
            "recommendations": recommendations,
            "signals_used": signals,
        }


    except Exception as error:

        print("===== GEMINI ERROR =====")
        print(error)
        print("========================")

        return fallback


def get_ai_book_recommendations(
    request_text: str,
    mood: str,
    limit: int,
    books: list[dict[str, Any]],
    profile: dict[str, Any] | None = None,
) -> dict[str, Any]:

    if not books:
        raise ValueError("The PostgreSQL book catalog is empty.")

    if profile is None:
        profile = {}


    # -----------------------------
    # Budget filtering
    # -----------------------------

    filtered_books, budget = _filter_books_by_budget(
        books,
        request_text
    )


    # If no books match budget
    closest_match = False

    if budget and not filtered_books:
        filtered_books = sorted(
            books,
            key=lambda b: abs(
                float(b["price"]) - budget
            )
        )[:10]

        closest_match = True


    # -----------------------------
    # Local recommendation fallback
    # -----------------------------

    fallback = _local_personalized_recommendations(
        request_text,
        mood,
        limit,
        filtered_books,
        profile,
    )


    # -----------------------------
    # AI catalog
    # -----------------------------

    catalog = [
        {
            "id": book["id"],
            "title": book["title"],
            "author": book["author"],
            "category": book["category"],
            "price": float(book["price"]),
            "rating": book.get("rating",0),
            "description": book["description"][:400],
            "moods": book.get("moods",[])
        }
        for book in filtered_books
    ]


    prompt = f"""

You are BookNest AI Recommendation Assistant.

User request:
{request_text}

User mood:
{mood}


Catalog:
{json.dumps(catalog,ensure_ascii=False)}


Rules:

1. Recommend ONLY books from catalog.
2. Never invent books.
3. Never modify price.
4. Never modify rating.
5. Return 3-{limit} books.

"""

    if budget:
        prompt += f"""

IMPORTANT:
User budget is ${budget}.

Every recommended book must:
price <= ${budget}

"""


    if closest_match:

        prompt += """

No exact budget match exists.
Explain why these books are closest matches.
"""


    return _run_gemini(
        prompt=prompt,
        books=filtered_books,
        limit=limit,
        fallback=fallback,
        signals=fallback["signals_used"],
    )