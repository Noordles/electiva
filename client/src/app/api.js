let csrfToken;
export const setCsrfToken = value => { csrfToken = value; };
export async function api(route, { method = 'GET', body, signal, quiet401 = false } = {}) {
  const timeout = AbortSignal.timeout(10000);
  const response = await fetch('/api/v1' + route, { method, credentials: 'same-origin', signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(method !== 'GET' && csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    if (response.status === 401 && !quiet401) window.dispatchEvent(new Event('electiva-session-expired'));
    const error = new Error(result?.error?.message ?? 'Something went wrong. Please try again.');
    error.status = response.status; error.requestId = result?.error?.requestId; throw error;
  }
  return result;
}
