import { Link } from "react-router-dom";

export default function SectionHeader({ title, subtitle, link = "/books", linkLabel = "View All" }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {link && (
        <Link
          to={link}
          className="shrink-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-forest-300 hover:text-forest-700"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
