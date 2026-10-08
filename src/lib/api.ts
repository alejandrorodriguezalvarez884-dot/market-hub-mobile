// Calls to the portal's API. The app is known by the token it was handed when it signed in
// (market-hub-landing/src/markethub/tokens.py), sent as "Authorization: Bearer <token>": it has
// no cookie and sends none.
//
// EXPO_PUBLIC_API_URL names the portal to talk to. Left out, it is the public one; `make start
// LOCAL=1` points it at the portal running on this machine.
export const API = (process.env.EXPO_PUBLIC_API_URL || "https://themarkethub.app").replace(/\/$/, "");
// The portal's pages the app opens in a browser.
export const SITE = (process.env.EXPO_PUBLIC_SITE_URL || "https://themarkethub.app").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let token: string | null = null;
let refused: (() => void) | null = null;

export const setToken = (value: string | null) => void (token = value);
// What to do when the portal no longer takes the token (it ran out): the session signs out.
export const onRefused = (then: (() => void) | null) => void (refused = then);

type Init = { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown;
  // For a request whose 401 is about what was sent (a wrong current password), not about the
  // token: the session stays whatever the answer.
  stays?: boolean };

export async function api<T>(path: string, init: Init = {}): Promise<T> {
  const sent = token;
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (sent) headers.authorization = `Bearer ${sent}`;
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { method: init.method ?? "GET", headers, credentials: "omit",
      body: init.body === undefined ? undefined : JSON.stringify(init.body) });
  } catch {
    throw new ApiError(0, "Market Hub could not be reached. Check your connection and try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && sent && sent === token && !init.stays) refused?.();
    throw new ApiError(res.status, typeof body?.detail === "string" ? body.detail : `Request failed (${res.status}).`);
  }
  return body as T;
}

export const message = (e: unknown, fallback = "Something went wrong.") => (e instanceof Error && e.message ? e.message : fallback);
