export const API_URL = "/api";
export const hasApi = () => Boolean(API_URL);

export async function request(path, { method = "GET", body, headers = {}, signal } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    signal,
    headers: { ...(body != null ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const type = res.headers.get("content-type") || "";
  const data = res.status === 204 ? {} : type.includes("application/json") ? await res.json().catch(() => ({})) : { message: await res.text().catch(() => "") };
  if (!res.ok) {
    const err = new Error(data.message || data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
