export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.toString() || "http://localhost:3000";

export const USE_MSW = import.meta.env.VITE_USE_MSW === "true";

export const STORAGE_KEYS = {
  token: "smart_city_jwt",
  user: "smart_city_user"
} as const;
