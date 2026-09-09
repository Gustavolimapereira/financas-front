import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, backendFetch, clearTokenCookies } from "@/lib/server/backend";
import type { AuthTokens } from "@/types/api";

export async function POST() {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (accessToken && refreshToken) {
    try {
      const logoutResponse = await backendFetch("/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ refreshToken }),
      });
      if (logoutResponse.status === 401) {
        const refreshResponse = await backendFetch("/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshResponse.ok) {
          const rotated = (await refreshResponse.json()) as AuthTokens;
          await backendFetch("/auth/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${rotated.accessToken}` },
            body: JSON.stringify({ refreshToken: rotated.refreshToken }),
          });
        }
      }
    } catch {
      // Cookies are cleared even when the backend is temporarily unavailable.
    }
  }

  const response = new NextResponse(null, { status: 204 });
  clearTokenCookies(response);
  return response;
}
