import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getAuthToken,
  getCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  setAuthToken,
  updateProfile as updateProfileRequest,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAuthToken()));

  useEffect(() => {
    let active = true;
    if (!getAuthToken()) {
      setLoading(false);
      return undefined;
    }
    getCurrentUser()
      .then((result) => active && setUser(result))
      .catch(() => {
        setAuthToken("");
        if (active) setUser(null);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const signIn = async (email, password) => {
    const result = await loginAccount({ email, password });
    setAuthToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const register = async (fullName, email, password) => {
    const result = await registerAccount({ full_name: fullName, email, password });
    setAuthToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const signOut = async () => {
    try {
      await logoutAccount();
    } catch {
      // Always clear local authentication, even if the API is unavailable.
    }
    setAuthToken("");
    setUser(null);
  };

  const saveProfile = async (payload) => {
    const updated = await updateProfileRequest(payload);
    setUser(updated);
    return updated;
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    signIn,
    register,
    signOut,
    saveProfile,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
