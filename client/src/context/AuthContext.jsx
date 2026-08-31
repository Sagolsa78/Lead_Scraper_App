import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../api/leadApi";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const DEFAULT_ORG = {
  id: "demo-org-id",
  name: "LeadFinder Pro",
  slug: "leadfinder-pro",
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
          if (res?.data?.user) {
            setUser(res.data.user);
            setOrganization(res.data.organization || DEFAULT_ORG);
          } else {
            // Token exists but /me returned no user — clear stale tokens
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
          }
        })
        .catch(() => {
          // Token invalid/expired — clear and force login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res?.data?.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      setUser(res.data.user);
      setOrganization(res.data.organization || DEFAULT_ORG);
      return res;
    }
    throw new Error(res?.message || "Login failed");
  };

  const googleLogin = async (token) => {
    const res = await authService.googleLogin(token);
    if (res?.data?.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      setUser(res.data.user);
      setOrganization(res.data.organization || DEFAULT_ORG);
      return res;
    }
    throw new Error(res?.message || "Google Login failed");
  };

  const register = async (data) => {
    const res = await authService.register(data);
    if (res?.data?.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      setUser(res.data.user);
      setOrganization(res.data.organization || DEFAULT_ORG);
      return res;
    }
    throw new Error(res?.message || "Registration failed");
  };

  const logout = async () => {
    await authService.logout().catch(() => null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, organization, loading, login, googleLogin, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
