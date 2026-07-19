import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container-shell py-28 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-forest-600">404</p>
      <h1 className="mt-3 text-4xl font-extrabold text-stone-900">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-stone-500">The page you are looking for is not part of this bookstore.</p>
      <Link to="/" className="mt-7 inline-flex rounded-lg bg-forest-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-700">Return Home</Link>
    </div>
  );
}
