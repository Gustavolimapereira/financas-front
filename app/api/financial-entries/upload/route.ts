import { NextRequest } from "next/server";
import { authenticatedBackendFetch, proxyResponse } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  return proxyResponse(
    await authenticatedBackendFetch("/financial-entries/upload", {
      method: "POST",
      body: formData,
    }),
  );
}
