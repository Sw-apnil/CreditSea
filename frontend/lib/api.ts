const API_URL = '/api';

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }

  /** Field-level messages from the validator, keyed for inline display. */
  get fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.details)) return {};
    return Object.fromEntries(
      (this.details as { field?: string; message?: string }[])
        .filter((d) => d.field && d.message)
        .map((d) => [d.field as string, d.message as string]),
    );
  }

  /** BRE rejection messages, when the server returned 422 BRE_REJECTED. */
  get breFailures(): string[] {
    const details = this.details as { failures?: { message: string }[] } | undefined;
    return details?.failures?.map((f) => f.message) ?? [];
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * credentials:'include' on every call — the JWT lives in an httpOnly cookie,
 * so there is no token for this code to read or attach by hand.
 */
export const apiFetch = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { body, headers, ...rest } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as
    | { success: boolean; data?: T; error?: ApiErrorShape }
    | null;

  if (!response.ok || !payload?.success) {
    const error = payload?.error;
    throw new ApiRequestError(
      response.status,
      error?.code ?? 'NETWORK_ERROR',
      error?.message ?? 'Could not reach the server',
      error?.details,
    );
  }

  return payload.data as T;
};

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body }),
};

export { API_URL };
