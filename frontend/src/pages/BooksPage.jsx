import { Filter, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getBooks } from "../api/client";
import BookCard from "../components/BookCard";
import { useStore } from "../context/StoreContext";

const categories = ["Fiction", "Science Fiction", "Mystery", "Biography", "Self-Help", "Romance", "Fantasy"];
const formats = ["Physical Book", "eBook", "Audiobook"];
const formatMap = { "Physical Book": "Hardcover", eBook: "eBook", Audiobook: "Audiobook" };
const sorts = [
  ["popular", "Most Popular"],
  ["newest", "Newest First"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
  ["rating", "Highest Rated"],
];

export default function BooksPage() {
  const [searchParams] = useSearchParams();
  const { books: fallbackBooks } = useStore();
  const [items, setItems] = useState(fallbackBooks);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(fallbackBooks.length);
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const category = searchParams.get("category");
    return category ? [category] : [];
  });
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [maxPrice, setMaxPrice] = useState(50);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState(searchParams.get("sort") || "popular");
  const query = searchParams.get("q") || "";

  const backendFormats = useMemo(
    () => selectedFormats.map((format) => formatMap[format]),
    [selectedFormats],
  );

  useEffect(() => {
    setLoading(true);
    getBooks({
      q: query,
      category: selectedCategories,
      format: backendFormats,
      max_price: maxPrice,
      min_rating: minRating,
      sort,
      page,
      limit: 6,
    })
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
        setPages(result.pages);
      })
      .catch(() => {
        let result = [...fallbackBooks];
        if (query) {
          const term = query.toLowerCase();
          result = result.filter((book) => `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(term));
        }
        if (selectedCategories.length) result = result.filter((book) => selectedCategories.includes(book.category));
        if (backendFormats.length) result = result.filter((book) => book.format.some((format) => backendFormats.includes(format)));
        result = result.filter((book) => book.price <= maxPrice && book.rating >= minRating);
        const compare = {
          popular: (a, b) => b.reviews - a.reviews,
          newest: (a, b) => Number(b.is_new) - Number(a.is_new) || b.id - a.id,
          "price-asc": (a, b) => a.price - b.price,
          "price-desc": (a, b) => b.price - a.price,
          rating: (a, b) => b.rating - a.rating,
        }[sort];
        result.sort(compare);
        const totalPages = Math.max(1, Math.ceil(result.length / 6));
        setItems(result.slice((page - 1) * 6, page * 6));
        setTotal(result.length);
        setPages(totalPages);
      })
      .finally(() => setLoading(false));
  }, [query, selectedCategories, backendFormats, maxPrice, minRating, sort, page, fallbackBooks]);

  useEffect(() => {
    setPage(1);
  }, [query, selectedCategories, selectedFormats, maxPrice, minRating, sort]);

  const toggle = (value, setter) => {
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedFormats([]);
    setMaxPrice(50);
    setMinRating(0);
  };

  const filters = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 font-semibold text-stone-900">Category</h3>
        <div className="space-y-2.5">
          {categories.map((category) => (
            <label key={category} className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => toggle(category, setSelectedCategories)}
                className="size-4 rounded border-stone-300 accent-forest-600"
              />
              {category}
            </label>
          ))}
        </div>
      </div>
      <div className="border-t border-stone-200 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900">Price Range</h3>
          <span className="text-sm font-medium text-forest-700">${maxPrice}</span>
        </div>
        <input
          type="range"
          min="5"
          max="50"
          value={maxPrice}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
          className="w-full accent-forest-600"
        />
        <div className="mt-1 flex justify-between text-xs text-stone-400"><span>$5</span><span>$50</span></div>
      </div>
      <div className="border-t border-stone-200 pt-6">
        <h3 className="mb-3 font-semibold text-stone-900">Format</h3>
        <div className="space-y-2.5">
          {formats.map((format) => (
            <label key={format} className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={selectedFormats.includes(format)}
                onChange={() => toggle(format, setSelectedFormats)}
                className="size-4 rounded border-stone-300 accent-forest-600"
              />
              {format}
            </label>
          ))}
        </div>
      </div>
      <div className="border-t border-stone-200 pt-6">
        <h3 className="mb-3 font-semibold text-stone-900">Rating</h3>
        <div className="space-y-2.5">
          {[4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-600">
              <input
                type="radio"
                name="rating"
                checked={minRating === rating}
                onChange={() => setMinRating(rating)}
                className="size-4 accent-forest-600"
              />
              {rating}+ Stars
            </label>
          ))}
        </div>
      </div>
      <button onClick={clearFilters} className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium transition hover:border-forest-300 hover:text-forest-700">
        Clear Filters
      </button>
    </div>
  );

  return (
    <div>
      <section className="border-b border-stone-200 bg-cream-200/70">
        <div className="container-shell py-10">
          <h1 className="text-3xl font-bold text-stone-900">All Books</h1>
          <p className="mt-2 text-sm text-stone-500">
            Showing {items.length ? (page - 1) * 6 + 1 : 0}–{Math.min(page * 6, total)} of {total.toLocaleString()} results
            {query && <> for “{query}”</>}
          </p>
        </div>
      </section>

      <div className="container-shell py-10">
        <div className="mb-5 flex items-center justify-between gap-4 lg:hidden">
          <button onClick={() => setFilterOpen(true)} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium">
            <Filter size={17} /> Filters
          </button>
          <label className="flex items-center gap-2 text-sm text-stone-500">
            <SlidersHorizontal size={16} />
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-800">
              {sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="section-card sticky top-24 hidden h-fit rounded-xl p-6 lg:block">
            <h2 className="mb-6 text-lg font-bold text-stone-900">Filters</h2>
            {filters}
          </aside>

          <section>
            <div className="mb-5 hidden items-center justify-end lg:flex">
              <label className="flex items-center gap-3 text-sm text-stone-500">
                Sort by:
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 font-medium text-stone-800">
                  {sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[480px] animate-pulse rounded-xl bg-stone-200" />)}
              </div>
            ) : items.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((book) => <BookCard key={book.id} book={book} />)}
              </div>
            ) : (
              <div className="section-card rounded-xl p-12 text-center">
                <h2 className="text-xl font-bold text-stone-900">No books found</h2>
                <p className="mt-2 text-sm text-stone-500">Try clearing some filters or using a different search.</p>
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
                <button key={number} onClick={() => setPage(number)} className={`grid size-9 place-items-center rounded-lg text-sm font-medium ${number === page ? "bg-forest-600 text-white" : "border border-stone-200 bg-white text-stone-700"}`}>
                  {number}
                </button>
              ))}
              <button disabled={page === pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
          </section>
        </div>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 lg:hidden" onClick={() => setFilterOpen(false)}>
          <aside className="h-full w-[min(340px,90vw)] overflow-y-auto bg-cream-50 p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setFilterOpen(false)} className="rounded-lg p-2 hover:bg-stone-100"><X size={20} /></button>
            </div>
            {filters}
          </aside>
        </div>
      )}
    </div>
  );
}
