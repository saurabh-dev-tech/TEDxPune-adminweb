"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAuthToken, setUnauthorizedHandler } from "@/lib/api";
import {
  buildAuthUser,
  decodeToken,
  getToken,
  getUser,
  isAdminRole,
  isTokenExpired,
  removeToken,
  removeUser,
  saveToken,
  saveUser,
} from "@/lib/auth";
import type { AuthUser, LoginUser } from "@/types";

interface AuthContextValue {
  /** Merged JWT claims + display profile (fullName, email, avatarUrl). */
  authUser: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, loginUser: LoginUser) => { ok: boolean; error?: string };
  logout: () => void;
  updateUserProfile: (updates: { avatarUrl?: string; fullName?: string }) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    removeToken();
    removeUser();
    setToken(null);
    setAuthUser(null);
    setAuthToken(null);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // Rehydrate session from localStorage on mount.
  useEffect(() => {
    const stored = getToken();
    const storedUser = getUser();
    if (!stored || !storedUser) {
      setIsLoading(false);
      return;
    }

    const decoded = decodeToken(stored);
    if (!decoded || isTokenExpired(decoded) || !isAdminRole(decoded)) {
      removeToken();
      removeUser();
      setIsLoading(false);
      return;
    }

    setToken(stored);
    setAuthUser(buildAuthUser(decoded, storedUser));
    setAuthToken(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (accessToken: string, loginUser: LoginUser): { ok: boolean; error?: string } => {
      const decoded = decodeToken(accessToken);
      if (!decoded) return { ok: false, error: "Invalid token." };
      if (isTokenExpired(decoded)) return { ok: false, error: "Token has expired." };
      if (!isAdminRole(decoded))
        return { ok: false, error: "Access Denied: Admin privileges required." };

      saveToken(accessToken);
      saveUser(loginUser);
      setAuthToken(accessToken);
      setToken(accessToken);
      setAuthUser(buildAuthUser(decoded, loginUser));
      return { ok: true };
    },
    []
  );

  const updateUserProfile = useCallback(
    (updates: { avatarUrl?: string; fullName?: string }) => {
      const currentStoredUser = getUser();
      if (!currentStoredUser) return;

      const updatedUser: LoginUser = {
        ...currentStoredUser,
        ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
        ...(updates.fullName !== undefined ? { fullName: updates.fullName } : {}),
      };

      saveUser(updatedUser);

      setAuthUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
          ...(updates.fullName !== undefined ? { fullName: updates.fullName } : {}),
        };
      });
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        authUser,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
