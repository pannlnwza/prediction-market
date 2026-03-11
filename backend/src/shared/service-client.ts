import { AppError } from "./errors";

interface ServiceClient {
  get<T = unknown>(path: string): Promise<T>;
  post<T = unknown>(path: string, body?: unknown): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown): Promise<T>;
  delete<T = unknown>(path: string): Promise<T>;
}

async function request<T>(baseUrl: string, method: string, path: string, body?: unknown): Promise<T> {
  const serviceKey = process.env.SERVICE_KEY;
  if (!serviceKey) throw new Error("SERVICE_KEY environment variable is not set");

  const headers: Record<string, string> = {
    "X-Service-Key": serviceKey,
    "Content-Type": "application/json",
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new AppError(
      response.status,
      errorBody.error?.message ?? errorBody.message ?? "Service request failed",
      errorBody.error?.code ?? "SERVICE_ERROR"
    );
  }

  return response.json() as Promise<T>;
}

export function createServiceClient(baseUrl: string): ServiceClient {
  return {
    get: <T>(path: string) => request<T>(baseUrl, "GET", path),
    post: <T>(path: string, body?: unknown) => request<T>(baseUrl, "POST", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>(baseUrl, "PATCH", path, body),
    delete: <T>(path: string) => request<T>(baseUrl, "DELETE", path),
  };
}
