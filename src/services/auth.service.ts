import { apiClient } from "@/lib/api-client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const res = await apiClient.post<LoginResponseData>("/auth/login", payload);
    
    if (res.data?.token) {
      localStorage.setItem("auth-token", res.data.token);
      localStorage.setItem("user-data", JSON.stringify(res.data));
    }
    
    return res.data;
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("auth-token");
      localStorage.removeItem("user-data");
    }
  },
};