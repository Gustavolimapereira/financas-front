import { NextRequest } from "next/server";
import { authenticatedBackendFetch, proxyResponse } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  return proxyResponse(
    await authenticatedBackendFetch("/financial-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    }),
  );
}

export async function GET(request: NextRequest) {
  const allowedParams = ["mesReferencia", "origem", "tipo", "pagina", "limite"] as const;
  const params = new URLSearchParams();
  for (const key of allowedParams) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return proxyResponse(await authenticatedBackendFetch(`/financial-entries${query ? `?${query}` : ""}`));
}
