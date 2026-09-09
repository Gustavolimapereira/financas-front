import { authenticatedBackendFetch, proxyResponse } from "@/lib/server/backend";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyResponse(await authenticatedBackendFetch(`/users/${encodeURIComponent(id)}`));
}
