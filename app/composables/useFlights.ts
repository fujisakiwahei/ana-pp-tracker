import type { FlightInput, FlightRow } from "~~/shared/schema";

export function useFlights() {
  const list = (params: { year?: number; limit?: number; offset?: number } = {}) =>
    $fetch<{ items: FlightRow[]; total: number; year: number }>(
      "/api/flights",
      { query: params },
    );

  const get = (id: string) => $fetch<FlightRow>(`/api/flights/${id}`);

  const create = (payload: FlightInput) =>
    $fetch<FlightRow>("/api/flights", {
      method: "POST",
      body: payload,
    });

  const update = (id: string, payload: FlightInput) =>
    $fetch<FlightRow>(`/api/flights/${id}`, {
      method: "PATCH",
      body: payload,
    });

  const remove = (id: string) =>
    $fetch<{ ok: true }>(`/api/flights/${id}`, { method: "DELETE" });

  const importCsv = (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return $fetch<
      | { ok: true; inserted: number }
      | { ok: false; errors: Array<{ row: number; issues: Array<{ path: (string | number)[]; message: string }> }> }
    >("/api/flights/import", { method: "POST", body: fd });
  };

  return { list, get, create, update, remove, importCsv };
}
