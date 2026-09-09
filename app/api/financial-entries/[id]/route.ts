import { NextRequest } from "next/server";
import { authenticatedBackendFetch, proxyResponse } from "@/lib/server/backend";

type Context = { params: Promise<{ id: string }> };

function entryPath(id: string) {
  return `/financial-entries/${encodeURIComponent(id)}`;
}

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  return proxyResponse(await authenticatedBackendFetch(entryPath(id)));
}

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return proxyResponse(await authenticatedBackendFetch(entryPath(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  }));
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  return proxyResponse(await authenticatedBackendFetch(entryPath(id), { method: "DELETE" }));
}
