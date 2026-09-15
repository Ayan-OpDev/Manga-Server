export class UpstreamTimeoutError extends Error {
  public status = 504;

  constructor(message = 'Upstream timeout') {
    super(message);
    this.name = 'UpstreamTimeoutError';
  }
}

export interface FetchTimeoutOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Executes a native fetch request with an AbortController timeout.
 * Defaults to 8000ms timeout threshold.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  let didTimeout = false;

  const timer = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  // Link caller signal if provided
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (didTimeout || error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new UpstreamTimeoutError('Upstream timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch and parse JSON with strict timeout enforcement.
 */
export async function fetchJson<T = any>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<T> {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Upstream HTTP ${response.status}: ${body.slice(0, 200)}`);
  }
  return (await response.json()) as T;
}

/**
 * Fetch and return response text (e.g. for HTML parsing) with strict timeout enforcement.
 */
export async function fetchText(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<string> {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  if (!response.ok) {
    throw new Error(`Upstream HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.text();
}
