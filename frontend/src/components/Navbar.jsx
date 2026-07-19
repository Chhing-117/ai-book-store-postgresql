import {
  Gauge,
  Heart,
  LogIn,
  Menu,
  Search,
  ShoppingCart,
  Sparkles,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

function navClass({ isActive }) {
  return `transition-colors hover:text-forest-700 ${isActive ? "font-semibold text-forest-700" : "text-stone-600"}`;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { wishlistIds, cartCount } = useStore();
  const { user, isAdmin } = useAuth();

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/books?q=${encodeURIComponent(query)}` : "/books");
    setMenuOpen(false);
  };

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur">
      <div className="container-shell flex min-h-16 items-center gap-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="BookNest home">
          <span className="grid size-9 place-items-center rounded-lg bg-forest-600 text-sm font-bold text-white shadow-sm">BN</span>
          <span className="hidden text-lg font-bold tracking-tight text-stone-900 sm:inline">BookNest</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm xl:flex">
          <NavLink to="/books" className={navClass}>All Books</NavLink>
          <NavLink to="/mood" className={({ isActive }) => `${navClass({ isActive })} flex items-center gap-1.5`}><Sparkles size={15} /> AI Mood</NavLink>
          {user && <NavLink to="/recommendations" className={({ isActive }) => `${navClass({ isActive })} flex items-center gap-1.5`}><WandSparkles size={15} /> For You</NavLink>}
          
        </nav>

        <form onSubmit={submitSearch} className="relative mx-auto hidden w-full max-w-md md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search books, authors..." className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm transition focus:border-forest-400 focus:bg-white focus:ring-2 focus:ring-forest-100" />
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link to="/wishlist" className="relative rounded-lg p-2 text-stone-600 transition hover:bg-forest-50 hover:text-forest-700" aria-label="Wishlist">
            <Heart size={21} />
            {wishlistIds.length > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-forest-600 px-1 text-[10px] font-bold leading-4 text-white">{wishlistIds.length}</span>}
          </Link>
          <Link to="/cart" className="relative rounded-lg p-2 text-stone-600 transition hover:bg-forest-50 hover:text-forest-700" aria-label="Cart">
            <ShoppingCart size={21} />
            {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-forest-600 px-1 text-[10px] font-bold leading-4 text-white">{cartCount}</span>}
          </Link>
          <Link to={user ? "/profile" : "/login"} className="hidden items-center gap-2 rounded-lg p-2 text-stone-600 transition hover:bg-forest-50 hover:text-forest-700 sm:flex" aria-label={user ? "Profile" : "Sign in"}>
            {user ? <><UserRound size={21} /><span className="hidden max-w-24 truncate text-xs font-semibold 2xl:inline">{user.full_name}</span></> : <LogIn size={21} />}
          </Link>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-lg p-2 text-stone-700 xl:hidden" aria-label="Toggle navigation">{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-stone-100 bg-white px-4 py-4 xl:hidden">
          <div className="container-shell space-y-4">
            <form onSubmit={submitSearch} className="relative md:hidden"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search books, authors..." className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm" /></form>
            <nav className="flex flex-col gap-3 text-sm">
              <NavLink to="/books" onClick={close} className={navClass}>All Books</NavLink>
              <NavLink to="/mood" onClick={close} className={navClass}>AI Mood Finder</NavLink>
              {user && <NavLink to="/profile" onClick={close} className={navClass}>My Profile</NavLink>}
              {!user && <NavLink to="/login" onClick={close} className={navClass}>Sign In</NavLink>}
              {isAdmin && <NavLink to="/dashboard" onClick={close} className={navClass}>Admin Dashboard</NavLink>}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
