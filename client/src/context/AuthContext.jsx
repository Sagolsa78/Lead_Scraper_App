import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../api/leadApi";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      authService
        .me()
        .then((res) => {
          setUser(res.data.user);
          setOrganization(res.data.organization);
        })
        .catch(() => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    setUser(res.data.user);
    setOrganization(res.data.organization);
    return res;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    setUser(res.data.user);
    setOrganization(res.data.organization);
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, organization, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
