import { NextRequest } from "next/server";
import { publicProxy } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  return publicProxy("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
