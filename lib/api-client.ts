import type { BackendError } from "@/types/api";

function flattenMessage(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenMessage);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(flattenMessage);
  }
  return [];
}

export function normalizeApiError(payload: unknown, fallback = "Não foi possível concluir a solicitação."): string {
  if (!payload || typeof payload !== "object") return fallback;
  const error = payload as BackendError;
  const messages = flattenMessage(error.message);
  return messages.length ? messages.join(" · ") : error.error || fallback;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const error = new ApiError(normalizeApiError(payload), response.status);
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.replace("/login?session=expirada");
    }
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
