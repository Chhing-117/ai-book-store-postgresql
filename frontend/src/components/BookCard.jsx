import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import RatingStars from "./RatingStars";

export default function BookCard({ book, reason }) {
  const { wishlistIds, toggleWishlist, addToCart } = useStore();
  const wished = wishlistIds.includes(book.id);

  return (
    <article className="group overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        <Link to={`/books/${book.id}`} aria-label={`View ${book.title}`}>
          <img
            src={book.image}
            alt={book.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            onError={(event) => {
              event.currentTarget.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=900&q=80";
            }}
          />
        </Link>
        <button
          type="button"
          onClick={() => toggleWishlist(book.id)}
          className={`absolute left-3 top-3 grid size-9 place-items-center rounded-lg border bg-white/95 shadow-sm transition ${
            wished ? "border-rose-200 text-rose-500" : "border-white text-stone-500 hover:text-rose-500"
          }`}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={17} className={wished ? "fill-current" : ""} />
        </button>
        {book.discount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">
            -{book.discount}%
          </span>
        )}
      </div>

      <div className="p-4">
        <Link to={`/books/${book.id}`} className="block">
          <h3 className="line-clamp-2 min-h-12 font-semibold leading-6 text-stone-900 transition group-hover:text-forest-700">
            {book.title}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-stone-500">{book.author}</p>
        <div className="mt-2">
          <RatingStars rating={book.rating} reviews={book.reviews} compact />
        </div>
        {reason && (
          <p className="mt-3 rounded-lg bg-forest-50 p-2.5 text-xs leading-5 text-forest-800">
            {reason}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <span className="font-bold text-stone-900">${book.price.toFixed(2)}</span>
            {book.original_price && (
              <span className="ml-2 text-xs text-stone-400 line-through">
                ${book.original_price.toFixed(2)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => addToCart(book, book.format[0], 1)}
            className="flex items-center gap-1.5 rounded-lg bg-forest-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-forest-700"
          >
            <ShoppingCart size={14} /> Add
          </button>
        </div>
      </div>
    </article>
  );
}
