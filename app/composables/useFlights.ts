import type { FlightCreateInput, FlightInput, FlightRow } from "@ana/core/schema";

export interface FlightListResponse {
  items: FlightRow[];
  total: number;
  year: number;
}

export type ImportResponse =
  | { ok: true; inserted: number }
  | {
      ok: false;
      errors: Array<{ row: number; issues: Array<{ path: (string | number)[]; message: string }> }>;
    };

export function useFlights() {
  const { apiUrl, authHeaders } = useApi();

  const list = (params: { year?: number; limit?: number; offset?: number } = {}) =>
    $fetch<FlightListResponse>(apiUrl("/flights"), { headers: authHeaders(), query: params });

  const get = (id: string) =>
    $fetch<FlightRow>(apiUrl(`/flights/${id}`), { headers: authHeaders() });

  const create = (payload: FlightCreateInput) =>
    $fetch<FlightRow | FlightRow[]>(apiUrl("/flights"), {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    });

  const update = (id: string, payload: FlightInput) =>
    $fetch<FlightRow>(apiUrl(`/flights/${id}`), {
      method: "PATCH",
      headers: authHeaders(),
      body: payload,
    });

  const remove = (id: string) =>
    $fetch<{ ok: true }>(apiUrl(`/flights/${id}`), { method: "DELETE", headers: authHeaders() });

  const importCsv = (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return $fetch<ImportResponse>(apiUrl("/flights/import"), {
      method: "POST",
      headers: authHeaders(),
      body: fd,
    });
  };

  /** サンプルCSVは認証不要。<a href download> から直接開く。 */
  const sampleCsvUrl = () => apiUrl("/flights/sample-csv");

  return { list, get, create, update, remove, importCsv, sampleCsvUrl };
}
