import BookCard from "../components/BookCard";
import EmptyState from "../components/EmptyState";
import { useStore } from "../context/StoreContext";

export default function WishlistPage() {
  const { wishlistBooks } = useStore();

  return (
    <div>
      <section className="border-b border-stone-200 bg-cream-200/70">
        <div className="container-shell py-10">
          <h1 className="text-3xl font-bold text-stone-900">Your Wishlist</h1>
          <p className="mt-2 text-sm text-stone-500">
            {wishlistBooks.length} saved {wishlistBooks.length === 1 ? "book" : "books"}
          </p>
        </div>
      </section>

      <section className="container-shell py-10">
        {wishlistBooks.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistBooks.map((book) => <BookCard key={book.id} book={book} />)}
          </div>
        ) : (
          <EmptyState
            title="Your wishlist is empty"
            message="Save books you love by tapping the heart icon. They will stay here for your next visit."
          />
        )}
      </section>
    </div>
  );
}
