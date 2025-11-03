// Forces all relative fetch() calls to go to your API base (Render)
// and always send cookies for session-based auth.

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const originalFetch = window.fetch.bind(window);

function toStringUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  // input could be a Request
  // @ts-expect-error - Request not typed here
  return input.url as string;
}

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  let url = toStringUrl(input);

  // If caller used a relative path ("/api/..."), prefix with API_BASE
  if (url.startsWith("/")) {
    url = API_BASE + url;
  }

  // Ensure credentials are included for cross-site cookies
  const merged: RequestInit = { credentials: "include", ...(init || {}) };

  return originalFetch(url, merged);
};
