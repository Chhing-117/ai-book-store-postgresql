import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addCartItem,
  addWishlistBook,
  checkoutCart,
  deleteCartItem,
  getBooks,
  getCart,
  getWishlist,
  removeWishlistBook,
  setCartItemQuantity,
} from "../api/client";
import { fallbackBooks } from "../data/fallbackBooks";

const StoreContext = createContext(null);

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }) {
  const [books, setBooks] = useState(fallbackBooks);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(() =>
    readStorage("booknest-wishlist", []),
  );
  const [cart, setCart] = useState(() => readStorage("booknest-cart", []));

  useEffect(() => {
    let active = true;

    async function loadStore() {
      const [booksResult, wishlistResult, cartResult] = await Promise.allSettled([
        getBooks({ limit: 50 }),
        getWishlist(),
        getCart(),
      ]);

      if (!active) return;

      if (booksResult.status === "fulfilled" && booksResult.value.items?.length) {
        setBooks(booksResult.value.items);
        setApiOnline(true);
      } else {
        setBooks(fallbackBooks);
        setApiOnline(false);
      }

      if (wishlistResult.status === "fulfilled") {
        setWishlistIds(wishlistResult.value.book_ids || []);
      }

      if (cartResult.status === "fulfilled") {
        setCart(cartResult.value.items || []);
      }

      setLoading(false);
    }

    loadStore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("booknest-wishlist", JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  useEffect(() => {
    localStorage.setItem("booknest-cart", JSON.stringify(cart));
  }, [cart]);

  const toggleWishlist = (bookId) => {
    const adding = !wishlistIds.includes(bookId);
    setWishlistIds((current) =>
      adding ? [...current, bookId] : current.filter((id) => id !== bookId),
    );

    const sync = adding ? addWishlistBook(bookId) : removeWishlistBook(bookId);
    sync
      .then((result) => setWishlistIds(result.book_ids || []))
      .catch(() => setApiOnline(false));
  };

  const addToCart = (book, format = "Hardcover", quantity = 1) => {
    setCart((current) => {
      const existing = current.find(
        (item) => item.book.id === book.id && item.format === format,
      );
      if (existing) {
        return current.map((item) =>
          item.book.id === book.id && item.format === format
            ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
            : item,
        );
      }
      return [...current, { book, format, quantity }];
    });

    addCartItem(book.id, format, quantity)
      .then((result) => setCart(result.items || []))
      .catch(() => setApiOnline(false));
  };

  const updateCartQuantity = (bookId, format, quantity) => {
    if (quantity <= 0) {
      setCart((current) =>
        current.filter(
          (item) => !(item.book.id === bookId && item.format === format),
        ),
      );
    } else {
      setCart((current) =>
        current.map((item) =>
          item.book.id === bookId && item.format === format
            ? { ...item, quantity: Math.min(99, quantity) }
            : item,
        ),
      );
    }

    setCartItemQuantity(bookId, format, Math.max(0, quantity))
      .then((result) => setCart(result.items || []))
      .catch(() => setApiOnline(false));
  };

  const removeFromCart = (bookId, format) => {
    setCart((current) =>
      current.filter(
        (item) => !(item.book.id === bookId && item.format === format),
      ),
    );

    deleteCartItem(bookId, format)
      .then((result) => setCart(result.items || []))
      .catch(() => setApiOnline(false));
  };


  const completeCheckout = async () => {
    const result = await checkoutCart();
    setCart(result.cart?.items || []);
    return result.purchase;
  };

  const value = useMemo(
    () => ({
      books,
      loading,
      apiOnline,
      wishlistIds,
      wishlistBooks: books.filter((book) => wishlistIds.includes(book.id)),
      cart,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      toggleWishlist,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      completeCheckout,
    }),
    [books, loading, apiOnline, wishlistIds, cart],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return context;
}
