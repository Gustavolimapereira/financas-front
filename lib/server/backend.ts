import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AuthTokens } from "@/types/api";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookies";

export { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookies";

const baseUrl = () => (process.env.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export async function backendFetch(path: string, init: RequestInit = {}) {
  return fetch(`${baseUrl()}${path}`, { ...init, cache: "no-store" });
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setTokenCookies(response: NextResponse, tokens: AuthTokens) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 });
}

export function clearTokenCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

async function refreshSession(): Promise<AuthTokens | null> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  const response = await backendFetch("/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return null;
  return response.json() as Promise<AuthTokens>;
}

export interface AuthenticatedResult {
  response: Response;
  refreshedTokens: AuthTokens | null;
  sessionExpired: boolean;
}

export async function authenticatedBackendFetch(path: string, init: RequestInit = {}): Promise<AuthenticatedResult> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  const withToken = (token?: string): RequestInit => ({
    ...init,
    headers: { ...Object.fromEntries(new Headers(init.headers).entries()), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  let response = await backendFetch(path, withToken(accessToken));
  if (response.status !== 401) return { response, refreshedTokens: null, sessionExpired: false };

  const refreshedTokens = await refreshSession();
  if (!refreshedTokens) return { response, refreshedTokens: null, sessionExpired: true };

  response = await backendFetch(path, withToken(refreshedTokens.accessToken));
  return { response, refreshedTokens, sessionExpired: response.status === 401 };
}

export async function proxyResponse(result: AuthenticatedResult): Promise<NextResponse> {
  const body = result.response.status === 204 ? null : await result.response.text();
  const response = new NextResponse(body, {
    status: result.response.status,
    headers: body ? { "Content-Type": result.response.headers.get("content-type") || "application/json" } : undefined,
  });
  if (result.refreshedTokens) setTokenCookies(response, result.refreshedTokens);
  if (result.sessionExpired) clearTokenCookies(response);
  return response;
}

export async function publicProxy(path: string, init: RequestInit) {
  const backendResponse = await backendFetch(path, init);
  const body = backendResponse.status === 204 ? null : await backendResponse.text();
  return new NextResponse(body, {
    status: backendResponse.status,
    headers: body ? { "Content-Type": backendResponse.headers.get("content-type") || "application/json" } : undefined,
  });
}
