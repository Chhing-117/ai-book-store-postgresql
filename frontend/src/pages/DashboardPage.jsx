import { BookOpen, Bot, DollarSign, Eye, LoaderCircle, ShoppingBag, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../api/client";

const icons = { Users, Books: BookOpen, Orders: ShoppingBag, Revenue: DollarSign, "Book Views": Eye, Ratings: Star, "AI Requests": Bot };

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDashboard().then(setData).catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div>
      <section className="border-b border-stone-200 bg-cream-200/70"><div className="container-shell py-10"><p className="text-sm font-semibold uppercase tracking-wider text-forest-600">Administrator only</p><h1 className="mt-1 text-3xl font-bold">Dashboard</h1><p className="mt-2 text-sm text-stone-500">Monitor users, books, sales, reading activity, ratings, and AI recommendations.</p></div></section>
      <div className="container-shell py-10">
        {error && <p className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}
        {!data && !error ? <div className="grid min-h-72 place-items-center"><LoaderCircle className="animate-spin text-forest-600" /></div> : data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.metrics.map((metric) => {
                const Icon = icons[metric.label] || BookOpen;
                const display = metric.label === "Revenue" ? `$${Number(metric.value).toFixed(2)}` : metric.value;
                return <article key={metric.label} className="section-card rounded-xl p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-lg bg-forest-50 text-forest-600"><Icon size={20} /></span><span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Live</span></div><p className="mt-5 text-3xl font-extrabold text-stone-900">{display}</p><p className="mt-1 text-sm text-stone-500">{metric.label}</p></article>;
              })}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <section className="section-card rounded-2xl p-6"><h2 className="text-xl font-bold">Most viewed books</h2><div className="mt-5 space-y-3">{data.top_viewed.map((item, index) => <Link to={`/books/${item.book_id}`} key={item.book_id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 hover:border-forest-300"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-forest-50 text-sm font-bold text-forest-700">{index + 1}</span><div><p className="font-semibold">{item.title}</p><p className="text-xs text-stone-500">{item.author}</p></div></div><span className="text-sm font-bold">{item.count} views</span></Link>)}{!data.top_viewed.length && <p className="text-sm text-stone-500">No book views recorded yet.</p>}</div></section>
              <section className="section-card rounded-2xl p-6"><h2 className="text-xl font-bold">Most purchased books</h2><div className="mt-5 space-y-3">{data.top_purchased.map((item, index) => <Link to={`/books/${item.book_id}`} key={item.book_id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 hover:border-forest-300"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-amber-50 text-sm font-bold text-amber-700">{index + 1}</span><div><p className="font-semibold">{item.title}</p><p className="text-xs text-stone-500">{item.author}</p></div></div><span className="text-sm font-bold">{item.count} sold</span></Link>)}{!data.top_purchased.length && <p className="text-sm text-stone-500">No purchases recorded yet.</p>}</div></section>
            </div>

            <section className="section-card mt-8 overflow-hidden rounded-2xl"><div className="border-b border-stone-200 p-6"><h2 className="text-xl font-bold">Recent users</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Joined</th></tr></thead><tbody>{data.recent_users.map((user) => <tr key={user.id} className="border-t border-stone-100"><td className="px-6 py-4 font-semibold">{user.full_name}</td><td className="px-6 py-4 text-stone-500">{user.email}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-amber-50 text-amber-700" : "bg-forest-50 text-forest-700"}`}>{user.role}</span></td><td className="px-6 py-4 text-stone-500">{new Date(user.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>
          </>
        )}
      </div>
    </div>
  );
}
