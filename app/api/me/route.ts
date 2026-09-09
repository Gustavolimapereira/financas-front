import { NextRequest } from "next/server";
import { authenticatedBackendFetch, proxyResponse } from "@/lib/server/backend";

export async function GET() {
  return proxyResponse(await authenticatedBackendFetch("/users/me"));
}

export async function PATCH(request: NextRequest) {
  return proxyResponse(
    await authenticatedBackendFetch("/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    }),
  );
}
