const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

function createClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
}

export function getClientId() {
  const key = "booknest-client-id";
  let value = localStorage.getItem(key);
  if (!value) {
    value = createClientId();
    localStorage.setItem(key, value);
  }
  return value;
}

export function getAuthToken() {
  return localStorage.getItem("booknest-auth-token") || "";
}

export function setAuthToken(token) {
  if (token) localStorage.setItem("booknest-auth-token", token);
  else localStorage.removeItem("booknest-auth-token");
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Client-ID": getClientId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Keep the default message when the response is not JSON.
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export function getBooks(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => search.append(key, item));
    else if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return request(`/books${query ? `?${query}` : ""}`);
}

export const getBook = (bookId) => request(`/books/${bookId}`);
export const getWishlist = () => request("/wishlist");
export const addWishlistBook = (bookId) => request(`/wishlist/${bookId}`, { method: "PUT" });
export const removeWishlistBook = (bookId) => request(`/wishlist/${bookId}`, { method: "DELETE" });
export const getCart = () => request("/cart");
export const addCartItem = (bookId, format, quantity = 1) => request("/cart", {
  method: "POST",
  body: JSON.stringify({ book_id: bookId, format, quantity }),
});
export const setCartItemQuantity = (bookId, format, quantity) => request(`/cart/${bookId}`, {
  method: "PATCH",
  body: JSON.stringify({ format, quantity }),
});
export function deleteCartItem(bookId, format) {
  return request(`/cart/${bookId}?${new URLSearchParams({ format }).toString()}`, { method: "DELETE" });
}

export const getMoodRecommendations = (payload) => request("/ai/mood", {
  method: "POST",
  body: JSON.stringify(payload),
});
export const getPersonalizedRecommendations = (payload) => request("/ai/recommendations", {
  method: "POST",
  body: JSON.stringify(payload),
});

export const registerAccount = (payload) => request("/auth/register", {
  method: "POST",
  body: JSON.stringify(payload),
});
export const loginAccount = (payload) => request("/auth/login", {
  method: "POST",
  body: JSON.stringify(payload),
});
export const logoutAccount = () => request("/auth/logout", { method: "POST" });
export const getCurrentUser = () => request("/auth/me");
export const updateProfile = (payload) => request("/profile", {
  method: "PUT",
  body: JSON.stringify(payload),
});
export const getProfileHistory = () => request("/profile/history");
export const trackBookView = (bookId) => request(`/history/views/${bookId}`, { method: "POST" });
export const rateBook = (bookId, payload) => request(`/ratings/${bookId}`, {
  method: "PUT",
  body: JSON.stringify(payload),
});
export const checkoutCart = () => request("/orders/checkout", { method: "POST" });
export const getAdminDashboard = () => request("/admin/dashboard");
export const getHealth = () => request("/health");
