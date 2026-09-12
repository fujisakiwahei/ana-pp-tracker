import type { AirportCode, CabinClass, FareType } from "./routes";
import type { FlightStatus } from "./schema";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * flights テーブルの実際の列。
 *
 * 型の強さは DB の制約に合わせてある。
 * - cabin / status … SQL の CHECK 制約があるので union で表せる
 * - from_airport / to_airport … 制約は char_length = 3 だけなので string
 * - fare_type … 制約なしなので string | null
 *
 * アプリが読み書きするときの型は下の FlightRow / FlightInsert を使う。
 *
 * ※ interface ではなく type で定義すること。interface には暗黙の
 *   インデックスシグネチャが付かず、supabase-js の
 *   `Tables: Record<string, GenericTable>` 制約を満たせないため、
 *   スキーマ全体が never に落ちて型付けが無効になる。
 */
export type FlightDbRow = {
  id: string;
  user_id: string;
  flown_at: string;
  flight_number: string | null;
  from_airport: string;
  to_airport: string;
  cabin: CabinClass;
  fare_type: string | null;
  pp: number;
  status: FlightStatus;
  aircraft: string | null;
  seat: string | null;
  lounge: string | null;
  rating_seat: number | null;
  rating_aircraft: number | null;
  rating_lounge: number | null;
  notes: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      flights: {
        Row: FlightDbRow;
        Insert: Omit<FlightDbRow, "id" | "created_at"> &
          Partial<Pick<FlightDbRow, "id" | "created_at">>;
        Update: Partial<Omit<FlightDbRow, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: { [k: string]: never };
    Functions: { [k: string]: never };
    Enums: { [k: string]: never };
    CompositeTypes: { [k: string]: never };
  };
};

type FlightsTable = Database["public"]["Tables"]["flights"];

/**
 * アプリが扱うフライト1件。
 *
 * 空港コードと運賃種別は DB 上ただの text だが、書き込みは必ず
 * flightInputSchema / csvFlightInputSchema を通るので、読み出し側では
 * AirportCode / FareType として扱ってよい。
 * (AIRPORTS[row.from_airport] のような参照がこの前提に乗っている)
 */
export type FlightRow = Omit<
  FlightsTable["Row"],
  "from_airport" | "to_airport" | "fare_type"
> & {
  from_airport: AirportCode;
  to_airport: AirportCode;
  fare_type: FareType | null;
};

/** insert 1件ぶんの列。server/utils/flightRow.ts が組み立てる。 */
export type FlightInsert = FlightsTable["Insert"];

/** update で変更しうる列。id / user_id / created_at は対象外。 */
export type FlightUpdate = FlightsTable["Update"];

/**
 * 保存済みの行をアプリ用の型 (FlightRow) に絞る。
 *
 * 書き込みは必ず flightInputSchema / csvFlightInputSchema を通るので、
 * 保存されている空港コードと運賃種別は AirportCode / FareType に収まっている。
 * ただし DB 側の制約は char_length = 3 までなので、型の上では絞り込みが要る。
 * その前提をここ1箇所に集約し、各ハンドラに `as FlightRow[]` を散らさない。
 *
 * DB に CHECK 制約を足せばこの関数は不要になるが、既存データの検証が
 * 必要になるため別途対応とする。
 */
export const asFlightRow = (row: FlightDbRow): FlightRow => row as FlightRow;
export const asFlightRows = (rows: FlightDbRow[]): FlightRow[] => rows as FlightRow[];
