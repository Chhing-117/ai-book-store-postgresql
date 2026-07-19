import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const footerGroups = [
  {
    title: "Shop",
    links: [
      ["All Books", "/books"],
      ["Bestsellers", "/books?sort=popular"],
      ["New Arrivals", "/books?sort=newest"],
      ["Special Offers", "/books"],
    ],
  },
  {
    title: "Customer Service",
    links: [
      ["My Account", "#"],
      ["Track Order", "#"],
      ["Shipping Info", "#"],
      ["Returns", "#"],
      ["Help Center", "#"],
    ],
  },
  {
    title: "About",
    links: [
      ["About Us", "#"],
      ["Blog", "#"],
      ["Careers", "#"],
      ["Privacy Policy", "#"],
      ["Terms of Service", "#"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-forest-600 text-sm font-bold text-white">
              BN
            </span>
            <span className="text-lg font-bold text-stone-900">BookNest</span>
          </div>
          <p className="max-w-sm text-sm leading-6 text-stone-500">
            Your cozy corner for discovering and exploring books from around the world.
          </p>
          <div className="mt-5 space-y-2 text-sm text-stone-500">
            <p className="flex items-center gap-2"><Mail size={15} /> hello@booknest.com</p>
            <p className="flex items-center gap-2"><Phone size={15} /> +1 (555) 123-4567</p>
            <p className="flex items-center gap-2"><MapPin size={15} /> 123 Book Street, NY 10001</p>
          </div>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-4 font-semibold text-stone-900">{group.title}</h3>
            <ul className="space-y-2.5 text-sm text-stone-500">
              {group.links.map(([label, href]) => (
                <li key={label}>
                  {href.startsWith("/") ? (
                    <Link to={href} className="transition hover:text-forest-700">{label}</Link>
                  ) : (
                    <a href={href} className="transition hover:text-forest-700">{label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-100 py-5 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} BookNest. Demo storefront for learning and development.
      </div>
    </footer>
  );
}
