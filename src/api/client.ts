import type { ApiErrorPayload } from "../types";

export class ApiClientError extends Error {
  status: number;
  timestamp?: string;

  constructor(message: string, status: number, timestamp?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.timestamp = timestamp;
  }
}

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    params.set(key, String(value));
  });

  const asString = params.toString();
  return asString ? `${path}?${asString}` : path;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as ApiErrorPayload;
  return (
    typeof payload.message === "string" ||
    typeof payload.status === "number" ||
    typeof payload.timestamp === "string"
  );
}

async function parseError(response: Response): Promise<ApiClientError> {
  let message = `Request failed with status ${response.status}`;
  let timestamp: string | undefined;

  try {
    const data: unknown = await response.json();
    if (isApiErrorPayload(data)) {
      if (data.message) {
        message = data.message;
      }
      if (typeof data.timestamp === "string") {
        timestamp = data.timestamp;
      }
    }
  } catch {
    // Ignore parse issues and return fallback message.
  }

  return new ApiClientError(message, response.status, timestamp);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, headers, ...rest } = options;
  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions["query"]) =>
    request<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown, query?: RequestOptions["query"]) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, query }),
  patch: <T>(path: string, body?: unknown, query?: RequestOptions["query"]) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, query }),
};

export function toUiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status >= 500) {
      return `Server error: ${error.message}`;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}
