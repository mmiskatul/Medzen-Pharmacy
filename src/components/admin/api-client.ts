"use client";

/**
 * Thin fetch wrapper for the admin API. Unwraps the shared envelope and
 * turns a failure into an ApiError carrying the message the server chose,
 * so callers never have to inspect status codes to show something useful.
 */

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: FieldErrors;
};

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};

  const response = await fetch(path, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...rest.headers,
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
  });

  let payload: Envelope<T>;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError(
      "The server returned an unexpected response.",
      response.status,
    );
  }

  if (!response.ok || !payload.ok) {
    if (response.status === 401) {
      // The session ended; send the user back to sign in rather than
      // leaving them clicking a dead screen.
      window.location.assign(
        `/admin/login?next=${encodeURIComponent(window.location.pathname)}`,
      );
    }
    throw new ApiError(
      payload.error ?? "That action could not be completed.",
      response.status,
      payload.fieldErrors,
    );
  }

  return payload.data as T;
}

export type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json?: unknown) =>
    request<T>(path, { method: "POST", json }),
  patch: <T>(path: string, json?: unknown) =>
    request<T>(path, { method: "PATCH", json }),
  remove: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: async (file: File, folder: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: form,
    });
    const payload = (await response.json()) as Envelope<{
      key: string;
      url: string;
    }>;
    if (!response.ok || !payload.ok || !payload.data) {
      throw new ApiError(
        payload.error ?? "The image could not be uploaded.",
        response.status,
      );
    }
    return payload.data;
  },
};
