import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBook, rateBook, trackBookView } from "../api/client";
import BookCard from "../components/BookCard";
import RatingStars from "../components/RatingStars";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

const tabs = ["Description", "Details", "Reviews"];

export default function BookDetailPage() {
  const { bookId } = useParams();
  const { user } = useAuth();
  const { books, wishlistIds, toggleWishlist, addToCart } = useStore();
  const [book, setBook] = useState(() => books.find((item) => item.id === Number(bookId)) || null);
  const [loading, setLoading] = useState(!book);
  const [format, setFormat] = useState(book?.format?.[0] || "Hardcover");
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("Description");
  const [myRating, setMyRating] = useState(5);
  const [review, setReview] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    const local = books.find((item) => item.id === Number(bookId));
    if (local) {
      setBook(local);
      setFormat(local.format[0]);
      setLoading(false);
      return;
    }
    getBook(bookId)
      .then((result) => {
        setBook(result);
        setFormat(result.format[0]);
      })
      .finally(() => setLoading(false));
  }, [bookId, books]);

  useEffect(() => {
    if (!user || !book) return;
    const key = `booknest-viewed-${user.id}-${book.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackBookView(book.id).catch(() => sessionStorage.removeItem(key));
  }, [book, user]);

  const related = useMemo(() => {
    if (!book) return [];
    return books
      .filter((item) => item.id !== book.id)
      .sort((a, b) => Number(b.category === book.category) - Number(a.category === book.category) || b.rating - a.rating)
      .slice(0, 4);
  }, [book, books]);

  const submitRating = async (event) => {
    event.preventDefault();
    setSavingReview(true);
    setReviewMessage("");
    try {
      await rateBook(book.id, { rating: myRating, review });
      setReviewMessage("Your rating was saved and will improve future recommendations.");
    } catch (error) {
      setReviewMessage(error.message);
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) return <div className="container-shell py-20"><div className="h-[620px] animate-pulse rounded-2xl bg-stone-200" /></div>;
  if (!book) return <div className="container-shell py-24 text-center"><h1 className="text-3xl font-bold">Book not found</h1><Link to="/books" className="mt-6 inline-flex rounded-lg bg-forest-600 px-5 py-2.5 text-white">Back to books</Link></div>;

  const wished = wishlistIds.includes(book.id);

  return (
    <div>
      <section className="container-shell py-8 sm:py-12">
        <Link to="/books" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-forest-700"><ArrowLeft size={16} /> Back to Books</Link>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden rounded-2xl bg-stone-100 shadow-soft">
            <img src={book.image} alt={book.title} className="aspect-[4/5] h-full w-full object-cover" />
            {book.discount > 0 && <span className="absolute right-4 top-4 rounded-full bg-rose-500 px-3 py-1.5 text-sm font-bold text-white">-{book.discount}% OFF</span>}
          </div>
          <div className="py-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-forest-600">{book.category}</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">{book.title}</h1>
            <p className="mt-3 text-lg text-stone-500">by {book.author}</p>
            <div className="mt-4"><RatingStars rating={book.rating} reviews={book.reviews} /></div>
            <div className="mt-6 flex items-end gap-3"><span className="text-3xl font-extrabold text-stone-900">${book.price.toFixed(2)}</span>{book.original_price && <span className="pb-1 text-stone-400 line-through">${book.original_price.toFixed(2)}</span>}</div>
            <p className="mt-1 text-xs text-stone-400">Tax included. Shipping calculated at checkout.</p>

            <div className="mt-8"><h2 className="mb-3 text-sm font-semibold text-stone-900">Format</h2><div className="grid grid-cols-2 gap-3">{book.format.map((item) => <button key={item} onClick={() => setFormat(item)} className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${format === item ? "border-forest-600 bg-forest-600 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-forest-300"}`}>{item}</button>)}</div></div>
            <div className="mt-7"><h2 className="mb-3 text-sm font-semibold text-stone-900">Quantity</h2><div className="inline-flex items-center rounded-lg border border-stone-200 bg-white"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="p-3 text-stone-500 hover:text-forest-700"><Minus size={16} /></button><span className="min-w-10 text-center text-sm font-semibold">{quantity}</span><button onClick={() => setQuantity((value) => Math.min(99, value + 1))} className="p-3 text-stone-500 hover:text-forest-700"><Plus size={16} /></button></div></div>
            <div className="mt-8 flex gap-3"><button onClick={() => addToCart(book, format, quantity)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-forest-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-forest-700"><ShoppingCart size={18} /> Add to Cart</button><button onClick={() => toggleWishlist(book.id)} className={`grid size-12 place-items-center rounded-xl border transition ${wished ? "border-rose-200 bg-rose-50 text-rose-500" : "border-stone-200 bg-white text-stone-500 hover:text-rose-500"}`}><Heart size={19} className={wished ? "fill-current" : ""} /></button></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">{[[Truck, "Free Shipping", "On orders over $50"], [RotateCcw, "Easy Returns", "30-day return policy"], [ShieldCheck, "Secure Payment", "100% secure checkout"]].map(([Icon, title, text]) => <div key={title} className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-sm"><Icon className="mx-auto text-forest-600" size={20} /><p className="mt-2 text-xs font-semibold text-stone-800">{title}</p><p className="mt-1 text-[11px] text-stone-400">{text}</p></div>)}</div>
          </div>
        </div>

        <div className="mt-14">
          <div className="grid grid-cols-3 border-b border-stone-200">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-4 py-4 text-sm font-medium transition ${tab === item ? "border-forest-600 text-forest-700" : "border-transparent text-stone-500"}`}>{item}{item === "Reviews" ? ` (${book.reviews})` : ""}</button>)}</div>
          <div className="min-h-36 py-7 text-sm leading-7 text-stone-600">
            {tab === "Description" && <p>{book.description}</p>}
            {tab === "Details" && <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">{[["Publisher", book.publisher], ["Language", book.language], ["Pages", book.pages], ["ISBN", book.isbn], ["Publish Date", book.publish_date], ["Dimensions", book.dimensions]].map(([label, value]) => <div key={label} className="grid grid-cols-[120px_1fr] border-b border-stone-100 pb-3"><dt className="font-semibold text-stone-800">{label}</dt><dd>{value}</dd></div>)}</dl>}
            {tab === "Reviews" && (
              <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                <div><h3 className="font-bold text-stone-900">Reader ratings</h3><p className="mt-2">Your rating becomes part of your personal reading history and helps the recommendation engine understand your taste.</p></div>
                {user ? <form onSubmit={submitRating} className="rounded-xl border border-stone-200 bg-white p-5"><p className="font-semibold text-stone-900">Rate this book</p><div className="mt-3 flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setMyRating(value)} className={value <= myRating ? "text-amber-400" : "text-stone-300"}><Star size={24} className={value <= myRating ? "fill-current" : ""} /></button>)}</div><textarea value={review} onChange={(event) => setReview(event.target.value)} rows={3} placeholder="Optional review" className="mt-4 w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm" />{reviewMessage && <p className="mt-2 text-xs text-forest-700">{reviewMessage}</p>}<button disabled={savingReview} className="mt-4 w-full rounded-lg bg-forest-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{savingReview ? "Saving..." : "Save rating"}</button></form> : <div className="rounded-xl border border-stone-200 bg-white p-5"><p className="font-semibold text-stone-900">Sign in to rate this book</p><p className="mt-2 text-xs text-stone-500">Ratings improve your AI recommendations.</p><Link to="/login" className="mt-4 inline-flex rounded-lg bg-forest-600 px-4 py-2 text-xs font-bold text-white">Sign in</Link></div>}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-cream-200/80 py-14"><div className="container-shell"><h2 className="mb-6 text-2xl font-bold text-stone-900">You May Also Like</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <BookCard key={item.id} book={item} />)}</div></div></section>
    </div>
  );
}
