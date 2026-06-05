import { jwtDecode } from "jwt-decode";
import type { AuthUser, JWTClaims, LoginUser } from "@/types";

const TOKEN_KEY = "tedx_admin_token";
const USER_KEY  = "tedx_admin_user";

// ─── Token helpers ─────────────────────────────────────────────────────────

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── User-profile helpers (persisted alongside the token) ──────────────────

export function saveUser(user: LoginUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): LoginUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as LoginUser) : null;
  } catch {
    return null;
  }
}

export function removeUser() {
  localStorage.removeItem(USER_KEY);
}

// ─── JWT helpers ────────────────────────────────────────────────────────────

export function decodeToken(token: string): JWTClaims | null {
  try {
    return jwtDecode<JWTClaims>(token);
  } catch {
    return null;
  }
}

export function isAdminRole(claims: JWTClaims): boolean {
  return claims.role === "ADMIN" || claims.role === "SUPER_ADMIN";
}

export function isSuperAdmin(claims: JWTClaims): boolean {
  return claims.role === "SUPER_ADMIN";
}

export function isTokenExpired(claims: JWTClaims): boolean {
  return Date.now() >= claims.exp * 1000;
}

// ─── Merge JWT claims + login-user profile into one AuthUser ────────────────

export function buildAuthUser(claims: JWTClaims, user: LoginUser): AuthUser {
  return {
    ...claims,
    fullName: user.fullName,
    email:    user.email,
    avatarUrl: user.avatarUrl,
  };
}
