export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | object | null;
  token?: string;
  onTokenRefreshed?: (token: string) => void;
  onRefreshFailed?: () => void;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

function buildInit(
  options: ApiFetchOptions,
  token: string | undefined,
): RequestInit {
  const { body, headers, ...rest } = options;
  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((headers as Record<string, string> | undefined) ?? {}),
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let finalBody: BodyInit | null | undefined;
  if (body == null) {
    finalBody = null;
  } else if (isFormData || typeof body === 'string') {
    finalBody = body as BodyInit;
  } else {
    finalBody = JSON.stringify(body);
  }

  return {
    ...rest,
    credentials: 'include',
    headers: finalHeaders,
    body: finalBody,
  };
}

async function safeJson(
  response: Response,
): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { token, onTokenRefreshed, onRefreshFailed } = options;

  let response = await fetch(`${BASE_URL}${path}`, buildInit(options, token));

  // 401 → try /auth/refresh once, retry the original request with the new token.
  // Guard against recursing on the refresh endpoint itself.
  if (response.status === 401 && path !== '/auth/refresh') {
    const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!refreshResponse.ok) {
      onRefreshFailed?.();
      const body = await safeJson(response);
      throw new ApiError(
        response.status,
        (body?.message as string) ?? 'Unauthorized',
      );
    }

    const refreshBody = (await refreshResponse.json()) as {
      data?: { accessToken?: string };
    };
    const newAccessToken = refreshBody?.data?.accessToken;

    if (!newAccessToken) {
      onRefreshFailed?.();
      throw new ApiError(401, 'Refresh did not return an access token');
    }

    onTokenRefreshed?.(newAccessToken);

    response = await fetch(
      `${BASE_URL}${path}`,
      buildInit(options, newAccessToken),
    );
  }

  if (!response.ok) {
    const body = await safeJson(response);
    throw new ApiError(
      response.status,
      (body?.message as string) ?? response.statusText,
    );
  }

  const json = (await response.json()) as { data?: T };
  return json.data as T;
}
