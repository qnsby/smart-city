import { apiClient } from "./client";
import type { User } from "../types";

export async function updateProfileApi(
    payload: {
        first_name?: string | null;
        surname?: string | null;
        email?: string | null;
        phone_number?: string | null;
        address?: string | null;
        new_password?: string;
    }
) {
    const body: {
        first_name?: string | null;
        surname?: string | null;
        email?: string;
        phone_number?: string | null;
        address?: string | null;
        new_password?: string;
    } = {};

    if (payload.address !== undefined) body.address = payload.address;
    if (payload.first_name !== undefined) body.first_name = payload.first_name;
    if (payload.surname !== undefined) body.surname = payload.surname;
    if (payload.phone_number !== undefined) body.phone_number = payload.phone_number;
    if (payload.email !== undefined && payload.email !== null) body.email = payload.email;
    if (payload.new_password !== undefined) body.new_password = payload.new_password;

    const { data } = await apiClient.patch<User>("/users/me", body);
    return data;
}