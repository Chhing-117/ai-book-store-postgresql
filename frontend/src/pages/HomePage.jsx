import {
  ArrowRight,
  BookOpen,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookCard from "../components/BookCard";
import SectionHeader from "../components/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

const categoryImages = {
  Fiction: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
  Mystery: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80",
  "Science Fiction": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80",
  "Self-Help": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
};

const testimonials = [
  {
    quote: "BookNest has become my go-to place for discovering new reads. The recommendations are always spot-on!",
    name: "Sarah Johnson",
  },
  {
    quote: "Fast shipping, great prices, and an amazing selection. What more could you ask for?",
    name: "Michael Chen",
  },
  {
    quote: "I love the cozy atmosphere of this site. It feels like browsing in a real bookstore from home.",
    name: "Emma Williams",
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { books } = useStore();
  const { user } = useAuth();

  const bestsellers = books.filter((book) => book.is_bestseller).slice(0, 4);
  const newArrivals = books.filter((book) => book.is_new).slice(0, 4);
  const categories = ["Fiction", "Mystery", "Science Fiction", "Self-Help"];

  const search = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/books?q=${encodeURIComponent(value)}` : "/books");
  };

  return (
    <>
      <section className="border-b border-stone-200/70 bg-[radial-gradient(circle_at_top_left,_#edf2e8,_transparent_42%),linear-gradient(135deg,_#faf7f1,_#f4efe5)]">
        <div className="container-shell flex min-h-[430px] flex-col items-center justify-center py-20 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white/70 px-4 py-2 text-sm font-medium text-forest-700">
            <BookOpen size={16} /> Over 1,000 stories waiting for you
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Discover Your Next
            <span className="block text-forest-700">Favorite Book</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
            Explore books across every genre. Find physical books, eBooks, and audiobooks for every kind of reader.
          </p>
          <form onSubmit={search} className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for books, authors, ISBN..."
                className="w-full rounded-xl border border-stone-200 bg-white px-12 py-4 text-sm shadow-sm transition focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
              />
            </label>
            <button className="rounded-xl bg-forest-600 px-7 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-forest-700">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="container-shell py-16">
        <SectionHeader title="Browse by Category" subtitle="Find books that match your interests" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const count = books.filter((book) => book.category === category).length;
            return (
              <Link
                key={category}
                to={`/books?category=${encodeURIComponent(category)}`}
                className="group relative min-h-40 overflow-hidden rounded-xl bg-stone-900 shadow-sm"
              >
                <img
                  src={categoryImages[category]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-105 group-hover:opacity-75"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute bottom-4 left-4 right-4 text-white">
                  <strong className="block text-lg">{category}</strong>
                  <span className="text-sm text-white/80">{Math.max(count * 32, 42)} Books</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-cream-200/75 py-16">
        <div className="container-shell">
          <SectionHeader title="Bestsellers" subtitle="Most popular books this month" link="/books?sort=popular" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestsellers.map((book) => <BookCard key={book.id} book={book} />)}
          </div>
        </div>
      </section>

      <section className="container-shell py-16">
        <SectionHeader title="New Arrivals" subtitle="Just added to our collection" link="/books?sort=newest" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {newArrivals.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      </section>

      {user && (
        <section className="container-shell pb-4">
          <div className="rounded-2xl border border-forest-200 bg-forest-50 p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div><p className="text-sm font-semibold uppercase tracking-wider text-forest-600">Personalized for {user.full_name}</p><h2 className="mt-2 text-2xl font-bold text-stone-900">Recommendations that learn from your reading</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Use your views, purchases, favorite genres and authors, ratings, and similar readers to find your next book.</p></div>
            <Link to="/recommendations" className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-forest-600 px-5 py-3 text-sm font-bold text-white sm:mt-0">Get AI recommendations <ArrowRight size={16} /></Link>
          </div>
        </section>
      )}

      <section className="container-shell py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#6f704a,#9c7d55)] p-8 text-white shadow-soft sm:p-10">
            <Sparkles size={28} />
            <h2 className="mt-5 text-2xl font-bold">AI Mood Finder</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
              Not sure what to read? Tell us your mood and let AI find the perfect book for you.
            </p>
            <Link to="/mood" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100">
              Try AI Mood Finder <ArrowRight size={16} />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#8d7152,#3f5d3a)] p-8 text-white shadow-soft sm:p-10">
            <Star size={28} />
            <h2 className="mt-5 text-2xl font-bold">Special Summer Sale!</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
              Get up to 40% off on selected titles. Limited-time offer for your next reading escape.
            </p>
            <Link to="/books" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100">
              Shop Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-shell py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900">What Our Readers Say</h2>
          <p className="mt-1 text-sm text-stone-500">Join thousands of happy book lovers</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="section-card rounded-xl p-6">
              <div className="text-4xl leading-none text-forest-200">“</div>
              <p className="mt-3 text-sm leading-6 text-stone-600">{item.quote}</p>
              <div className="mt-5 flex text-amber-400">
                {Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} className="fill-current" />)}
              </div>
              <p className="mt-4 text-sm font-semibold text-stone-900">{item.name}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
