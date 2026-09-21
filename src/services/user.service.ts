
import { apiClient } from "@/lib/api-client";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  role: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export const userService = {
  getUsers: async () => {
    return apiClient.get<{ success: boolean; data: UserItem[] }>("/user");
  },
  getUserById: async (id: string) => {
    return apiClient.get<{ success: boolean; data: UserItem }>(`/user/${id}`);
  },
  createUser: async (payload: CreateUserPayload) => {
    return apiClient.post<{ success: boolean; data: UserItem }>("/user", payload);
  },
  updateUser: async (id: string, payload: UpdateUserPayload) => {
    return apiClient.patch<{ success: boolean; data: UserItem }>(`/user/${id}`, payload);
  },
  deleteUser: async (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/user/${id}`);
  },
};