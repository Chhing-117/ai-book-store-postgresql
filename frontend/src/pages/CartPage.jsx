import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookCard from "../components/BookCard";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

export default function CartPage() {
  const { books, cart, updateCartQuantity, removeFromCart, completeCheckout } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0),
    [cart],
  );
  const tax = subtotal * 0.075;
  const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 6.99;
  const total = Math.max(0, subtotal + tax + shipping - discount);
  const suggestions = books.filter((book) => !cart.some((item) => item.book.id === book.id)).slice(0, 4);

  const applyPromo = () => {
    if (promo.trim().toUpperCase() === "BOOK10") {
      setDiscount(Math.min(10, subtotal * 0.1));
      setPromoMessage("BOOK10 applied successfully.");
    } else {
      setDiscount(0);
      setPromoMessage("Try demo code BOOK10.");
    }
  };


  const checkout = async () => {
    if (!user) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    setCheckingOut(true);
    setCheckoutMessage("");
    try {
      const purchase = await completeCheckout();
      setCheckoutMessage(`Order #${purchase.id} completed. It is now included in your purchase history and AI recommendations.`);
    } catch (error) {
      setCheckoutMessage(error.message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (!cart.length) {
    return (
      <div>
        <section className="border-b border-stone-200 bg-cream-200/70">
          <div className="container-shell py-10"><h1 className="text-3xl font-bold">Shopping Cart</h1></div>
        </section>
        <div className="container-shell py-10">
          {checkoutMessage && <p className="mb-5 rounded-xl bg-forest-50 px-4 py-3 text-sm text-forest-700">{checkoutMessage}</p>}
          <EmptyState title="Your cart is empty" message="Add a few books and come back when you are ready to check out." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="border-b border-stone-200 bg-cream-200/70">
        <div className="container-shell py-10">
          <h1 className="text-3xl font-bold text-stone-900">Shopping Cart</h1>
          <p className="mt-2 text-sm text-stone-500">{cart.reduce((sum, item) => sum + item.quantity, 0)} items in your cart</p>
        </div>
      </section>

      <div className="container-shell py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <section className="space-y-4">
            {cart.map((item) => (
              <article key={`${item.book.id}-${item.format}`} className="section-card flex gap-4 rounded-xl p-4 sm:gap-6 sm:p-5">
                <Link to={`/books/${item.book.id}`} className="w-24 shrink-0 overflow-hidden rounded-lg bg-stone-100 sm:w-28">
                  <img src={item.book.image} alt={item.book.title} className="aspect-[4/5] h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/books/${item.book.id}`} className="font-semibold text-stone-900 transition hover:text-forest-700">{item.book.title}</Link>
                      <p className="mt-1 text-sm text-stone-500">{item.book.author}</p>
                      <p className="mt-1 text-xs text-stone-400">Format: {item.format}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.book.id, item.format)} className="rounded-lg p-2 text-stone-400 transition hover:bg-rose-50 hover:text-rose-500" aria-label="Remove item"><Trash2 size={18} /></button>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white">
                      <button onClick={() => updateCartQuantity(item.book.id, item.format, item.quantity - 1)} className="p-2.5 text-stone-500"><Minus size={15} /></button>
                      <span className="min-w-9 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.book.id, item.format, item.quantity + 1)} className="p-2.5 text-stone-500"><Plus size={15} /></button>
                    </div>
                    <span className="font-bold text-stone-900">${(item.book.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </article>
            ))}
            <Link to="/books" className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-forest-300 hover:text-forest-700">
              ← Continue Shopping
            </Link>
          </section>

          <aside className="section-card h-fit rounded-xl p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-stone-900">Order Summary</h2>
            <div className="mt-5 flex gap-2">
              <input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Promo code" className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2.5 text-sm" />
              <button onClick={applyPromo} className="rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-medium hover:border-forest-300">Apply</button>
            </div>
            {promoMessage && <p className="mt-2 text-xs text-stone-500">{promoMessage}</p>}
            <div className="my-6 border-t border-stone-200" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd className="font-medium">${subtotal.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Shipping</dt><dd className="font-medium">{shipping ? `$${shipping.toFixed(2)}` : "FREE"}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Tax</dt><dd className="font-medium">${tax.toFixed(2)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-forest-700"><dt>Discount</dt><dd>-${discount.toFixed(2)}</dd></div>}
            </dl>
            <div className="my-6 border-t border-stone-200" />
            <div className="flex items-center justify-between"><span className="font-semibold">Total</span><span className="text-xl font-extrabold">${total.toFixed(2)}</span></div>
            <button onClick={checkout} disabled={checkingOut} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-forest-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-forest-700 disabled:opacity-60">
              <ShoppingBag size={18} /> {checkingOut ? "Completing order..." : user ? "Complete Demo Purchase" : "Sign in to Checkout"}
            </button>
            {checkoutMessage && <p className="mt-3 rounded-lg bg-forest-50 px-3 py-2 text-xs text-forest-700">{checkoutMessage}</p>}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-400"><ShieldCheck size={14} /> Secure demo checkout</p>
          </aside>
        </div>

        {suggestions.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-stone-900">You May Also Like</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
