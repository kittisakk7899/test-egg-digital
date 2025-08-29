"use client";
import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { signin, refreshToken } from "@/lib/api";

interface SigninResponse {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

interface AuthState {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    accessToken: Cookies.get("accessToken") || null,
    idToken: Cookies.get("idToken") || null,
    refreshToken: Cookies.get("refreshToken") || null,
    isAuthenticated: !!Cookies.get("accessToken"),
  });

  // Login
  const login = useCallback(async (username: string, password: string) => {
    const tokens: SigninResponse = await signin({ username, password });
    Cookies.set("accessToken", tokens.accessToken, { sameSite: "strict" });
    Cookies.set("idToken", tokens.idToken, { sameSite: "strict" });
    Cookies.set("refreshToken", tokens.refreshToken, { sameSite: "strict" });

    setAuth({
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  }, []);

  // Logout
  const logout = useCallback(() => {
    Cookies.remove("accessToken");
    Cookies.remove("idToken");
    Cookies.remove("refreshToken");
    setAuth({
      accessToken: null,
      idToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  }, []);

  // Refresh token
  const refresh = useCallback(async () => {
    if (!auth.refreshToken) throw new Error("No refresh token available");
    const tokens = await refreshToken(auth.refreshToken);
    Cookies.set("accessToken", tokens.accessToken, { sameSite: "strict" });
    Cookies.set("idToken", tokens.idToken, { sameSite: "strict" });
    Cookies.set("refreshToken", tokens.refreshToken, { sameSite: "strict" });

    setAuth((prev) => ({
      ...prev,
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    }));
  }, [auth.refreshToken]);

  return { auth, login, logout, refresh };
}
