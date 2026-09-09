import { NextRequest, NextResponse } from "next/server";
import { backendFetch, setTokenCookies } from "@/lib/server/backend";
import type { LoginResponse } from "@/types/api";

export async function POST(request: NextRequest) {
  const backendResponse = await backendFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });

  if (!backendResponse.ok) {
    return new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = (await backendResponse.json()) as LoginResponse;
  const response = NextResponse.json({ user: payload.user });
  setTokenCookies(response, payload);
  return response;
}
