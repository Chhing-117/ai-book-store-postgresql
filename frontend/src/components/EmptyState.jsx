import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyState({ title, message, actionLabel = "Browse Books", actionTo = "/books" }) {
  return (
    <div className="section-card rounded-2xl px-6 py-16 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-forest-50 text-forest-600">
        <BookOpen size={26} />
      </span>
      <h2 className="mt-5 text-xl font-bold text-stone-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">{message}</p>
      <Link
        to={actionTo}
        className="mt-6 inline-flex rounded-lg bg-forest-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-700"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
