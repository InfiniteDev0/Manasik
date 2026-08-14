const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/** Error shape from the Spring API's GlobalExceptionHandler. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Per-field validation messages, present on 400s from @Valid failures. */
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isValidation(): boolean {
    return this.status === 400 && !!this.fieldErrors;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Bearer token. Omitted for public endpoints. */
  token?: string;
  /** Set to skip the 401 → refresh → retry cycle (used by refresh itself). */
  skipRefresh?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Refresh coordination
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The in-flight refresh, shared by every caller that needs one.
 *
 * <p>This is not an optimization — it is required for correctness. The API
 * rotates refresh tokens and treats a reused one as theft, revoking every
 * session for that user.
 *
 * <p>A dashboard firing six queries at once, all receiving 401 on an expired
 * access token, would otherwise send six refreshes with the same cookie. The
 * first rotates it; the other five present a token that no longer exists and
 * trip reuse detection — logging the user out and looking, from the server's
 * side, exactly like a stolen token.
 *
 * <p>So: the first 401 starts a refresh, everyone else awaits the same promise.
 */
let refreshInFlight: Promise<string> | null = null;

type TokenListener = (token: string | null) => void;
let onTokenChange: TokenListener = () => {};
let currentToken: string | null = null;

/** Wires the module to the auth store. Called once, from the auth provider. */
export function configureApi(getToken: () => string | null, setToken: TokenListener): void {
  currentToken = getToken();
  onTokenChange = setToken;
}

export function setAccessToken(token: string | null): void {
  currentToken = token;
}

export function getAccessToken(): string | null {
  return currentToken;
}

async function refreshAccessToken(): Promise<string> {
  // Coalesce: everyone waits on the same request.
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        // The refresh token is an HttpOnly cookie — JS cannot read or send it
        // explicitly, so the request must be allowed to carry credentials.
        credentials: 'include',
      });

      if (!response.ok) {
        throw new ApiError(response.status, 'Session expired');
      }

      const json = (await response.json()) as { data?: { accessToken?: string } };
      const token = json.data?.accessToken;
      if (!token) {
        throw new ApiError(500, 'Refresh did not return an access token');
      }
      return token;
    })();

    // Clear the slot once settled, so a later 401 starts a fresh attempt
    // rather than re-awaiting a stale (possibly rejected) promise.
    refreshInFlight.finally(() => {
      refreshInFlight = null;
    });
  }

  const token = await refreshInFlight;
  currentToken = token;
  onTokenChange(token);
  return token;
}

// ─────────────────────────────────────────────────────────────────────────────

function buildInit(options: RequestOptions, token: string | null): RequestInit {
  // `token` and `skipRefresh` are ours, not fetch's — strip them rather than
  // destructuring into unused variables, which trips no-unused-vars.
  const { body, headers, ...rest } = options;
  delete (rest as Partial<RequestOptions>).token;
  delete (rest as Partial<RequestOptions>).skipRefresh;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const finalHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((headers as Record<string, string> | undefined) ?? {}),
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  return {
    ...rest,
    credentials: 'include',
    headers: finalHeaders,
    body:
      body == null
        ? null
        : isFormData || typeof body === 'string'
          ? (body as BodyInit)
          : JSON.stringify(body),
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: {
    message?: string;
    fieldErrors?: Record<string, string>;
  } | null = null;

  try {
    payload = await response.json();
  } catch {
    // Non-JSON body (a proxy error page, say). Fall back to the status text.
  }

  return new ApiError(
    response.status,
    payload?.message ?? response.statusText ?? 'Request failed',
    payload?.fieldErrors,
  );
}

/**
 * Calls the API and unwraps the `{ data }` envelope.
 *
 * <p>On 401 it refreshes once and retries. A second 401 is final — retrying
 * again would loop.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.token ?? currentToken;

  let response = await fetch(`${BASE_URL}${path}`, buildInit(options, token));

  const canRetry =
    response.status === 401 && !options.skipRefresh && !path.startsWith('/auth/refresh');

  if (canRetry) {
    try {
      const fresh = await refreshAccessToken();
      response = await fetch(`${BASE_URL}${path}`, buildInit(options, fresh));
    } catch {
      // Refresh failed — the session is genuinely over. Surface the original
      // 401 rather than the refresh error, which is noise to the caller.
      currentToken = null;
      onTokenChange(null);
      throw await toApiError(response);
    }
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  // 204 and other empty responses have no body to parse.
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const json = (await response.json()) as { data?: T };
  return json.data as T;
}
