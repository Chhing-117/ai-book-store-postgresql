import { BookOpen, Check, History, LoaderCircle, LogOut, Save, ShoppingBag, Star, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProfileHistory } from "../api/client";
import { useAuth } from "../context/AuthContext";

function splitList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function ProfilePage() {
  const { user, saveProfile, signOut } = useAuth();
  const [form, setForm] = useState({
    full_name: user.full_name,
    favorite_genres: user.favorite_genres.join(", "),
    favorite_authors: user.favorite_authors.join(", "),
    bio: user.bio || "",
    avatar_url: user.avatar_url || "",
  });
  const [history, setHistory] = useState({ recent_views: [], ratings: [], purchases: [] });
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getProfileHistory()
      .then(setHistory)
      .finally(() => setLoadingHistory(false));
  }, []);

  const purchasedBooks = useMemo(() => history.purchases.flatMap((purchase) => purchase.items), [history.purchases]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await saveProfile({
        full_name: form.full_name,
        favorite_genres: splitList(form.favorite_genres),
        favorite_authors: splitList(form.favorite_authors),
        bio: form.bio,
        avatar_url: form.avatar_url,
      });
      setMessage("Profile updated. Future AI recommendations will use these preferences.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <section className="border-b border-stone-200 bg-cream-200/70">
        <div className="container-shell flex flex-wrap items-center justify-between gap-4 py-10">
          <div><p className="text-sm font-semibold uppercase tracking-wider text-forest-600">{user.role}</p><h1 className="mt-1 text-3xl font-bold">Your profile</h1><p className="mt-2 text-sm text-stone-500">Manage preferences and review your reading journey.</p></div>
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-rose-600"><LogOut size={17} /> Sign out</button>
        </div>
      </section>

      <div className="container-shell grid gap-8 py-10 lg:grid-cols-[360px_1fr]">
        <aside className="section-card h-fit rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center overflow-hidden rounded-full bg-forest-100 text-forest-700">
              {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : <UserRound size={28} />}
            </div>
            <div><h2 className="font-bold text-stone-900">{user.full_name}</h2><p className="text-sm text-stone-500">{user.email}</p><span className="mt-2 inline-block rounded-full bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-700">{user.role}</span></div>
          </div>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-sm font-medium">Full name<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5" /></label>
            <label className="block text-sm font-medium">Favorite genres<input value={form.favorite_genres} onChange={(e) => setForm({ ...form, favorite_genres: e.target.value })} placeholder="Fiction, Mystery" className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5" /><span className="mt-1 block text-xs text-stone-400">Separate values with commas.</span></label>
            <label className="block text-sm font-medium">Favorite authors<input value={form.favorite_authors} onChange={(e) => setForm({ ...form, favorite_authors: e.target.value })} placeholder="Andy Weir, James Clear" className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5" /></label>
            <label className="block text-sm font-medium">Bio<textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="mt-2 w-full resize-none rounded-lg border border-stone-200 px-3 py-2.5" /></label>
            <label className="block text-sm font-medium">Avatar URL<input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5" /></label>
            {message && <p className="rounded-lg bg-forest-50 px-3 py-2 text-xs text-forest-700">{message}</p>}
            <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />} Save profile</button>
          </form>
        </aside>

        <main className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              [History, "Recent views", history.recent_views.length],
              [ShoppingBag, "Purchased books", purchasedBooks.length],
              [Star, "Ratings", history.ratings.length],
            ].map(([Icon, label, value]) => <article key={label} className="section-card rounded-xl p-5"><Icon className="text-forest-600" size={21} /><p className="mt-4 text-2xl font-extrabold">{value}</p><p className="text-sm text-stone-500">{label}</p></article>)}
          </div>

          {loadingHistory ? <div className="grid min-h-60 place-items-center"><LoaderCircle className="animate-spin text-forest-600" /></div> : (
            <>
              <section className="section-card rounded-2xl p-6">
                <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Recently viewed</h2><p className="mt-1 text-sm text-stone-500">Used by the recommendation engine to understand your current interests.</p></div><BookOpen className="text-forest-500" /></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {history.recent_views.slice(0, 8).map((item, index) => <Link key={`${item.book.id}-${index}`} to={`/books/${item.book.id}`} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 hover:border-forest-300"><img src={item.book.image} alt="" className="h-16 w-12 rounded object-cover" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.book.title}</p><p className="text-xs text-stone-500">{item.book.author}</p><p className="mt-1 text-[11px] text-stone-400">{new Date(item.occurred_at).toLocaleString()}</p></div></Link>)}
                  {!history.recent_views.length && <p className="text-sm text-stone-500">Open a book detail page while signed in to start your history.</p>}
                </div>
              </section>

              <section className="section-card rounded-2xl p-6">
                <h2 className="text-xl font-bold">Purchases</h2>
                <div className="mt-5 space-y-4">
                  {history.purchases.map((purchase) => <article key={purchase.id} className="rounded-xl border border-stone-200 bg-white p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">Order #{purchase.id}</p><p className="text-xs text-stone-500">{new Date(purchase.created_at).toLocaleString()}</p></div><div className="text-right"><p className="font-bold">${purchase.total_amount.toFixed(2)}</p><p className="inline-flex items-center gap-1 text-xs text-forest-700"><Check size={13} /> {purchase.status}</p></div></div><div className="mt-3 flex flex-wrap gap-2">{purchase.items.map((item) => <Link key={`${purchase.id}-${item.book.id}`} to={`/books/${item.book.id}`} className="rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-700">{item.book.title} × {item.quantity}</Link>)}</div></article>)}
                  {!history.purchases.length && <p className="text-sm text-stone-500">Completed demo purchases will appear here.</p>}
                </div>
              </section>

              <section className="section-card rounded-2xl p-6">
                <h2 className="text-xl font-bold">Ratings and reading history</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {history.ratings.map((item) => <Link key={item.book.id} to={`/books/${item.book.id}`} className="rounded-xl border border-stone-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.book.title}</p><p className="text-xs text-stone-500">{item.book.author}</p></div><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">{item.rating}/5</span></div>{item.review && <p className="mt-3 line-clamp-2 text-xs leading-5 text-stone-500">{item.review}</p>}</Link>)}
                  {!history.ratings.length && <p className="text-sm text-stone-500">Rate books from their detail page to improve your recommendations.</p>}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
