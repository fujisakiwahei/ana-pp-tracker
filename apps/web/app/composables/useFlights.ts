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

  /**
   * CSV 取り込み。
   *
   * 行ごとの検証エラーは 400 + `{ ok: false, errors }` で返ってくる。
   * $fetch は非 2xx で例外にしてボディを捨ててしまうため、そのままだと
   * 画面に出せるのが「400 Bad Request」だけになり、どの行が悪いのか分からない。
   * ステータスを見て自分で振り分ける。
   */
  const importCsv = async (file: File): Promise<ImportResponse> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await $fetch.raw<ImportResponse>(apiUrl("/flights/import"), {
      method: "POST",
      headers: authHeaders(),
      body: fd,
      ignoreResponseError: true,
    });

    const body = res._data;
    if (body && "ok" in body) return body;

    // 認証エラーやサーバ障害。ボディは { error: { message } } なので、
    // そのまま渡せば toErrorMessage が文言を拾える。
    throw createError({ statusCode: res.status, data: body });
  };

  /** サンプルCSVは認証不要。<a href download> から直接開く。 */
  const sampleCsvUrl = () => apiUrl("/flights/sample-csv");

  return { list, get, create, update, remove, importCsv, sampleCsvUrl };
}
