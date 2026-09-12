/**
 * FIX #2: Uncancellable Network Requests
 * Wraps all fetch calls with timeout to prevent indefinite hangs.
 * Timeout: 10 seconds default (configurable per call)
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number; // milliseconds, default 10000
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const timeout = options.timeout ?? 10000;
  const { timeout: _, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${url}`);
    }
    throw error;
  }
}

/**
 * Drop-in replacement for fetch() with timeout protection
 */
export const secureFetch = fetchWithTimeout;
