import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5005/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — attempt token refresh or redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken },
          );
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefresh);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear tokens
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export const authService = {
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
  login: async (data) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },
  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    await api.post("/auth/logout", { refreshToken }).catch(() => null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
  me: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export const leadService = {
  generateLeads: async (params) => {
    const response = await api.post("/leads/generate", params);
    return response.data;
  },
  searchLeads: async (data) => {
    const response = await api.post("/leads/search", data);
    return response.data;
  },
  getLeads: async (params) => {
    const response = await api.get("/leads", { params });
    return response.data;
  },
  sendWhatsApp: async (data) => {
    const response = await api.post("/whatsapp/send", data);
    return response.data;
  },
  bulkSendWhatsApp: async (data) => {
    const response = await api.post("/whatsapp/bulk-send", data);
    return response.data;
  },
  getSettings: async () => {
    const response = await api.get("/whatsapp/settings");
    return response.data;
  },
  updateSettings: async (data) => {
    const response = await api.post("/whatsapp/settings", data);
    return response.data;
  },
  getJobStatus: async (id) => {
    const response = await api.get(`/leads/jobs/${id}`);
    return response.data;
  },
  getHealth: async () => {
    const response = await api.get("/health");
    return response.data;
  },
};

export default api;
