import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const authProbeClient = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    if (isFormData) {
      config.headers.delete("Content-Type");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response Interceptor: handle 401 =====
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestUrl = error.config?.url || "";
    const isAuthRequest = requestUrl.startsWith("/auth/");

    if (error.response?.status === 401 && !isAuthRequest) {
      try {
        await authProbeClient.get("/users/me");
      } catch (probeError: any) {
        if (probeError.response?.status === 401) {
          useAuthStore.getState().logout();
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
