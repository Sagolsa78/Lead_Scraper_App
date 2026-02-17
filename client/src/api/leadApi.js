import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5005/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

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
  getHealth: async () => {
    const response = await api.get("/health");
    return response.data;
  },
};

export default api;
