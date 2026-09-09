import { NextRequest } from "next/server";
import { authenticatedBackendFetch, proxyResponse } from "@/lib/server/backend";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("mesReferencia");
  const query = new URLSearchParams();
  if (month) query.set("mesReferencia", month);
  return proxyResponse(await authenticatedBackendFetch(`/financial-entries/summary?${query}`));
}
