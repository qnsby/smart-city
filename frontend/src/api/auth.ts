import { apiClient } from "./client";
import type { AuthLoginResponse, LoginPayload, RegisterPayload, User } from "../types";

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
  const { data } = await apiClient.post<{ user: User }>("/auth/register", {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: "CITIZEN"
  });
  return data;
}

export async function getMeApi() {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}
