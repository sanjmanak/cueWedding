const DEFAULT_PATH = '/';

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return null;

  try {
    const parsed = new URL(baseUrl);
    const pathname = parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`;
    return `${parsed.origin}${pathname}`;
  } catch {
    return null;
  }
}

export function getAuthEmailLinkUrl(path = DEFAULT_PATH) {
  const configuredBase = normalizeBaseUrl(import.meta.env.VITE_AUTH_EMAIL_LINK_URL);
  const runtimeBase = normalizeBaseUrl(window.location.origin);
  const base = configuredBase || runtimeBase;

  return new URL(path.replace(/^\//, ''), base).toString();
}

