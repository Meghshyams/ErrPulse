const BASE = "";

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function patchJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function postJSON<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function clearAllLogs(projectId?: string | null): Promise<{ success: boolean }> {
  return postJSON<{ success: boolean }>("/api/clear", projectId ? { projectId } : undefined);
}

export async function fetchTrends(
  errorIds: string[],
  hours: number = 24
): Promise<Record<string, number[]>> {
  if (errorIds.length === 0) return {};
  const data = await fetchJSON<{ trends: Record<string, number[]> }>(
    `/api/errors/trends?ids=${errorIds.join(",")}&hours=${hours}`
  );
  return data.trends;
}
