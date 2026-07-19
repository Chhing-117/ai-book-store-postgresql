import { BookOpen, LoaderCircle, LockKeyhole, UserPlus } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, signIn, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("reader@booknest.local");
  const [password, setPassword] = useState("Reader123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  if (user) return <Navigate to={location.state?.from || "/profile"} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const signedInUser = mode === "login"
        ? await signIn(email, password)
        : await register(fullName, email, password);
      navigate(signedInUser.role === "admin" ? "/dashboard" : (location.state?.from || "/profile"), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const useDemo = (type) => {
    setMode("login");
    if (type === "admin") {
      setEmail("admin@booknest.local");
      setPassword("Admin123!");
    } else {
      setEmail("reader@booknest.local");
      setPassword("Reader123!");
    }
  };

  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[linear-gradient(145deg,#2d3f2b,#567b4b)] p-8 text-white sm:p-12">
          <BookOpen size={36} />
          <h1 className="mt-8 text-3xl font-extrabold">Welcome to BookNest</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/75">
            Sign in to save your profile, track reading history, rate books, complete demo purchases, and receive deeper AI recommendations.
          </p>
          <div className="mt-10 space-y-3 text-sm">
            <button onClick={() => useDemo("user")} className="block w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left transition hover:bg-white/15">
              <strong>Demo user</strong><span className="block text-xs text-white/65">reader@booknest.local / Reader123!</span>
            </button>
            <button onClick={() => useDemo("admin")} className="block w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left transition hover:bg-white/15">
              <strong>Demo administrator</strong><span className="block text-xs text-white/65">admin@booknest.local / Admin123!</span>
            </button>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          <div className="flex rounded-xl bg-stone-100 p-1">
            <button onClick={() => setMode("login")} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${mode === "login" ? "bg-white text-forest-700 shadow-sm" : "text-stone-500"}`}>Sign in</button>
            <button onClick={() => setMode("register")} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${mode === "register" ? "bg-white text-forest-700 shadow-sm" : "text-stone-500"}`}>Create account</button>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {mode === "register" && (
              <label className="block text-sm font-medium text-stone-700">Full name
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3" />
              </label>
            )}
            <label className="block text-sm font-medium text-stone-700">Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3" />
            </label>
            <label className="block text-sm font-medium text-stone-700">Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === "register" ? 8 : 1} className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3" />
            </label>
            {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-forest-700 disabled:opacity-60">
              {loading ? <LoaderCircle className="animate-spin" size={18} /> : mode === "login" ? <LockKeyhole size={18} /> : <UserPlus size={18} />}
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
