import type { H3Event } from "h3";
import { serverSupabaseUser } from "#supabase/server";

export async function requireUser(event: H3Event) {
  const claims = await serverSupabaseUser(event);
  if (!claims || !claims.sub) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return { id: claims.sub, email: claims.email as string | undefined, claims };
}
