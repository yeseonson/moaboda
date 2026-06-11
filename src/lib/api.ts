import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  records: {
    list: (params?: { category?: string; sub_category?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return fetchWithAuth(`/records${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => fetchWithAuth(`/records/${id}`),
    create: (body: unknown) =>
      fetchWithAuth("/records", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: unknown) =>
      fetchWithAuth(`/records/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) =>
      fetchWithAuth(`/records/${id}`, { method: "DELETE" }),
  },
  search: {
    performances: (q: string) => fetchWithAuth(`/search/performances?q=${encodeURIComponent(q)}`),
    performanceDetail: (kopisId: string) => fetchWithAuth(`/search/performances/${kopisId}`),
  },
  stats: {
    summary: () => fetchWithAuth("/stats/summary"),
    monthly: (year: number) => fetchWithAuth(`/stats/monthly?year=${year}`),
  },
};
