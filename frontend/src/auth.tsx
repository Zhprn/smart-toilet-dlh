import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient, ApiError } from "./lib/api-client";

export interface User {
  id: string;
  nama: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");

    if (token) {
      apiClient
        .get<{ valid: boolean; user: User }>("/auth/validate-token")
        .then((result) => {
          if (result.data?.valid) {
            setUser(result.data.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("auth-token");
          }
        })
        .catch(() => {
          localStorage.removeItem("auth-token");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const login = async (email: string, password: string) => {
    try {
      const result = await apiClient.post<{ auth_token: string; user: User }>(
        "/auth/login",
        { email, password }
      );

      const { auth_token, user } = result.data;

      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem("auth-token", auth_token);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || "Authentication failed");
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("auth-token");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
