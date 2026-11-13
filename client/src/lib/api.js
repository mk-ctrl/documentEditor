// Thin fetch wrapper around our Express API.
// - Prefixes /api
// - Sends JSON and attaches the user's Supabase access token (wired up in Phase 1)
// - Turns non-2xx responses into thrown errors carrying the server's message and status

let getToken = async () => null;

/** Called once by the auth layer so every request carries the current access token. */
export function setTokenProvider(fn) {
  getToken = fn;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const token = await getToken();
  const isForm = body instanceof FormData;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(isForm || body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Network error: could not reach the server.', 0);
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}
