import { z } from "zod";
import { AIRPORT_CODES } from "./airports";
import { CABIN_CLASSES, FARE_TYPES } from "./routes";

// 値リストの定義元は airports.ts / routes.ts。ここでは Zod スキーマに包むだけにして、
// 「TS の union」と「z.enum」を二重管理しないようにする。
export const airportCodeSchema = z.enum(AIRPORT_CODES);

export const cabinClassSchema = z.enum(CABIN_CLASSES);

export const fareTypeSchema = z.enum(FARE_TYPES);

export const FLIGHT_STATUSES = ["confirmed", "tentative"] as const;
export const flightStatusSchema = z.enum(FLIGHT_STATUSES);
export type FlightStatus = z.infer<typeof flightStatusSchema>;

const emptyToUndefined = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), s);

const optionalString = (max = 40) =>
  emptyToUndefined(
    z
      .string()
      .trim()
      .max(max, { message: `${max}文字以内で入力してください` })
      .optional()
  );

/** 出発地と到着地が同じレコードを弾く。フォーム用・CSV用の両スキーマで共有する。 */
const differentAirports = {
  check: (d: { from_airport: string; to_airport: string }) => d.from_airport !== d.to_airport,
  params: { path: ["to_airport"], message: "出発地と到着地が同じです" },
};

/**
 * フライト1件の共通フィールド。
 * status の既定値だけ用途で変えたいので、ここは status 抜きで定義する。
 */
const flightInputFields = z
  .object({
    flown_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "搭乗日は YYYY-MM-DD 形式で入力してください",
    }),
    flight_number: optionalString(10),
    from_airport: airportCodeSchema,
    to_airport: airportCodeSchema,
    cabin: cabinClassSchema,
    fare_type: emptyToUndefined(fareTypeSchema.optional()),
    pp: emptyToUndefined(z.coerce.number().int().min(0).max(20000).optional()),
    aircraft: optionalString(40),
    seat: optionalString(10),
    lounge: optionalString(40),
    rating_seat: emptyToUndefined(z.coerce.number().int().min(1).max(5).optional()),
    rating_aircraft: emptyToUndefined(z.coerce.number().int().min(1).max(5).optional()),
    rating_lounge: emptyToUndefined(z.coerce.number().int().min(1).max(5).optional()),
    notes: optionalString(2000),
  });

/**
 * フォームからの入力。status の既定は「未予約」。
 * これから乗る便を先に登録する使い方が主なため。
 */
export const flightInputSchema = flightInputFields
  .extend({ status: flightStatusSchema.default("tentative") })
  .refine(differentAirports.check, differentAirports.params);

export type FlightInput = z.infer<typeof flightInputSchema>;

/**
 * CSV取り込みの1行。status の既定は「搭乗確定」。
 * 過去実績の一括投入が前提のため、フォームとは既定値が逆になる。
 * (以前は検証済みの値ではなく生のCSV行から status を読み直していた)
 */
export const csvFlightInputSchema = flightInputFields
  .extend({ status: flightStatusSchema.default("confirmed") })
  .refine(differentAirports.check, differentAirports.params);

export type CsvFlightInput = z.infer<typeof csvFlightInputSchema>;

export const returnFlightInputSchema = z.object({
  flown_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "帰りの搭乗日は YYYY-MM-DD 形式で入力してください",
  }),
  flight_number: optionalString(10),
  cabin: cabinClassSchema.optional(),
  pp: emptyToUndefined(z.coerce.number().int().min(0).max(20000).optional()),
  aircraft: optionalString(40),
  seat: optionalString(10),
  lounge: optionalString(40),
  notes: optionalString(2000),
});

export type ReturnFlightInput = z.infer<typeof returnFlightInputSchema>;

export const flightCreateInputSchema = z
  .intersection(
    flightInputSchema,
    z.object({
      round_trip: z.boolean().optional(),
      return_flight: returnFlightInputSchema.optional(),
    })
  )
  .superRefine((d, ctx) => {
    if (!d.round_trip) return;
    if (!d.return_flight) {
      ctx.addIssue({
        code: "custom",
        path: ["return_flight"],
        message: "復路情報を入力してください",
      });
    }
  });

export type FlightCreateInput = z.infer<typeof flightCreateInputSchema>;

export interface FlightRow extends FlightInput {
  id: string;
  user_id: string;
  pp: number;
  created_at: string;
}
