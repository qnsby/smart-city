import { apiClient } from "./client";
import type { AuthLoginResponse, LoginPayload, RegisterPayload, User } from "../types";
import { STORAGE_KEYS } from "../utils/constants";

export async function loginApi(payload: LoginPayload) {
  const login = payload.login.trim();
  const { data } = await apiClient.post<AuthLoginResponse>("/auth/login", {
    name: login,
    email: login,
    password: payload.password
  });
  return data;
}

export async function registerApi(payload: RegisterPayload) {
  void payload;
  // Current backend does not implement registration.
  throw new Error("Registration endpoint is not available on the current backend");
}

export async function getMeApi() {
  // Current backend does not expose GET /me; use the cached session user.
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) {
    throw new Error("Current backend does not expose /me and no cached user is available");
  }
  return JSON.parse(raw) as User;
}
