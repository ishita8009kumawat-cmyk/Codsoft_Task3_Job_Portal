import { createContext, useContext, useState, useCallback } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("careerhub_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("careerhub_token", data.token);
    localStorage.setItem("careerhub_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("careerhub_token", data.token);
    localStorage.setItem("careerhub_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("careerhub_token");
    localStorage.removeItem("careerhub_user");
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
