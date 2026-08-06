export interface FlightPPTotals {
  /** 往路のPP */
  outbound: number;
  /** 復路のPP (往復でなければ 0) */
  inbound: number;
  /** 記録時に加算される合計PP */
  added: number;
}

/**
 * フォームで記録したときに加算されるPPを求める。
 *
 * 往路・復路とも「手入力の上書きがあればそれを優先し、無ければ自動計算値」。
 * 以前は表示用 (ppDisplay) と達成率用 (addedPP) で別々に計算しており、
 * 前者だけ手入力の上書きを見ていなかったため、同じ画面の2箇所が
 * 違う数字を出しうる状態だった。ここに一本化する。
 */
export function resolvePPTotals(input: {
  outboundAuto: number | null;
  outboundOverride?: number | null;
  isRoundTrip: boolean;
  inboundPP?: number | null;
}): FlightPPTotals {
  const outbound = input.outboundOverride ?? input.outboundAuto ?? 0;
  const inbound = input.isRoundTrip ? (input.inboundPP ?? 0) : 0;
  return { outbound, inbound, added: outbound + inbound };
}
